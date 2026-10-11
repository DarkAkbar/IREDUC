import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";

type Props = { text: string };

export function InfoBanner({ text }: Props) {
  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle" size={18} color={colors.white} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "flex-start",
  },
  text: { flex: 1, color: colors.white, fontSize: 12, lineHeight: 18 },
});
