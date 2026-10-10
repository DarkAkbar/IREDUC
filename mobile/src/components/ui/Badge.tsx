import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  label: "À louer" | "À vendre" | "À la une" | string;
  variant?: "featured" | "rent" | "sale" | "default";
};

export function Badge({ label, variant }: Props) {
  const resolved =
    variant ??
    (label === "À la une"
      ? "featured"
      : label === "À louer"
        ? "rent"
        : label === "À vendre"
          ? "sale"
          : "default");

  return (
    <View style={[styles.base, styles[resolved]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
  },
  featured: { backgroundColor: colors.navy },
  rent: { backgroundColor: colors.primary },
  sale: { backgroundColor: "#0B6E4F" },
  default: { backgroundColor: colors.navy },
  text: { color: colors.white, fontSize: 11, fontWeight: "700" },
});
