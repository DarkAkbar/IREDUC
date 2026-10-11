import { Stack, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { colors, spacing, typography } from "../../theme";

export default function PropertyDetailPlaceholder() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { requireAuth } = useRequireAuth();
  const returnTo = `/property/${id}`;

  function onFavorite() {
    if (!requireAuth(returnTo)) return;
    Alert.alert("Favori", "Ajout aux favoris disponible à l'étape suivante.");
  }

  function onReserve() {
    if (!requireAuth(returnTo)) return;
    Alert.alert("Réservation", "La réservation sera disponible à l'étape 5B.");
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: title ?? "Bien" }} />
      <Text style={typography.title}>{title ?? "Bien immobilier"}</Text>
      <Text style={styles.id}>Identifiant : {id}</Text>
      <Text style={styles.text}>
        La fiche détaillée (galerie, contacts, réservation) arrivera à l'étape 5B.
      </Text>
      <View style={styles.actions}>
        <Button label="Ajouter aux favoris" variant="outline" onPress={onFavorite} />
        <Button label="Réserver" onPress={onReserve} style={{ marginTop: spacing.md }} />
      </View>
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
  actions: { marginTop: spacing.xl },
});
