import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { Button } from "../components/ui/Button";
import { colors, spacing, typography } from "../theme";

export default function PartnerPlaceholderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.content}>
        <Text style={typography.title}>Devenir partenaire</Text>
        <Text style={styles.text}>
          Le formulaire d'inscription partenaire (agence, propriétaire ou
          prestataire) arrivera à l'étape suivante. Vous pourrez alors publier
          vos biens et services.
        </Text>
        <Button
          label="Retour au profil"
          variant="outline"
          style={{ marginTop: spacing.xl }}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  text: { ...typography.body, marginTop: spacing.md, lineHeight: 22 },
});
