import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";
import { IreducLogo } from "../IreducLogo";

type Props = {
  onFilterPress?: () => void;
  showBack?: boolean;
};

export function ListScreenHeader({ onFilterPress, showBack = true }: Props) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <IreducLogo compact tagline={undefined} />
      <View style={styles.right}>
        <View style={styles.city}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text style={styles.cityText}>Kinshasa</Text>
          <Ionicons name="chevron-down" size={14} color={colors.navy} />
        </View>
        {onFilterPress ? (
          <Pressable onPress={onFilterPress} style={styles.iconBtn}>
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
  iconBtn: { padding: spacing.xs },
});
