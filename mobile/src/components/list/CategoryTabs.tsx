import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { colors, radii, spacing } from "../../theme";

export type CategoryTab = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
  tabs: CategoryTab[];
  activeKey: string;
  onChange: (key: string) => void;
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Rangée horizontale de pastilles (icône + label).
 * Fait défiler la pastille active en vue au chargement / changement.
 */
export function CategoryTabs({
  tabs,
  activeKey,
  onChange,
  activeColor = colors.primary,
  style,
  contentContainerStyle,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const layoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const viewportWidthRef = useRef(0);
  const contentOffsetX = useRef(0);
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;

  function scrollKeyIntoView(key: string) {
    const layout = layoutsRef.current[key];
    const viewportWidth = viewportWidthRef.current;
    if (!layout || viewportWidth <= 0 || !scrollRef.current) return;

    const left = layout.x;
    const right = layout.x + layout.width;
    const visibleLeft = contentOffsetX.current;
    const visibleRight = contentOffsetX.current + viewportWidth;

    if (left >= visibleLeft && right <= visibleRight) return;

    scrollRef.current.scrollTo({
      x: Math.max(0, left - spacing.sm),
      animated: true,
    });
  }

  useEffect(() => {
    scrollKeyIntoView(activeKey);
  }, [activeKey, tabs]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log("[CategoryTabs] tabs", {
      tabsCount: tabs.length,
      activeKey,
      labels: tabs.map((t) => t.label),
    });
  }, [activeKey, tabs]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      onScroll={(e) => {
        contentOffsetX.current = e.nativeEvent.contentOffset.x;
      }}
      scrollEventThrottle={16}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        viewportWidthRef.current = width;
        if (__DEV__) {
          console.log("[CategoryTabs] onLayout width=", width);
        }
        scrollKeyIntoView(activeKeyRef.current);
      }}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              layoutsRef.current[tab.key] = { x, width };
              if (tab.key === activeKeyRef.current) {
                scrollKeyIntoView(tab.key);
              }
            }}
            style={[
              styles.tab,
              active && {
                backgroundColor: activeColor,
                borderColor: activeColor,
              },
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={active ? colors.white : colors.navy}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /**
   * Pas de flexShrink: 0 — dans une rangée (Filtres + pastilles),
   * flexShrink: 0 + absence de largeur bornée écrasait le ScrollView à 0 px
   * malgré flex: 1 / minWidth: 0 passés en props.
   */
  scroll: {},
  content: {
    flexGrow: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  labelActive: { color: colors.white },
});
