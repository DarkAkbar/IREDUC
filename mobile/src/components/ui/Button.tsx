import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { colors, radii, spacing } from "../../theme";

type Variant = "primary" | "navy" | "outline" | "whatsapp";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "whatsapp" ? colors.navy : colors.white}
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  navy: { backgroundColor: colors.navy },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  whatsapp: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.whatsapp,
  },
  label: { fontSize: 16, fontWeight: "700" },
  label_primary: { color: colors.white },
  label_navy: { color: colors.white },
  label_outline: { color: colors.navy },
  label_whatsapp: { color: colors.whatsapp },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 },
});
