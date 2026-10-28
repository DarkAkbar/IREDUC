import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";
import { IreducLogo } from "../IreducLogo";

type Props = {
  /** Titre d'écran compact (sans slogan). */
  title?: string;
  onFilterPress?: () => void;
  showBack?: boolean;
  showCity?: boolean;
};

/**
 * En-tête compact hors accueil : retour, titre, actions.
 * Le slogan IREDUC n'apparaît que sur l'accueil.
 */
export function ListScreenHeader({
  title,
  onFilterPress,
  showBack = true,
  showCity = true,
}: Props) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <IreducLogo compact tagline={undefined} />
      )}
      <View style={styles.right}>
        {showCity ? (
          <View style={styles.city}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.cityText}>Kinshasa</Text>
            <Ionicons name="chevron-down" size={14} color={colors.navy} />
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {onFilterPress ? (
          <Pressable
            onPress={onFilterPress}
            style={styles.iconBtn}
            accessibilityLabel="Filtres"
          >
            <Ionicons name="options-outline" size={20} color={colors.navy} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 48,
  },
  title: {
    flex: 1,
    color: colors.navy,
    fontWeight: "800",
    fontSize: 17,
  },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
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
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
