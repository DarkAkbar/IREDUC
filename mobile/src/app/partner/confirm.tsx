import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchPublicConfig } from "../../api/config";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { colors, radii, spacing, typography } from "../../theme";

export default function PartnerConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const configQuery = useQuery({
    queryKey: ["public-config"],
    queryFn: fetchPublicConfig,
  });
  const sla = configQuery.data?.partnerReviewSlaHours ?? 48;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack={false} title="Confirmation" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.emoji}>✓</Text>
          <Text style={typography.title}>Dossier envoyé</Text>
          <Text style={styles.body}>
            Notre équipe examine votre demande. Vous recevrez une notification
            dès qu&apos;une décision sera prise.
          </Text>
          <Text style={styles.sla}>
            Délai indicatif de traitement : environ {sla} h.
          </Text>
        </View>
        <Button
          label="Suivre ma demande"
          onPress={() => router.replace("/partner/status" as never)}
        />
        <Button
          label="Retour à l'accueil"
          variant="outline"
          style={{ marginTop: spacing.sm }}
          onPress={() => router.replace("/(tabs)" as never)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 56,
    backgroundColor: colors.success,
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  body: {
    marginTop: spacing.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  sla: {
    marginTop: spacing.md,
    color: colors.navy,
    fontWeight: "700",
    textAlign: "center",
  },
});
