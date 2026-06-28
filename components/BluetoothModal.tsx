import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Session } from "@/context/AppContext";

interface BluetoothModalProps {
  visible: boolean;
  session: Session | null;
  onConfirm: () => void;
  onAbort: () => void;
}

const HANDSHAKE_LINES = [
  "SCANNING BLUETOOTH FREQUENCIES...",
  "TARGET DEVICE LOCATED",
  "INITIATING HANDSHAKE PROTOCOL v4.1",
  "VERIFYING PROXIMITY SIGNATURE...",
  "SIGNAL AUTHENTICATED",
  "AWAITING NEURAL AUTHORIZATION",
];

export function BluetoothModal({
  visible,
  session,
  onConfirm,
  onAbort,
}: BluetoothModalProps) {
  const colors = useColors();
  const [lines, setLines] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!visible) {
      setLines([]);
      setReady(false);
      return;
    }
    setLines([]);
    setReady(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < HANDSHAKE_LINES.length) {
        setLines((prev) => [...prev, HANDSHAKE_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setReady(true), 400);
      }
    }, 420);

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 800, useNativeDriver: false }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [visible]);

  if (!session) return null;

  const signalBars = Math.floor(Math.random() * 3) + 2;
  const distance = (Math.random() * 8 + 1).toFixed(1);
  const rssi = -(Math.floor(Math.random() * 30) + 45);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              borderColor: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.primary + "66", colors.primary],
              }),
              backgroundColor: colors.card,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerIcon, { color: colors.accent }]}>⬡</Text>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>
              BLUETOOTH SYNC REQUEST
            </Text>
            <Text style={[styles.headerIcon, { color: colors.accent }]}>⬡</Text>
          </View>

          {/* Session Info */}
          <View style={[styles.infoBlock, { borderColor: colors.border }]}>
            <InfoRow label="TARGET" value={session.lecturerName} colors={colors} />
            <InfoRow label="SESSION" value={session.name} colors={colors} />
            <InfoRow label="COURSE" value={session.courseCode} colors={colors} />
            <InfoRow label="DEVICE ID" value={session.bluetoothId} colors={colors} highlight />
            <InfoRow label="LOCATION" value={session.location} colors={colors} />
          </View>

          {/* Signal Info */}
          <View style={[styles.signalBlock, { borderColor: colors.border }]}>
            <View style={styles.signalRow}>
              <Text style={[styles.signalLabel, { color: colors.mutedForeground }]}>RSSI</Text>
              <Text style={[styles.signalValue, { color: colors.accent }]}>{rssi} dBm</Text>
              <View style={styles.bars}>
                {[1, 2, 3, 4, 5].map((b) => (
                  <View
                    key={b}
                    style={[
                      styles.bar,
                      {
                        backgroundColor: b <= signalBars ? colors.primary : colors.border,
                        height: 6 + b * 3,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.signalRow}>
              <Text style={[styles.signalLabel, { color: colors.mutedForeground }]}>PROXIMITY</Text>
              <Text style={[styles.signalValue, { color: colors.warning }]}>
                CONFIRMED [{distance}m]
              </Text>
            </View>
          </View>

          {/* Terminal Lines */}
          <View style={[styles.terminal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {lines.map((line, i) => (
              <View key={i} style={styles.terminalLine}>
                <Text style={[styles.terminalPrefix, { color: colors.accent }]}>{">"}</Text>
                <Text style={[styles.terminalText, { color: i === lines.length - 1 ? colors.primary : colors.mutedForeground }]}>
                  {" "}{line}
                </Text>
              </View>
            ))}
            {lines.length < HANDSHAKE_LINES.length && (
              <View style={styles.terminalLine}>
                <Text style={[styles.terminalPrefix, { color: colors.accent }]}>{">"}</Text>
                <Text style={[styles.terminalText, { color: colors.primary }]}> ▌</Text>
              </View>
            )}
          </View>

          {/* Buttons */}
          {ready && (
            <View style={styles.buttons}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.abortBtn,
                  { borderColor: colors.destructive, opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={onAbort}
              >
                <Text style={[styles.btnText, { color: colors.destructive }]}>
                  ✕ ABORT
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.confirmBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={onConfirm}
              >
                <Text style={[styles.btnText, { color: colors.background }]}>
                  ⚡ CONNECT
                </Text>
              </Pressable>
            </View>
          )}

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.dim }]}>
            {"// PSYOPS ATTENDANCE SYSTEM v4.1.0 //"}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

function InfoRow({
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
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          { color: highlight ? colors.accent : colors.primary },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1.5,
    borderRadius: 2,
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIcon: { fontSize: 16 },
  headerTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
  },
  infoBlock: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    flex: 0.4,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    flex: 0.6,
    textAlign: "right",
  },
  signalBlock: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signalLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    width: 80,
  },
  signalValue: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    flex: 1,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: { width: 5, borderRadius: 1 },
  terminal: {
    margin: 12,
    padding: 10,
    borderWidth: 1,
    minHeight: 90,
    gap: 3,
  },
  terminalLine: { flexDirection: "row" },
  terminalPrefix: { fontSize: 11, fontFamily: "Inter_700Bold" },
  terminalText: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  buttons: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 2,
  },
  abortBtn: { borderWidth: 1 },
  confirmBtn: {},
  btnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  footer: {
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    paddingBottom: 10,
  },
});
