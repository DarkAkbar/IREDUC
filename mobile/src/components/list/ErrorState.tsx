import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { Button } from "../ui/Button";

type Props = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({
  message = "Impossible de charger les données. Vérifiez votre connexion.",
  onRetry,
}: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Erreur réseau</Text>
      <Text style={styles.message}>{message}</Text>
      <Button label="Réessayer" onPress={onRetry} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.xl, alignItems: "center" },
  title: { ...typography.section, color: colors.primary },
  message: { ...typography.body, textAlign: "center", marginTop: spacing.sm },
});
