import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";
import { HorizontalChipScroll } from "../ui/HorizontalChipScroll";
import { CategoryTab } from "./CategoryTabs";

type Props = {
  tabs: CategoryTab[];
  activeKey: string;
  onChange: (key: string) => void;
  onFilterPress: () => void;
  activeFilterCount?: number;
  activeColor?: string;
};

/**
 * Rangée : bouton Filtres fixe à gauche + séparateur + catégories défilantes.
 */
export function CategoryFilterRow({
  tabs,
  activeKey,
  onChange,
  onFilterPress,
  activeFilterCount = 0,
  activeColor = colors.primary,
}: Props) {
  const filterLabel =
    activeFilterCount > 0 ? `Filtres (${activeFilterCount})` : "Filtres";

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.filterBtn}
        onPress={onFilterPress}
        accessibilityLabel={filterLabel}
      >
        <Ionicons name="options-outline" size={16} color={colors.navy} />
        <Text style={styles.filterText}>{filterLabel}</Text>
      </Pressable>
      <View style={styles.separator} />
      <HorizontalChipScroll
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
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
      </HorizontalChipScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.lg,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  filterText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  separator: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
    marginVertical: 6,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingLeft: 0,
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
