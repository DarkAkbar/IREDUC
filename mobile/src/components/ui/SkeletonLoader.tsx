import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
};

export function SkeletonLoader({
  width = "100%",
  height = 16,
  style,
  borderRadius = radii.sm,
}: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function HomeSkeleton() {
  return (
    <View style={styles.home}>
      <SkeletonLoader height={180} borderRadius={radii.lg} />
      <SkeletonLoader height={48} borderRadius={radii.xl} style={{ marginTop: -24 }} />
      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <SkeletonLoader width="40%" height={22} />
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <SkeletonLoader width={220} height={240} borderRadius={radii.lg} />
          <SkeletonLoader width={220} height={240} borderRadius={radii.lg} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.skeleton },
  home: { padding: spacing.lg, gap: spacing.md },
});
