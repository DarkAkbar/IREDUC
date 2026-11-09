import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onSeeAll?: () => void;
  /** Libellé du lien (défaut : « Voir tout »). */
  seeAllLabel?: string;
  seeAllIcon?: keyof typeof Ionicons.glyphMap;
  /** `subsection` : titre 18 px gras, sans icône de section. */
  variant?: "section" | "subsection";
};

export function SectionHeader({
  title,
  subtitle,
  icon,
  onSeeAll,
  seeAllLabel = "Voir tout",
  seeAllIcon = "arrow-forward",
  variant = "section",
}: Props) {
  const isSub = variant === "subsection";

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {!isSub && icon ? (
          <Ionicons name={icon} size={22} color={colors.primary} style={styles.icon} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={isSub ? styles.subTitle : typography.section}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={styles.seeAll}>
          <Text style={styles.seeAllText}>{seeAllLabel}</Text>
          <Ionicons name={seeAllIcon} size={16} color={colors.primary} />
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
  subTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  subtitle: { ...typography.caption, marginTop: 2 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: spacing.sm },
  seeAllText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
