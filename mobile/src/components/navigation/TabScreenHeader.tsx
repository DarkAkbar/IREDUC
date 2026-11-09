import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

type Props = {
  title: string;
  /** Sous-titre optionnel (éviter sur les onglets refondus). */
  subtitle?: string;
  showCity?: boolean;
  /** Contenu à droite sur la même ligne que le H1 (ex. recherche + filtres). */
  trailing?: ReactNode;
  /** Élément collé au titre (badge compteur…). */
  titleAccessory?: ReactNode;
};

/**
 * En-tête fixe des onglets : seule cette zone reste hors scroll.
 * Le corps laisse 16 px de fond de page visible en dessous.
 */
export function TabScreenHeader({
  title,
  subtitle,
  showCity = false,
  trailing,
  titleAccessory,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={[styles.titleRow, trailing ? styles.titleRowCompact : null]}>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit={Boolean(trailing)}
            minimumFontScale={0.75}
          >
            {title}
          </Text>
          {titleAccessory}
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        {!trailing && showCity ? (
          <View style={styles.city}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.cityText}>Kinshasa</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 12,
    gap: spacing.sm,
    minHeight: 56,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  titleRowCompact: {
    flex: 0,
    flexShrink: 1,
    maxWidth: "42%",
  },
  title: {
    ...typography.screenH1,
    flexShrink: 1,
  },
  trailing: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  city: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cityText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
});
