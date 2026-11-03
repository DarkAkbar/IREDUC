import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { colors, radii, spacing } from "../../theme";

type ButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Bouton rond loupe (44 px) pour ouvrir la recherche dans AppHeader. */
export function HeaderSearchButton({
  onPress,
  accessibilityLabel = "Rechercher",
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.roundBtn}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
    >
      <Ionicons name="search" size={20} color={colors.navy} />
    </Pressable>
  );
}

type FieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Champ de recherche plein largeur qui remplace la première ligne d'en-tête.
 * Animation courte à l'apparition ; croix pour fermer (clavier + repli).
 */
export function HeaderSearchField({
  value,
  onChangeText,
  onClose,
  placeholder = "Rechercher un service…",
  autoFocus = true,
}: FieldProps) {
  const inputRef = useRef<TextInput>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (autoFocus) {
        inputRef.current?.focus();
      }
    });
  }, [autoFocus, opacity, translateY]);

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  return (
    <Animated.View
      style={[
        styles.fieldRow,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={placeholder}
        />
        {value ? (
          <Pressable
            onPress={() => onChangeText("")}
            hitSlop={8}
            accessibilityLabel="Effacer la recherche"
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={handleClose}
        style={styles.closeBtn}
        accessibilityLabel="Fermer la recherche"
        hitSlop={8}
      >
        <Ionicons name="close" size={22} color={colors.navy} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: colors.navy,
    fontSize: 14,
    paddingVertical: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
