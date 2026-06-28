import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { BluetoothModal } from "@/components/BluetoothModal";
import { TerminalCard, TerminalRow } from "@/components/TerminalCard";

export default function StudentSession() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user, sessions, enrollInSession, refreshSessions } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const session = sessions.find((s) => s.id === sessionId);
  const alreadyEnrolled = session?.attendees.some((a) => a.id === user?.id) ?? false;
  const signalStrength = useRef(-(Math.floor(Math.random() * 30) + 45)).current;

  useEffect(() => {
    if (alreadyEnrolled || enrolled) {
      setEnrolled(true);
      Animated.timing(successAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [alreadyEnrolled, enrolled]);

  const handleEnrollPress = async () => {
    if (!session?.isActive) {
      Alert.alert("SESSION OFFLINE", "THIS BROADCAST HAS BEEN TERMINATED.");
      return;
    }
    Haptics.selectionAsync();
    setModalVisible(true);
  };

  const handleConfirmEnroll = async () => {
    if (!user || !session) return;
    setModalVisible(false);
    setEnrolling(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const signalStrength = -(Math.floor(Math.random() * 30) + 45);
      await enrollInSession(session.id, {
        id: user.id,
        name: user.name,
        studentId: user.studentId ?? user.id,
        signalStrength,
      });
      await refreshSessions();
      setEnrolled(true);
    } catch {
      Alert.alert("ENROLLMENT FAILED", "SIGNAL LOST. RETRY.");
    }
    setEnrolling(false);
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={[styles.notFound, { color: colors.destructive }]}>SESSION NOT FOUND</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>← RETURN TO SCANNER</Text>
        </Pressable>
      </View>
    );
  }

  const bars = Math.max(1, Math.min(5, Math.round((signalStrength + 90) / 10)));
  const distance = ((Math.abs(signalStrength) - 40) / 5).toFixed(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Bluetooth Enrollment Modal */}
      <BluetoothModal
        visible={modalVisible}
        session={session}
        onConfirm={handleConfirmEnroll}
        onAbort={() => setModalVisible(false)}
      />

      {/* Header */}
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
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>SCANNER</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },
        ]}
      >
        {/* Session Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.sessionName, { color: colors.primary }]}>
            {session.name}
          </Text>
          <Text style={[styles.courseCode, { color: colors.accent }]}>
            {session.courseCode}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: session.isActive ? colors.primary + "22" : colors.border,
                borderColor: session.isActive ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: session.isActive ? colors.primary : colors.mutedForeground }]}>
              {session.isActive ? "● TRANSMISSION ACTIVE" : "○ OFFLINE"}
            </Text>
          </View>
        </View>

        {/* Signal Visualization */}
        <View style={[styles.signalViz, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.signalTitle, { color: colors.accent }]}>
            {"[ SIGNAL ANALYSIS ]"}
          </Text>
          <View style={styles.signalRow}>
            <View style={styles.barsLarge}>
              {[1, 2, 3, 4, 5].map((b) => (
                <View
                  key={b}
                  style={[
                    styles.barLarge,
                    {
                      backgroundColor: b <= bars ? colors.primary : colors.border,
                      height: 10 + b * 8,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.signalStats}>
              <Text style={[styles.signalStat, { color: colors.primary }]}>{signalStrength} dBm</Text>
              <Text style={[styles.signalStatLabel, { color: colors.dim }]}>RSSI</Text>
              <Text style={[styles.signalStat, { color: colors.accent }]}>{distance}m</Text>
              <Text style={[styles.signalStatLabel, { color: colors.dim }]}>RANGE</Text>
            </View>
          </View>
          <View style={styles.proximityRow}>
            <Feather name="check-circle" size={12} color={colors.primary} />
            <Text style={[styles.proximityText, { color: colors.primary }]}>
              PROXIMITY VERIFIED — WITHIN AUTHORIZED RANGE
            </Text>
          </View>
        </View>

        {/* Session Info */}
        <TerminalCard label="TRANSMISSION DATA">
          <TerminalRow label="DEVICE ID" value={session.bluetoothId} />
          <TerminalRow label="INSTRUCTOR" value={session.lecturerName} />
          <TerminalRow label="LOCATION" value={session.location} />
          <TerminalRow label="PROTOCOL" value="BLE 5.0 / AES-256" />
          <TerminalRow
            label="AGENTS ENROLLED"
            value={`${session.attendees.length}`}
            valueColor={colors.accent}
          />
        </TerminalCard>

        {/* Enrolled Success State */}
        {(enrolled || alreadyEnrolled) ? (
          <Animated.View
            style={[
              styles.successBox,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primary + "11",
                opacity: successAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Feather name="check" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.primary }]}>
              NEURAL SYNC COMPLETE
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              ATTENDANCE CONFIRMED
            </Text>
            <Text style={[styles.successAgent, { color: colors.accent }]}>
              AGENT: {user?.name}
            </Text>
            <Text style={[styles.successId, { color: colors.dim }]}>
              {user?.studentId ?? user?.id}
            </Text>
          </Animated.View>
        ) : (
          /* Enroll Button */
          <View style={styles.enrollSection}>
            <Text style={[styles.enrollHint, { color: colors.dim }]}>
              {">"} BLUETOOTH CONNECTION REQUIRED FOR ENROLLMENT
            </Text>
            <Pressable
              onPress={handleEnrollPress}
              disabled={enrolling || !session.isActive}
              style={({ pressed }) => [
                styles.enrollBtn,
                {
                  backgroundColor: !session.isActive
                    ? colors.border
                    : enrolling
                    ? colors.primary + "55"
                    : colors.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather
                name="bluetooth"
                size={18}
                color={!session.isActive ? colors.mutedForeground : colors.background}
              />
              <Text
                style={[
                  styles.enrollText,
                  { color: !session.isActive ? colors.mutedForeground : colors.background },
                ]}
              >
                {enrolling
                  ? "SYNCHRONIZING..."
                  : !session.isActive
                  ? "SESSION OFFLINE"
                  : "INITIATE BLUETOOTH SYNC"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  titleSection: { marginBottom: 20, alignItems: "flex-start", gap: 6 },
  sessionName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  courseCode: { fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  signalViz: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 16,
    marginBottom: 12,
  },
  signalTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 14 },
  signalRow: { flexDirection: "row", alignItems: "flex-end", gap: 20, marginBottom: 12 },
  barsLarge: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  barLarge: { width: 14, borderRadius: 2 },
  signalStats: { flex: 1, gap: 2 },
  signalStat: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  signalStatLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 6 },
  proximityRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  proximityText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  enrollSection: { marginTop: 8 },
  enrollHint: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, marginBottom: 10 },
  enrollBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 2,
  },
  enrollText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  successBox: {
    borderWidth: 1.5,
    borderRadius: 2,
    padding: 28,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  successSub: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  successAgent: { fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginTop: 8 },
  successId: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 2 },
  notFound: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 16 },
  backLink: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
});
