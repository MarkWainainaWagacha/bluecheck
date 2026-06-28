import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface HackerTextProps {
  text: string;
  speed?: number;
  style?: object;
  onDone?: () => void;
  showCursor?: boolean;
  prefix?: string;
}

export function HackerText({
  text,
  speed = 35,
  style,
  onDone,
  showCursor = true,
  prefix = "",
}: HackerTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const colors = useColors();
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const idxRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idxRef.current = 0;
    const timer = setInterval(() => {
      if (idxRef.current < text.length) {
        idxRef.current += 1;
        setDisplayed(text.slice(0, idxRef.current));
      } else {
        clearInterval(timer);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  useEffect(() => {
    if (!showCursor) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.row}>
      {prefix ? (
        <Text style={[styles.base, { color: colors.accent }, style]}>{prefix}</Text>
      ) : null}
      <Text style={[styles.base, { color: colors.primary }, style]}>
        {displayed}
      </Text>
      {showCursor && (
        <Animated.Text
          style={[styles.base, { color: colors.primary, opacity: cursorAnim }, style]}
        >
          {"█"}
        </Animated.Text>
      )}
    </View>
  );
}

interface GlitchLabelProps {
  text: string;
  style?: object;
}

export function GlitchLabel({ text, style }: GlitchLabelProps) {
  const colors = useColors();
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const [glitched, setGlitched] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        setGlitched(true);
        setTimeout(() => setGlitched(false), 80);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const chars = "!@#$%^&*<>/\\|{}[]";
  const glitch = (t: string) =>
    t
      .split("")
      .map((c, i) =>
        glitched && Math.random() < 0.15 && c !== " "
          ? chars[Math.floor(Math.random() * chars.length)]
          : c
      )
      .join("");

  return (
    <Text style={[styles.base, { color: colors.primary }, style]}>
      {glitched ? glitch(text) : text}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  base: {
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
});
