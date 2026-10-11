import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function ServiceDetailPlaceholder() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: title ?? "Service" }} />
      <Text style={typography.title}>{title ?? "Service"}</Text>
      <Text style={styles.id}>Identifiant : {id}</Text>
      <Text style={styles.text}>
        La fiche détaillée du prestataire arrivera à l'étape 5B.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  id: { ...typography.caption, marginTop: spacing.sm },
  text: { ...typography.body, marginTop: spacing.lg },
});
