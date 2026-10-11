import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
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
};

export function CategoryTabs({
  tabs,
  activeKey,
  onChange,
  activeColor = colors.primary,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              active && { backgroundColor: activeColor, borderColor: activeColor },
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={active ? colors.white : colors.navy}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  labelActive: { color: colors.white },
});
