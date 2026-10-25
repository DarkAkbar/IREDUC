import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOpenPublish } from "../hooks/useOpenPublish";
import { usePublishSheetStore } from "../store/publishSheetStore";
import { colors, spacing } from "../theme";

type Props = {
  /** Masquer le FAB sur cet écran. */
  hidden?: boolean;
  /** Au-dessus de la barre d'onglets (écrans tabs). Sinon : stack sans tabs. */
  aboveTabs?: boolean;
};

/** Hauteur visuelle du bouton (pastille ou étendu). */
export const PUBLISH_FAB_SIZE = 56;
/** Écart au-dessus de la barre d'onglets / du bas d'écran. */
export const PUBLISH_FAB_GAP = 16;
/**
 * Marge basse des listes / contenus scrollables pour ne pas passer sous le FAB.
 * (hauteur bouton + gap + marge de confort)
 */
export const PUBLISH_FAB_BOTTOM_INSET = PUBLISH_FAB_SIZE + PUBLISH_FAB_GAP + 12;
/** Marge droite des carrousels horizontaux (évite cœurs / prix sous le FAB). */
export const PUBLISH_FAB_SIDE_INSET = PUBLISH_FAB_SIZE + spacing.lg;

export function PublishFab({ hidden = false, aboveTabs = true }: Props) {
  const insets = useSafeAreaInsets();
  const { openPublish } = useOpenPublish();
  const sheetVisible = usePublishSheetStore((s) => s.visible);
  const collapsed = usePublishSheetStore((s) => s.fabCollapsed);
  const storeHidden = usePublishSheetStore((s) => s.fabHidden);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const widthAnim = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      usePublishSheetStore.getState().setFabCollapsed(false);
      return () => {
        setKeyboardOpen(false);
      };
    }, [])
  );

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: collapsed ? 0 : 1,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [collapsed, widthAnim]);

  if (hidden || storeHidden || sheetVisible || keyboardOpen) return null;

  const labelOpacity = widthAnim;
  const extraWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 82],
  });

  /* L'écran tabs est déjà au-dessus de la barre : bottom 16 = 16 px au-dessus. */
  const bottom = aboveTabs
    ? PUBLISH_FAB_GAP
    : Math.max(insets.bottom, 8) + PUBLISH_FAB_GAP;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom, right: spacing.lg }]}
    >
      <Pressable
        onPress={() => openPublish()}
        accessibilityRole="button"
        accessibilityLabel="+ Publier"
        accessibilityHint="Ouvre le choix du type d'annonce"
        hitSlop={4}
        style={({ pressed }) => [
          styles.fab,
          collapsed && styles.fabCollapsed,
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons name="add" size={28} color={colors.white} />
        <Animated.View style={{ width: extraWidth, overflow: "hidden" }}>
          <Animated.Text
            numberOfLines={1}
            style={[styles.label, { opacity: labelOpacity }]}
          >
            Publier
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

/**
 * Réduit le FAB dès qu'on quitte le sommet ; le rétablit uniquement en haut.
 */
export function usePublishFabScroll() {
  const setFabCollapsed = usePublishSheetStore((s) => s.setFabCollapsed);

  function onScroll(offsetY: number) {
    setFabCollapsed(offsetY > 20);
  }

  return { onScroll };
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 40,
    elevation: 40,
  },
  fab: {
    height: PUBLISH_FAB_SIZE,
    minWidth: PUBLISH_FAB_SIZE,
    paddingHorizontal: 14,
    borderRadius: PUBLISH_FAB_SIZE / 2,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    shadowColor: "#0B2A8A",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabCollapsed: {
    width: PUBLISH_FAB_SIZE,
    paddingHorizontal: 0,
  },
  fabPressed: { opacity: 0.92 },
  label: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
    paddingRight: 6,
  },
});
