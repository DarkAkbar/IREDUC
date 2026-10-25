import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { fetchMyProvider } from "../api/providers";
import { usePartnerGate } from "./PartnerGate";
import { Button } from "./ui/Button";
import { useAuthStore } from "../store/authStore";
import { colors, radii, spacing } from "../theme";
import { partnerStatusPhrase } from "../lib/partnerLabels";

export function PartnerHomeBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { runPartnerGate } = usePartnerGate();

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated,
    queryFn: fetchMyProvider,
    retry: false,
  });

  const status = providerQuery.data?.reviewStatus;
  const hasComplement = Boolean(providerQuery.data?.reviewNote);

  let title = "Voulez-vous proposer un bien ou un service ?";
  let body = "Devenez partenaire IREDUC et publiez vos annonces à Kinshasa.";
  let primary = "Devenir partenaire";
  let intent: "publish" | "become-partner" | "status" = "become-partner";

  if (status === "PENDING" && hasComplement) {
    title = "Dossier à compléter";
    body = partnerStatusPhrase(status, 48, true);
    primary = "Compléter mon dossier";
    intent = "status";
  } else if (status === "PENDING") {
    title = "Dossier en examen";
    body = partnerStatusPhrase(status, 48, false);
    primary = "Suivre ma demande";
    intent = "status";
  } else if (status === "DRAFT") {
    title = "Dossier en brouillon";
    body = "Reprenez votre demande de partenariat là où vous l'avez laissée.";
    primary = "Continuer mon dossier";
    intent = "become-partner";
  } else if (status === "REJECTED") {
    title = "Dossier rejeté";
    body = partnerStatusPhrase(status);
    primary = "Corriger mon dossier";
    intent = "status";
  } else if (status === "APPROVED") {
    title = "Publiez vos annonces";
    body = "Votre dossier est approuvé. Proposez un bien ou un service.";
    primary = "Publier une annonce";
    intent = "publish";
  }

  return (
    <View style={styles.ctaBanner}>
      <Text style={styles.ctaTitle}>{title}</Text>
      <Text style={styles.ctaText}>{body}</Text>
      <Button
        label={primary}
        variant="navy"
        onPress={() => void runPartnerGate(intent)}
      />
      {status === "APPROVED" ? null : status ? (
        <Button
          label="Voir le suivi"
          variant="outline"
          style={{ marginTop: spacing.sm }}
          onPress={() => void runPartnerGate("status")}
        />
      ) : (
        <Button
          label="Publier"
          variant="outline"
          style={{ marginTop: spacing.sm }}
          onPress={() => void runPartnerGate("publish")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ctaBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaTitle: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  ctaText: { color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
});
