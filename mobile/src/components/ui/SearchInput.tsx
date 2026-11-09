import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "../../theme";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  /** Nombre de filtres actifs affiché sur le bouton. */
  activeFilterCount?: number;
  /** Version compacte pour la ligne d'en-tête (sans padding latéral). */
  compact?: boolean;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Rechercher...",
  onFilterPress,
  activeFilterCount = 0,
  compact = false,
}: Props) {
  const filterLabel =
    activeFilterCount > 0 ? `Filtres (${activeFilterCount})` : "Filtres";

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={[styles.inputWrap, compact && styles.inputWrapCompact]}>
        <Ionicons name="search" size={compact ? 16 : 18} color={colors.textMuted} />
        <TextInput
          style={[styles.input, compact && styles.inputCompact]}
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
        <Pressable
          style={[styles.filter, compact && styles.filterCompact]}
          onPress={onFilterPress}
          accessibilityLabel={filterLabel}
        >
          <Ionicons name="options-outline" size={16} color={colors.navy} />
          {!compact ? (
            <Text style={styles.filterText}>{filterLabel}</Text>
          ) : activeFilterCount > 0 ? (
            <Text style={styles.filterText}>{activeFilterCount}</Text>
          ) : null}
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
  rowCompact: {
    flex: 1,
    paddingHorizontal: 0,
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
  inputWrapCompact: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
  },
  input: { flex: 1, color: colors.navy, fontSize: 14, paddingVertical: 8 },
  inputCompact: { fontSize: 13, paddingVertical: 6 },
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
  filterCompact: {
    minHeight: 40,
    minWidth: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    justifyContent: "center",
  },
  filterText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
});
