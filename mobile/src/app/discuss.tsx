import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { Button } from "../components/ui/Button";
import { colors, spacing, typography } from "../theme";

export default function DiscussPlaceholderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    id?: string;
    title?: string;
  }>();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.content}>
        <Text style={typography.title}>Messagerie</Text>
        <Text style={styles.text}>
          La discussion avec le propriétaire ou le prestataire sera disponible
          prochainement.
        </Text>
        <Text style={styles.meta}>
          {params.type === "SERVICE" ? "Service" : "Bien"} : {params.title ?? params.id}
        </Text>
        <Button
          label="Retour"
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
  text: { ...typography.body, marginTop: spacing.md },
  meta: { color: colors.textMuted, marginTop: spacing.sm },
});
