import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TerminalCardProps {
  children: React.ReactNode;
  label?: string;
  onPress?: () => void;
  style?: object;
  active?: boolean;
  danger?: boolean;
}

export function TerminalCard({
  children,
  label,
  onPress,
  style,
  active,
  danger,
}: TerminalCardProps) {
  const colors = useColors();

  const borderColor = danger
    ? colors.destructive
    : active
    ? colors.primary
    : colors.border;
  const accentColor = danger ? colors.destructive : colors.accent;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor,
          borderLeftColor: active || danger ? borderColor : colors.dim,
          borderLeftWidth: active || danger ? 3 : 1,
        },
        style,
      ]}
    >
      {label && (
        <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export function TerminalRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: valueColor ?? colors.primary }]}>
        {value}
      </Text>
    </View>
  );
}

export function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLine, { color: colors.dim }]}>
        {"─".repeat(4)}
      </Text>
      <Text style={[styles.sectionTitle, { color: colors.accent }]}>
        {" "}{title}{" "}
      </Text>
      <Text style={[styles.sectionLine, { color: colors.dim }]}>
        {"─".repeat(4)}
      </Text>
    </View>
  );
}

export function HackerButton({
  label,
  onPress,
  variant,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "ghost";
  disabled?: boolean;
}) {
  const colors = useColors();
  const bg =
    variant === "danger"
      ? colors.destructive
      : variant === "ghost"
      ? "transparent"
      : colors.primary;
  const textColor =
    variant === "ghost"
      ? colors.primary
      : variant === "danger"
      ? "#fff"
      : colors.background;
  const border =
    variant === "ghost"
      ? colors.border
      : variant === "danger"
      ? colors.destructive
      : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  rowValue: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  sectionLine: {
    flex: 1,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  button: {
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
