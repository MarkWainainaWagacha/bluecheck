import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const BOOT_LINES = [
  "PSYOPS ATTENDANCE SYSTEM v4.1.0",
  "COPYRIGHT (C) NEURAL SYSTEMS INC",
  "",
  "BIOS: INITIALIZING HARDWARE MATRIX..............OK",
  "RAM: 4096MB NEURAL MEMORY DETECTED............OK",
  "BLUETOOTH: LE MODULE ACTIVE [2.4 GHz]..........OK",
  "GPS: TRIANGULATION SUBSYSTEM LOADED............OK",
  "CRYPTO: AES-256 CIPHER INITIALIZED.............OK",
  "NET: DARK FIBER LINK ESTABLISHED...............OK",
  "",
  "LOADING ATTENDANCE RADAR CORE..................",
  "LOADING PROXIMITY MODULES......................OK",
  "LOADING SIGNAL PARSER..........................OK",
  "LOADING NEURAL INTERFACE.......................OK",
  "",
  "> ALL SYSTEMS NOMINAL",
  "> WELCOME, OPERATOR",
  "> AWAITING IDENTITY CONFIRMATION...",
];

export default function BootScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setVisibleLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
        scrollRef.current?.scrollToEnd({ animated: true });
      } else {
        clearInterval(interval);
        setDone(true);
        setTimeout(() => {
          if (user) {
            if (user.role === "lecturer") router.replace("/lecturer/index");
            else router.replace("/student/index");
          } else {
            router.replace("/role-select");
          }
        }, 800);
      }
    }, 90);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20),
          },
        ]}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {visibleLines.map((line, i) => (
            <Text
              key={i}
              style={[
                styles.line,
                {
                  color:
                    line.startsWith(">")
                      ? colors.primary
                      : line === ""
                      ? colors.background
                      : line.includes("OK")
                      ? colors.mutedForeground
                      : line.includes("PSYOPS") || line.includes("COPYRIGHT")
                      ? colors.accent
                      : colors.mutedForeground,
                  fontWeight: line.startsWith(">") ? "700" : "400",
                },
              ]}
            >
              {line || " "}
            </Text>
          ))}
          {!done && (
            <Animated.Text
              style={[styles.line, { color: colors.primary, opacity: cursorAnim }]}
            >
              {"█"}
            </Animated.Text>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.dim }]}>
            {"// ENCRYPTED LINK ACTIVE //"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 20 },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },
  line: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    letterSpacing: 0.8,
    lineHeight: 22,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  footerText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
    textAlign: "center",
  },
});
