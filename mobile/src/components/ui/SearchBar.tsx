import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  placeholder?: string;
  onPress?: () => void;
  onFilterPress?: () => void;
};

export function SearchBar({
  placeholder = "Que recherchez-vous ?",
  onPress,
  onFilterPress,
}: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <Text style={styles.placeholder}>{placeholder}</Text>
      <Pressable style={styles.filter} onPress={onFilterPress ?? onPress}>
        <Ionicons name="options-outline" size={18} color={colors.white} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    shadowColor: colors.navy,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  placeholder: { flex: 1, color: colors.textMuted, fontSize: 15 },
  filter: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
