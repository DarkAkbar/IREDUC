import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  title: string;
  /** Sous-titre affiché dans la zone d'en-tête (au-dessus de la ligne). */
  subtitle?: string;
  showCity?: boolean;
  /** Contenu sous le titre (ex. barre de recherche) encore dans l'en-tête. */
  children?: ReactNode;
  /** Élément à droite du titre (badge, etc.). */
  titleAccessory?: ReactNode;
};

/**
 * En-tête des onglets (Favoris, Demandes, Rechercher…) :
 * zone titre (+ actions) séparée du main par une ligne.
 */
export function TabScreenHeader({
  title,
  subtitle,
  showCity = false,
  children,
  titleAccessory,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {titleAccessory}
        </View>
        {showCity ? (
          <View style={styles.city}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.cityText}>Kinshasa</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.children}>{children}</View> : null}
      <View style={styles.divider} />
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    minHeight: 48,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    color: colors.navy,
    fontWeight: "800",
    fontSize: 19,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  children: {
    paddingBottom: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 0,
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
