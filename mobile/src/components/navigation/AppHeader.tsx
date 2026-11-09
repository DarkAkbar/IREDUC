import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";
import { IreducLogo } from "../IreducLogo";
import {
  HeaderSearchButton,
  HeaderSearchField,
} from "./HeaderSearchButton";

type Props = {
  /** Titre d'écran compact (sans slogan). */
  title?: string;
  showBack?: boolean;
  showCity?: boolean;
  /** Active le bouton rond de recherche + champ déployable. */
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
};

/**
 * En-tête listes : [← titre flex] … [loupe] [Kinshasa] alignés à droite (marge 16).
 */
export function AppHeader({
  title,
  showBack = true,
  showCity = true,
  searchable = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Rechercher un service…",
}: Props) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const showSearchField =
    searchable && searchOpen && typeof onSearchChange === "function";

  return (
    <View style={styles.row}>
      {showSearchField ? (
        <HeaderSearchField
          value={searchValue}
          onChangeText={onSearchChange}
          onClose={() => setSearchOpen(false)}
          placeholder={searchPlaceholder}
        />
      ) : (
        <>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.backBtn}
              accessibilityLabel="Retour"
            >
              <Ionicons name="arrow-back" size={22} color={colors.navy} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.logoWrap}>
              <IreducLogo compact tagline={undefined} />
            </View>
          )}
          <View style={styles.right}>
            {searchable && onSearchChange ? (
              <HeaderSearchButton onPress={() => setSearchOpen(true)} />
            ) : null}
            {showCity ? (
              <View style={styles.city}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.cityText}>Kinshasa</Text>
                <Ionicons name="chevron-down" size={14} color={colors.navy} />
              </View>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    minHeight: 56,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    ...typography.screenH1,
    flex: 1,
    minWidth: 0,
  },
  logoWrap: { flex: 1, minWidth: 0 },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
    marginLeft: "auto",
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
