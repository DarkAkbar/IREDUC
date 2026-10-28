import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../../theme";
import { Button } from "../ui/Button";

type Props = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Centre le vide dans l'espace restant de la liste (sous l'en-tête / puces). */
  fill?: boolean;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  fill = false,
}: Props) {
  return (
    <View style={[styles.box, fill && styles.fill]}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.xl, alignItems: "center" },
  fill: {
    flex: 1,
    justifyContent: "center",
    minHeight: 220,
  },
  title: { ...typography.section, textAlign: "center" },
  message: { ...typography.body, textAlign: "center", marginTop: spacing.sm },
});
