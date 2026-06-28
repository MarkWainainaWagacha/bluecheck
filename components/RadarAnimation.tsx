import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface RadarAnimationProps {
  size?: number;
  active?: boolean;
}

export function RadarAnimation({ size = 220, active = true }: RadarAnimationProps) {
  const colors = useColors();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const pulseOne = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const pulseTwo = Animated.loop(
      Animated.sequence([
        Animated.delay(666),
        Animated.timing(pulse2, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const pulseThree = Animated.loop(
      Animated.sequence([
        Animated.delay(1333),
        Animated.timing(pulse3, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse3, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    pulseOne.start();
    pulseTwo.start();
    pulseThree.start();
    return () => {
      pulseOne.stop();
      pulseTwo.stop();
      pulseThree.stop();
    };
  }, [active]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const makeRingStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.6, 0.3, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }),
      },
    ],
  });

  const r = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Pulse rings */}
      {[pulse1, pulse2, pulse3].map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.pulseRing,
            {
              width: size,
              height: size,
              borderRadius: r,
              borderColor: colors.primary,
            },
            makeRingStyle(p),
          ]}
        />
      ))}

      {/* Radar circles */}
      {[1, 0.66, 0.33].map((scale, i) => (
        <View
          key={i}
          style={[
            styles.ring,
            {
              width: size * scale,
              height: size * scale,
              borderRadius: (size * scale) / 2,
              borderColor: colors.border,
            },
          ]}
        />
      ))}

      {/* Cross hairs */}
      <View style={[styles.crossH, { backgroundColor: colors.border, width: size }]} />
      <View style={[styles.crossV, { backgroundColor: colors.border, height: size }]} />

      {/* Sweep */}
      <Animated.View
        style={[
          styles.sweepContainer,
          { width: size, height: size, transform: [{ rotate }] },
        ]}
      >
        <View
          style={[
            styles.sweepLine,
            { backgroundColor: colors.primary, height: r },
          ]}
        />
        <View
          style={[
            styles.sweepGlow,
            {
              borderTopColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: "transparent",
              borderLeftColor: `${colors.primary}33`,
              width: r,
              height: r,
            },
          ]}
        />
      </Animated.View>

      {/* Center dot */}
      <View style={[styles.center, { backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 1.5,
  },
  crossH: {
    position: "absolute",
    height: 1,
    opacity: 0.3,
  },
  crossV: {
    position: "absolute",
    width: 1,
    opacity: 0.3,
  },
  sweepContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  sweepLine: {
    position: "absolute",
    top: 0,
    width: 1.5,
    opacity: 0.9,
    alignSelf: "center",
  },
  sweepGlow: {
    position: "absolute",
    top: 0,
    left: "50%",
    borderWidth: 80,
    borderStyle: "solid",
    opacity: 0.6,
  },
  center: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
