import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  label: string;
  onRemove: () => void;
};

export function RemovableChip({ label, onRemove }: Props) {
  return (
    <Pressable style={styles.chip} onPress={onRemove}>
      <Text style={styles.text}>{label}</Text>
      <Ionicons name="close" size={14} color={colors.navy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8EEF9",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: { color: colors.navy, fontSize: 12, fontWeight: "700" },
});
