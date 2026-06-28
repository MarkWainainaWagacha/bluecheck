import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const LOCATIONS = ["BLOCK A - ROOM 101", "BLOCK B - LAB 2", "LECTURE HALL 3", "SEMINAR ROOM 4", "ONLINE", "OUTDOOR QUAD"];

export default function CreateSession() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createSession } = useApp();
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("SESSION NAME REQUIRED"); return; }
    if (!courseCode.trim()) { setError("COURSE CODE REQUIRED"); return; }
    const loc = location === "CUSTOM" ? customLocation.trim() : location;
    if (!loc) { setError("LOCATION REQUIRED"); return; }
    setError("");
    setLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const session = await createSession({
        name: name.trim().toUpperCase(),
        courseCode: courseCode.trim().toUpperCase(),
        location: loc.toUpperCase(),
      });
      router.replace(`/lecturer/${session.id}`);
    } catch (e) {
      setError("INITIALIZATION FAILED. RETRY.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>BACK</Text>
        </Pressable>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={[styles.sub, { color: colors.accent }]}>
            {"// TRANSMISSION SETUP //"}
          </Text>
          <Text style={[styles.title, { color: colors.primary }]}>
            INITIALIZE BROADCAST
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Form */}
        <Field label="SESSION NAME" hint="E.G. 'CS101 MORNING LECTURE'">
          <InputField
            value={name}
            onChange={setName}
            placeholder="ENTER SESSION NAME"
            colors={colors}
            autoCapitalize="characters"
          />
        </Field>

        <Field label="COURSE CODE" hint="E.G. 'CS101', 'MTH202'">
          <InputField
            value={courseCode}
            onChange={setCourseCode}
            placeholder="ENTER COURSE CODE"
            colors={colors}
            autoCapitalize="characters"
          />
        </Field>

        <Field label="BROADCAST LOCATION" hint="SELECT CLASSROOM / VENUE">
          <View style={styles.locationGrid}>
            {[...LOCATIONS, "CUSTOM"].map((loc) => (
              <Pressable
                key={loc}
                onPress={() => {
                  setLocation(loc);
                  Haptics.selectionAsync();
                }}
                style={({ pressed }) => [
                  styles.locChip,
                  {
                    borderColor: location === loc ? colors.primary : colors.border,
                    backgroundColor: location === loc ? colors.primary + "22" : colors.card,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.locText, { color: location === loc ? colors.primary : colors.mutedForeground }]}>
                  {loc}
                </Text>
              </Pressable>
            ))}
          </View>
          {location === "CUSTOM" && (
            <InputField
              value={customLocation}
              onChange={setCustomLocation}
              placeholder="ENTER CUSTOM LOCATION"
              colors={colors}
              autoCapitalize="characters"
            />
          )}
        </Field>

        {/* Preview */}
        <View style={[styles.previewBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.previewTitle, { color: colors.accent }]}>
            {"[ BLE BROADCAST PREVIEW ]"}
          </Text>
          <Text style={[styles.previewLine, { color: colors.mutedForeground }]}>
            {"> DEVICE ID:  AR-XXXX-XXXX (auto-generated)"}
          </Text>
          <Text style={[styles.previewLine, { color: colors.mutedForeground }]}>
            {"> RANGE:      ~10-30 METERS"}
          </Text>
          <Text style={[styles.previewLine, { color: colors.mutedForeground }]}>
            {"> PROTOCOL:   BLUETOOTH LE 5.0"}
          </Text>
          <Text style={[styles.previewLine, { color: colors.mutedForeground }]}>
            {"> CIPHER:     AES-256 ENCRYPTED"}
          </Text>
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{"! "}{error}</Text>
        ) : null}

        <Pressable
          onPress={handleCreate}
          disabled={loading}
          style={({ pressed }) => [
            styles.createBtn,
            {
              backgroundColor: loading ? colors.border : colors.primary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="radio" size={16} color={loading ? colors.mutedForeground : colors.background} />
          <Text style={[styles.createText, { color: loading ? colors.mutedForeground : colors.background }]}>
            {loading ? "BROADCASTING..." : "START TRANSMISSION"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{">"} {label}</Text>
      <Text style={[styles.fieldHint, { color: colors.dim }]}>{hint}</Text>
      {children}
    </View>
  );
}

function InputField({ value, onChange, placeholder, colors, autoCapitalize }: any) {
  return (
    <View style={[styles.inputWrap, { borderColor: value ? colors.primary : colors.border, backgroundColor: colors.card }]}>
      <TextInput
        style={[styles.input, { color: colors.primary }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.dim}
        autoCapitalize={autoCapitalize ?? "none"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  titleBlock: { marginBottom: 16 },
  sub: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  divider: { height: 1, marginBottom: 24 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 4 },
  fieldHint: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, marginBottom: 8 },
  inputWrap: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 12 },
  input: { fontSize: 13, fontFamily: "Inter_400Regular", letterSpacing: 1 },
  locationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  locChip: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 10, paddingVertical: 7 },
  locText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  previewBox: { borderWidth: 1, borderRadius: 2, padding: 14, marginBottom: 16 },
  previewTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8 },
  previewLine: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.5, lineHeight: 20 },
  error: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 12 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 2,
    marginTop: 8,
  },
  createText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 3 },
});
