import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "../../theme";
import { HorizontalChipScroll } from "../ui/HorizontalChipScroll";

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
    <HorizontalChipScroll>
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
  );
}

const styles = StyleSheet.create({
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
