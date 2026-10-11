import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../ui/Button";

type Props = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.lg }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.xl, alignItems: "center" },
  title: { ...typography.section, textAlign: "center" },
  message: { ...typography.body, textAlign: "center", marginTop: spacing.sm },
});
