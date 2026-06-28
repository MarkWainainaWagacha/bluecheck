import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";

export default function RoleSelect() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUser } = useApp();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState<"lecturer" | "student" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleProceed = async () => {
    if (!name.trim()) { setError("OPERATOR NAME REQUIRED"); return; }
    if (role === "student" && !studentId.trim()) { setError("STUDENT ID REQUIRED"); return; }
    if (!role) { setError("SELECT OPERATOR CLASS"); return; }
    setError("");
    setLoading(true);
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    await setUser({ id, name: name.trim().toUpperCase(), role, studentId: studentId.trim().toUpperCase() });
    if (role === "lecturer") router.replace("/lecturer/index");
    else router.replace("/student/index");
    setLoading(false);
  };

  const selectRole = (r: "lecturer" | "student") => {
    setRole(r);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 30),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: colors.accent }]}>
            {"// NEURAL IDENTIFICATION PROTOCOL //"}
          </Text>
          <Text style={[styles.title, { color: colors.primary }]}>
            IDENTITY MATRIX
          </Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            SELECT OPERATOR CLASS AND PROVIDE CREDENTIALS
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Name Input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {">"} OPERATOR NAME
          </Text>
          <View style={[styles.inputWrapper, { borderColor: name ? colors.primary : colors.border, backgroundColor: colors.card }]}>
            <Feather name="user" size={14} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.primary }]}
              value={name}
              onChangeText={setName}
              placeholder="ENTER FULL NAME"
              placeholderTextColor={colors.dim}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Role Selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {">"} OPERATOR CLASS
          </Text>
          <View style={styles.roleRow}>
            <RoleCard
              title="LECTURER"
              subtitle="COMMAND MODE"
              icon="radio"
              selected={role === "lecturer"}
              onPress={() => selectRole("lecturer")}
              colors={colors}
            />
            <RoleCard
              title="STUDENT"
              subtitle="FIELD AGENT"
              icon="wifi"
              selected={role === "student"}
              onPress={() => selectRole("student")}
              colors={colors}
            />
          </View>
        </View>

        {/* Student ID */}
        {role === "student" && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {">"} AGENT SERIAL (STUDENT ID)
            </Text>
            <View style={[styles.inputWrapper, { borderColor: studentId ? colors.primary : colors.border, backgroundColor: colors.card }]}>
              <Feather name="hash" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.primary }]}
                value={studentId}
                onChangeText={setStudentId}
                placeholder="ENTER STUDENT ID"
                placeholderTextColor={colors.dim}
                autoCapitalize="characters"
              />
            </View>
          </View>
        )}

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {"! "}{error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleProceed}
          disabled={loading}
          style={({ pressed }) => [
            styles.proceedBtn,
            {
              backgroundColor: role ? colors.primary : colors.border,
              opacity: loading ? 0.5 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.proceedText, { color: role ? colors.background : colors.mutedForeground }]}>
            {loading ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
          </Text>
        </Pressable>

        <Text style={[styles.footer, { color: colors.dim }]}>
          {"// DATA ENCRYPTED AES-256 //"}
        </Text>
      </ScrollView>
    </View>
  );
}

function RoleCard({
  title, subtitle, icon, selected, onPress, colors,
}: {
  title: string; subtitle: string; icon: any; selected: boolean; onPress: () => void; colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleCard,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.card : colors.background,
          borderLeftWidth: selected ? 3 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name={icon} size={22} color={selected ? colors.primary : colors.mutedForeground} />
      <Text style={[styles.roleTitle, { color: selected ? colors.primary : colors.mutedForeground }]}>
        {title}
      </Text>
      <Text style={[styles.roleSubtitle, { color: selected ? colors.accent : colors.dim }]}>
        {subtitle}
      </Text>
      {selected && (
        <Text style={[styles.selectedMark, { color: colors.primary }]}>{"[ SELECTED ]"}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { alignItems: "center", marginBottom: 30 },
  subtitle: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 4, marginBottom: 8 },
  desc: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 1, textAlign: "center" },
  divider: { height: 1, marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", letterSpacing: 1 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 2,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  roleTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  roleSubtitle: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 1 },
  selectedMark: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 4 },
  error: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 12 },
  proceedBtn: {
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  proceedText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  footer: { textAlign: "center", fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 2 },
});
