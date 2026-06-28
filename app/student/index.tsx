import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, Session } from "@/context/AppContext";
import { RadarAnimation } from "@/components/RadarAnimation";
import { GlitchLabel } from "@/components/HackerText";
import {
  requestBLEPermissions,
  startBLEScanning,
  DiscoveredBeacon,
} from "@/services/BLEService";

interface SignalItem {
  type: "session" | "beacon";
  session?: Session;
  beacon?: DiscoveredBeacon;
  enrolled: boolean;
}

function MetaChip({ icon, label, colors }: { icon: any; label: string; colors: any }) {
  return (
    <View style={styles.metaChip}>
      <Feather name={icon} size={10} color={colors.mutedForeground} />
      <Text style={[styles.metaLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function SignalRow({ item, colors }: { item: SignalItem; colors: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rssi = item.session
    ? -(Math.floor(Math.random() * 40) + 45)
    : item.beacon?.rssi ?? -75;
  const bars = Math.max(1, Math.min(5, Math.round((rssi + 90) / 10)));
  const distance = ((Math.abs(rssi) - 40) / 5).toFixed(1);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handlePress = () => {
    Haptics.selectionAsync();
    if (item.session) {
      router.push(`/student/${item.session.id}`);
    } else if (item.beacon) {
      router.push(`/student/beacon?code=${item.beacon.sessionCode}&course=${item.beacon.courseCode}&rssi=${item.beacon.rssi}`);
    }
  };

  const name = item.session?.name ?? `SESSION ${item.beacon?.sessionCode}`;
  const code = item.session?.courseCode ?? item.beacon?.courseCode ?? "UNKNOWN";
  const lecturer = item.session?.lecturerName ?? "DETECTED VIA BLE";
  const location = item.session?.location ?? `${distance}m RANGE`;
  const deviceId = item.session?.bluetoothId ?? item.beacon?.deviceId?.slice(-8).toUpperCase() ?? "UNKNOWN";
  const isBleOnly = item.type === "beacon";

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.signalCard,
          {
            backgroundColor: item.enrolled
              ? colors.primary + "11"
              : isBleOnly
              ? colors.accent + "08"
              : colors.card,
            borderColor: item.enrolled
              ? colors.primary
              : isBleOnly
              ? colors.accent
              : colors.border,
            borderLeftColor: item.enrolled
              ? colors.primary
              : isBleOnly
              ? colors.accent
              : colors.accent,
            borderLeftWidth: 3,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <View style={styles.signalTop}>
          <View style={styles.signalLeft}>
            <Text style={[styles.sessionName, { color: item.enrolled ? colors.primary : colors.foreground }]}>
              {name}
            </Text>
            <Text style={[styles.courseCode, { color: colors.accent }]}>{code}</Text>
            {isBleOnly && (
              <Text style={[styles.bleOnlyTag, { color: colors.accent }]}>
                {"◉ BLE SIGNAL DETECTED"}
              </Text>
            )}
          </View>
          <View style={styles.signalRight}>
            <View style={styles.bars}>
              {[1, 2, 3, 4, 5].map((b) => (
                <View
                  key={b}
                  style={[
                    styles.bar,
                    {
                      backgroundColor:
                        b <= bars
                          ? item.enrolled
                            ? colors.primary
                            : colors.accent
                          : colors.border,
                      height: 5 + b * 3,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.rssi, { color: colors.mutedForeground }]}>{rssi}dB</Text>
          </View>
        </View>

        <View style={styles.signalMeta}>
          <MetaChip icon="user" label={lecturer} colors={colors} />
          <MetaChip icon="map-pin" label={location} colors={colors} />
          <MetaChip icon="bluetooth" label={`~${distance}m`} colors={colors} />
        </View>

        <View style={styles.signalFooter}>
          <Text style={[styles.deviceId, { color: colors.dim }]}>{deviceId}</Text>
          {item.enrolled ? (
            <View style={[styles.enrolledBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Text style={[styles.enrolledText, { color: colors.primary }]}>✓ ENROLLED</Text>
            </View>
          ) : (
            <Text style={[styles.tapText, { color: isBleOnly ? colors.accent : colors.accent }]}>
              TAP TO ENROLL →
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function StudentScanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, sessions, refreshSessions, clearUser } = useApp();
  const [bleGranted, setBleGranted] = useState<boolean | null>(null);
  const [discoveredBeacons, setDiscoveredBeacons] = useState<Map<string, DiscoveredBeacon>>(new Map());
  const scanTextAnim = useRef(new Animated.Value(1)).current;
  const stopScanRef = useRef<(() => void) | null>(null);

  const activeSessions = sessions.filter((s) => s.isActive);
  const enrolledIds = sessions
    .filter((s) => s.attendees.some((a) => a.id === user?.id))
    .map((s) => s.id);

  useFocusEffect(useCallback(() => { refreshSessions(); }, []));

  useEffect(() => {
    const interval = setInterval(refreshSessions, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanTextAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(scanTextAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      setBleGranted(false);
      return;
    }
    let mounted = true;
    (async () => {
      const granted = await requestBLEPermissions();
      if (!mounted) return;
      setBleGranted(granted);
      if (!granted) {
        Alert.alert(
          "BLUETOOTH REQUIRED",
          "Enable Bluetooth permissions to scan for attendance sessions.",
          [{ text: "OK" }]
        );
        return;
      }

      const stopFn = await startBLEScanning((beacon) => {
        if (!mounted) return;
        setDiscoveredBeacons((prev) => {
          const next = new Map(prev);
          next.set(beacon.deviceId, beacon);
          return next;
        });
      });
      stopScanRef.current = stopFn;
    })();

    return () => {
      mounted = false;
      stopScanRef.current?.();
      stopScanRef.current = null;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDiscoveredBeacons((prev) => {
        const next = new Map(prev);
        for (const [id, beacon] of next) {
          if (now - beacon.lastSeen > 15000) next.delete(id);
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    stopScanRef.current?.();
    await clearUser();
    router.replace("/role-select");
  };

  const sessionCodes = new Set(activeSessions.map((s) => s.sessionCode));

  const items: SignalItem[] = [
    ...activeSessions.map((s) => ({
      type: "session" as const,
      session: s,
      enrolled: enrolledIds.includes(s.id),
    })),
    ...[...discoveredBeacons.values()]
      .filter((b) => !sessionCodes.has(b.sessionCode))
      .map((b) => ({
        type: "beacon" as const,
        beacon: b,
        enrolled: false,
      })),
  ];

  const bleStatusLabel =
    Platform.OS === "web"
      ? "WEB PREVIEW — BLE DISABLED"
      : bleGranted === null
      ? "REQUESTING PERMISSIONS..."
      : bleGranted
      ? "BLE SCAN ACTIVE"
      : "BLE PERMISSION DENIED";

  const bleStatusColor =
    bleGranted === true ? colors.primary : bleGranted === false ? colors.destructive : colors.dim;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerSub, { color: colors.accent }]}>{"// FIELD AGENT MODE //"}</Text>
          <GlitchLabel
            text={`AGENT: ${user?.name ?? "UNKNOWN"}`}
            style={{ fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: 2 }}
          />
          {user?.studentId && (
            <Text style={[styles.studentId, { color: colors.dim }]}>ID: {user.studentId}</Text>
          )}
        </View>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.iconBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="log-out" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.session?.id ?? item.beacon?.deviceId ?? Math.random().toString()
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        ListHeaderComponent={
          <View>
            <View style={styles.radarSection}>
              <RadarAnimation size={180} active={bleGranted !== false} />
              <Animated.Text
                style={[styles.scanLabel, { color: colors.primary, opacity: scanTextAnim }]}
              >
                {"SCANNING FREQUENCIES..."}
              </Animated.Text>
              <Text style={[styles.bleStatus, { color: bleStatusColor }]}>
                {"◉ "}{bleStatusLabel}
              </Text>
            </View>

            <View style={[styles.statsRow, { borderColor: colors.border }]}>
              <StatBox label="SIGNALS" value={`${items.length}`} colors={colors} highlight />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatBox label="BLE LIVE" value={`${discoveredBeacons.size}`} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatBox label="ENROLLED" value={`${enrolledIds.length}`} colors={colors} />
            </View>

            {items.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.accent }]}>
                {"─── ACTIVE TRANSMISSIONS ───"}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => <SignalRow item={item} colors={colors} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bluetooth" size={44} color={colors.dim} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              NO SIGNALS DETECTED
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.dim }]}>
              ENSURE BLUETOOTH IS ENABLED AND{"\n"}YOU ARE WITHIN CLASS RANGE
            </Text>
          </View>
        }
      />
    </View>
  );
}

function StatBox({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: highlight ? colors.primary : colors.accent }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.dim }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerSub: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 4 },
  studentId: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 2, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 2, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  radarSection: { alignItems: "center", paddingVertical: 20, gap: 10 },
  scanLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  bleStatus: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 12 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  statLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, marginTop: 2 },
  statDivider: { width: 1 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 12,
  },
  signalCard: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 14,
    marginBottom: 10,
  },
  signalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  signalLeft: { flex: 1 },
  sessionName: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  courseCode: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 2 },
  bleOnlyTag: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1, marginTop: 4 },
  signalRight: { alignItems: "flex-end", gap: 4 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 5, borderRadius: 1 },
  rssi: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  signalMeta: { flexDirection: "row", gap: 12, marginBottom: 8, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  signalFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deviceId: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 1 },
  enrolledBadge: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2 },
  enrolledText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  tapText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  emptyDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 20,
  },
});
