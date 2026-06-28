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
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, Attendee } from "@/context/AppContext";
import { RadarAnimation } from "@/components/RadarAnimation";
import { TerminalCard, TerminalRow } from "@/components/TerminalCard";
import { GlitchLabel } from "@/components/HackerText";
import {
  requestBLEPermissions,
  startBLEAdvertising,
  stopBLEAdvertising,
} from "@/services/BLEService";

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function AttendeeRow({ attendee, index }: { attendee: Attendee; index: number }) {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rssi = attendee.signalStrength;
  const bars = Math.max(1, Math.min(5, Math.round((rssi + 90) / 10)));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={[styles.attendeeRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.indexBadge, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.indexText, { color: colors.primary }]}>
            {String(index + 1).padStart(2, "0")}
          </Text>
        </View>
        <View style={styles.attendeeInfo}>
          <Text style={[styles.attendeeName, { color: colors.primary }]}>{attendee.name}</Text>
          <Text style={[styles.attendeeId, { color: colors.mutedForeground }]}>{attendee.studentId}</Text>
        </View>
        <View style={styles.attendeeRight}>
          <View style={styles.signalBars}>
            {[1, 2, 3, 4, 5].map((b) => (
              <View
                key={b}
                style={[
                  styles.bar,
                  {
                    backgroundColor: b <= bars ? colors.primary : colors.border,
                    height: 4 + b * 3,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.rssiText, { color: colors.accent }]}>{rssi}dB</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function SessionMonitor() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { sessions, terminateSession, refreshSessions } = useApp();
  const [elapsed, setElapsed] = useState(0);
  const [bleStatus, setBleStatus] = useState<"idle" | "broadcasting" | "error">("idle");
  const session = sessions.find((s) => s.id === sessionId);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - (session?.startTime ?? Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.startTime]);

  useEffect(() => {
    if (!session?.isActive) return;
    const interval = setInterval(refreshSessions, 3000);
    return () => clearInterval(interval);
  }, [session?.isActive]);

  useEffect(() => {
    if (!session?.isActive || Platform.OS === "web") return;

    let mounted = true;
    (async () => {
      const granted = await requestBLEPermissions();
      if (!mounted) return;
      if (!granted) {
        setBleStatus("error");
        return;
      }
      const ok = await startBLEAdvertising(session.sessionCode, session.courseCode);
      if (!mounted) return;
      setBleStatus(ok ? "broadcasting" : "error");
    })();

    return () => {
      mounted = false;
      stopBLEAdvertising();
    };
  }, [session?.isActive, session?.sessionCode]);

  const handleTerminate = () => {
    Alert.alert(
      "TERMINATE SESSION",
      "CONFIRM BROADCAST TERMINATION. THIS ACTION CANNOT BE UNDONE.",
      [
        { text: "ABORT", style: "cancel" },
        {
          text: "TERMINATE",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await stopBLEAdvertising();
            await terminateSession(sessionId ?? "");
            router.back();
          },
        },
      ]
    );
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={[styles.notFound, { color: colors.destructive }]}>SESSION NOT FOUND</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>← RETURN</Text>
        </Pressable>
      </View>
    );
  }

  const bleColor =
    bleStatus === "broadcasting"
      ? colors.primary
      : bleStatus === "error"
      ? colors.destructive
      : colors.mutedForeground;

  const bleLabel =
    bleStatus === "broadcasting"
      ? "● BLE TRANSMITTING"
      : bleStatus === "error"
      ? "! BLE PERMISSION DENIED"
      : Platform.OS === "web"
      ? "~ WEB PREVIEW MODE"
      : "○ INITIALIZING BLE...";

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
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <GlitchLabel
            text={session.name}
            style={{ fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: 2 }}
          />
          <Text style={[styles.headerSub, { color: colors.accent }]}>
            {session.courseCode} • {session.bluetoothId}
          </Text>
        </View>
        {session.isActive && (
          <Pressable
            onPress={handleTerminate}
            style={({ pressed }) => [
              styles.terminateBtn,
              { borderColor: colors.destructive, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="square" size={14} color={colors.destructive} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={session.attendees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        ListHeaderComponent={
          <View>
            <View style={styles.radarSection}>
              <RadarAnimation size={200} active={session.isActive} />
              <View style={styles.radarInfo}>
                <Text style={[styles.elapsedText, { color: colors.primary }]}>
                  {formatTime(elapsed)}
                </Text>
                <View
                  style={[
                    styles.liveIndicator,
                    {
                      backgroundColor: session.isActive ? colors.primary + "22" : colors.border,
                      borderColor: session.isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.liveText, { color: session.isActive ? colors.primary : colors.mutedForeground }]}>
                    {session.isActive ? "● BROADCASTING" : "○ OFFLINE"}
                  </Text>
                </View>
                <Text style={[styles.bleStatusText, { color: bleColor }]}>
                  {bleLabel}
                </Text>
              </View>
            </View>

            {/* SESSION CODE — prominent display for students */}
            {session.isActive && (
              <View style={[styles.sessionCodeBox, { borderColor: colors.primary, backgroundColor: colors.primary + "11" }]}>
                <Text style={[styles.sessionCodeLabel, { color: colors.accent }]}>
                  {"// SESSION CODE — SHOW TO STUDENTS //"}
                </Text>
                <Text style={[styles.sessionCodeValue, { color: colors.primary }]}>
                  {session.sessionCode}
                </Text>
                <Text style={[styles.sessionCodeHint, { color: colors.dim }]}>
                  {"Students scanning nearby will see this code via BLE"}
                </Text>
              </View>
            )}

            <TerminalCard label="TRANSMISSION INFO" style={{ marginHorizontal: 16 }}>
              <TerminalRow label="DEVICE ID" value={session.bluetoothId} />
              <TerminalRow label="SESSION CODE" value={session.sessionCode} valueColor={colors.primary} />
              <TerminalRow label="LOCATION" value={session.location} />
              <TerminalRow label="LECTURER" value={session.lecturerName} />
              <TerminalRow label="PROTOCOL" value="BLE 5.0 / AES-256" />
            </TerminalCard>

            <View style={[styles.countRow, { borderColor: colors.border }]}>
              <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                AGENTS CONFIRMED
              </Text>
              <Text style={[styles.countNum, { color: colors.primary }]}>
                {session.attendees.length}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <AttendeeRow attendee={item} index={index} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.dim }]}>
              {">"} SCANNING FOR AGENTS...
            </Text>
            {session.isActive && (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                STUDENTS WITHIN RANGE WILL APPEAR HERE
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerSub: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, marginTop: 2 },
  terminateBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingTop: 0 },
  radarSection: { alignItems: "center", paddingVertical: 24, gap: 16 },
  radarInfo: { alignItems: "center", gap: 8 },
  elapsedText: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  liveIndicator: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 10, paddingVertical: 4 },
  liveText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  bleStatusText: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 1.5, marginTop: 4 },
  sessionCodeBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  sessionCodeLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  sessionCodeValue: { fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: 10 },
  sessionCodeHint: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5, textAlign: "center" },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 2,
    padding: 14,
    marginBottom: 8,
  },
  countLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  countNum: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  indexBadge: { width: 32, height: 32, borderRadius: 2, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  indexText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  attendeeInfo: { flex: 1 },
  attendeeName: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  attendeeId: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, marginTop: 1 },
  attendeeRight: { alignItems: "flex-end", gap: 4 },
  signalBars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 4, borderRadius: 1 },
  rssiText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  emptyContainer: { paddingVertical: 40, paddingHorizontal: 20, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", letterSpacing: 2 },
  emptyHint: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 1, textAlign: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 16 },
  backLink: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
});
