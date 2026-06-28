import React, { useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, Session } from "@/context/AppContext";
import { GlitchLabel } from "@/components/HackerText";
import { TerminalCard, TerminalRow, SectionHeader, HackerButton } from "@/components/TerminalCard";

function formatDuration(startTime: number, endTime?: number): string {
  const ms = (endTime ?? Date.now()) - startTime;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function SessionItem({ session }: { session: Session }) {
  const colors = useColors();
  return (
    <TerminalCard
      active={session.isActive}
      onPress={() => router.push(`/lecturer/${session.id}`)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleRow}>
          <Text style={[styles.sessionName, { color: colors.primary }]}>
            {session.name}
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
            <Text
              style={[
                styles.statusText,
                { color: session.isActive ? colors.primary : colors.mutedForeground },
              ]}
            >
              {session.isActive ? "● LIVE" : "○ ENDED"}
            </Text>
          </View>
        </View>
        <Text style={[styles.courseCode, { color: colors.accent }]}>
          {session.courseCode}
        </Text>
      </View>
      <View style={styles.sessionMeta}>
        <TerminalRow label="DEVICE" value={session.bluetoothId} />
        <TerminalRow label="LOCATION" value={session.location} />
        <TerminalRow
          label="DURATION"
          value={formatDuration(session.startTime, session.endTime)}
        />
        <TerminalRow
          label="AGENTS CONFIRMED"
          value={`${session.attendees.length} ENROLLED`}
          valueColor={
            session.attendees.length > 0 ? colors.accent : colors.mutedForeground
          }
        />
      </View>
      <View style={styles.tapHint}>
        <Feather name="chevron-right" size={12} color={colors.dim} />
        <Text style={[styles.tapText, { color: colors.dim }]}>TAP TO VIEW</Text>
      </View>
    </TerminalCard>
  );
}

export default function LecturerDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, sessions, refreshSessions, clearUser } = useApp();

  const mySessions = sessions
    .filter((s) => s.lecturerId === user?.id)
    .sort((a, b) => b.startTime - a.startTime);
  const activeSessions = mySessions.filter((s) => s.isActive);
  const pastSessions = mySessions.filter((s) => !s.isActive);

  useFocusEffect(useCallback(() => { refreshSessions(); }, []));

  const handleLogout = async () => {
    await clearUser();
    router.replace("/role-select");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View>
          <Text style={[styles.headerSub, { color: colors.accent }]}>
            {"// COMMAND CENTER //"}
          </Text>
          <GlitchLabel
            text={`OPERATOR: ${user?.name ?? "UNKNOWN"}`}
            style={{ fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 2 }}
          />
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/lecturer/create")}
            style={({ pressed }) => [
              styles.createBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color={colors.background} />
          </Pressable>
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
      </View>

      <FlatList
        data={[...activeSessions, ...pastSessions]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshSessions}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Stats row */}
            <View style={[styles.statsRow, { borderColor: colors.border }]}>
              <StatBox label="LIVE" value={`${activeSessions.length}`} colors={colors} highlight />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatBox label="TOTAL" value={`${mySessions.length}`} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatBox
                label="AGENTS"
                value={`${mySessions.reduce((a, s) => a + s.attendees.length, 0)}`}
                colors={colors}
              />
            </View>

            {mySessions.length === 0 && (
              <View style={styles.empty}>
                <Feather name="radio" size={40} color={colors.dim} />
                <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                  NO SESSIONS DETECTED
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.dim }]}>
                  INITIALIZE A BROADCAST TO BEGIN TRACKING
                </Text>
                <HackerButton label="+ INITIALIZE BROADCAST" onPress={() => router.push("/lecturer/create")} />
              </View>
            )}

            {activeSessions.length > 0 && (
              <SectionHeader title="ACTIVE TRANSMISSIONS" />
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const isFirstPast = !item.isActive && (index === 0 || activeSessions.some((a, i) => i === index - activeSessions.length));
          return (
            <>
              {isFirstPast && pastSessions.length > 0 && item.id === pastSessions[0].id && (
                <SectionHeader title="ARCHIVE" />
              )}
              <SessionItem session={item} />
            </>
          );
        }}
        ListFooterComponent={
          mySessions.length > 0 ? (
            <HackerButton
              label="+ NEW BROADCAST"
              onPress={() => router.push("/lecturer/create")}
              variant="ghost"
            />
          ) : null
        }
      />
    </View>
  );
}

function StatBox({ label, value, colors, highlight }: { label: string; value: string; colors: any; highlight?: boolean }) {
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
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  createBtn: { width: 40, height: 40, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: 40, height: 40, borderRadius: 2, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 2,
    marginVertical: 12,
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 12 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  statLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 2, marginTop: 2 },
  statDivider: { width: 1 },
  sessionHeader: { marginBottom: 8 },
  sessionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  sessionName: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: 1, flex: 1 },
  courseCode: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  statusBadge: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  statusText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  sessionMeta: { gap: 2, marginBottom: 6 },
  tapHint: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  tapText: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 1 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  emptyDesc: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 1, textAlign: "center", paddingHorizontal: 40 },
});
