import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterLabel?: string;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Rechercher...",
  onFilterPress,
  filterLabel = "Filtres",
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          returnKeyType="search"
        />
        {value ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {onFilterPress ? (
        <Pressable style={styles.filter} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={16} color={colors.navy} />
          <Text style={styles.filterText}>{filterLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  input: { flex: 1, color: colors.navy, fontSize: 14, paddingVertical: 8 },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  filterText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
});
