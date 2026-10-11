import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  label: string;
  tone?: "navy" | "red" | "muted";
};

export function Chip({ label, tone = "navy" }: Props) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <Text style={[styles.text, styles[`text_${tone}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  navy: { backgroundColor: colors.navy },
  red: { backgroundColor: colors.primary },
  muted: { backgroundColor: "#E8EEF9" },
  text: { fontSize: 12, fontWeight: "700" },
  text_navy: { color: colors.white },
  text_red: { color: colors.white },
  text_muted: { color: colors.navy },
});
