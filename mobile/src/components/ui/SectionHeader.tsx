import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onSeeAll?: () => void;
};

export function SectionHeader({ title, subtitle, icon, onSeeAll }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon ? (
          <Ionicons name={icon} size={22} color={colors.primary} style={styles.icon} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={typography.section}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={styles.seeAll}>
          <Text style={styles.seeAllText}>Voir tout</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  left: { flexDirection: "row", alignItems: "flex-start", flex: 1, gap: spacing.sm },
  icon: { marginTop: 2 },
  subtitle: { ...typography.caption, marginTop: 2 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: spacing.sm },
  seeAllText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
