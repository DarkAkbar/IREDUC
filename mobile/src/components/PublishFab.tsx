import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOpenPublish } from "../hooks/useOpenPublish";
import { usePublishSheetStore } from "../store/publishSheetStore";
import { colors, spacing } from "../theme";

type Props = {
  /** Masquer le FAB sur cet écran. */
  hidden?: boolean;
  /** Positionné au-dessus de la barre d'onglets (défaut : true). */
  aboveTabs?: boolean;
};

const TAB_BAR_OFFSET = 72;

export function PublishFab({ hidden = false, aboveTabs = true }: Props) {
  const insets = useSafeAreaInsets();
  const { openPublish } = useOpenPublish();
  const collapsed = usePublishSheetStore((s) => s.fabCollapsed);
  const storeHidden = usePublishSheetStore((s) => s.fabHidden);
  const widthAnim = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: collapsed ? 0 : 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [collapsed, widthAnim]);

  if (hidden || storeHidden) return null;

  const labelOpacity = widthAnim;
  const extraWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 78],
  });
  const bottom = aboveTabs
    ? TAB_BAR_OFFSET + Math.max(insets.bottom - 8, 0)
    : Math.max(insets.bottom, 16) + 8;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <Pressable
        onPress={() => openPublish()}
        accessibilityRole="button"
        accessibilityLabel="+ Publier"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={26} color={colors.white} />
        <Animated.View style={{ width: extraWidth, overflow: "hidden" }}>
          <Animated.Text style={[styles.label, { opacity: labelOpacity }]}>
            Publier
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

/** À brancher sur onScroll des listes pour réduire / étendre le FAB. */
export function usePublishFabScroll() {
  const setFabCollapsed = usePublishSheetStore((s) => s.setFabCollapsed);
  const lastY = useRef(0);

  function onScroll(offsetY: number) {
    const delta = offsetY - lastY.current;
    if (offsetY < 16) {
      setFabCollapsed(false);
    } else if (delta > 10) {
      setFabCollapsed(true);
    } else if (delta < -10) {
      setFabCollapsed(false);
    }
    lastY.current = offsetY;
  }

  return { onScroll };
}

/** Marge basse pour que les listes ne passent pas sous le FAB. */
export const PUBLISH_FAB_BOTTOM_INSET = 56 + TAB_BAR_OFFSET;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 40,
  },
  fab: {
    minHeight: 52,
    minWidth: 52,
    paddingHorizontal: 14,
    borderRadius: 26,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabPressed: { opacity: 0.92 },
  label: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
    paddingRight: 4,
  },
});
