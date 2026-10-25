import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fetchMyProvider } from "../api/providers";
import { usePartnerGate } from "./PartnerGate";
import { Button } from "./ui/Button";
import { useOpenPublish } from "../hooks/useOpenPublish";
import { useAuthStore } from "../store/authStore";
import { colors, radii, spacing } from "../theme";
import { partnerStatusPhrase } from "../lib/partnerLabels";

const DISMISS_KEY = "ireduc_home_publish_banner_hide_until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function PartnerHomeBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { runPartnerGate } = usePartnerGate();
  const { openPublish } = useOpenPublish();
  const [dismissed, setDismissed] = useState(false);

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated,
    queryFn: fetchMyProvider,
    retry: false,
  });

  const status = providerQuery.data?.reviewStatus;
  const hasComplement = Boolean(providerQuery.data?.reviewNote);
  const actionRequired =
    status === "DRAFT" ||
    status === "REJECTED" ||
    (status === "PENDING" && hasComplement);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await SecureStore.getItemAsync(DISMISS_KEY);
        if (!raw || cancelled) return;
        const until = Number(raw);
        if (Number.isFinite(until) && until > Date.now()) {
          setDismissed(true);
        } else {
          await SecureStore.deleteItemAsync(DISMISS_KEY);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(async () => {
    if (actionRequired) return;
    setDismissed(true);
    try {
      await SecureStore.setItemAsync(
        DISMISS_KEY,
        String(Date.now() + DISMISS_MS)
      );
    } catch {
      /* ignore */
    }
  }, [actionRequired]);

  if (dismissed && !actionRequired) return null;

  let title = "Publiez votre bien ou votre service";
  let body = "Déposez une annonce en quelques minutes sur IREDUC.";
  let primary = "Publier";
  let onPrimary = () => openPublish();

  if (status === "PENDING" && hasComplement) {
    title = "Dossier à compléter";
    body = partnerStatusPhrase(status, 48, true);
    primary = "Compléter mon dossier";
    onPrimary = () => void runPartnerGate("status");
  } else if (status === "PENDING") {
    title = "Dossier en examen";
    body = partnerStatusPhrase(status, 48, false);
    primary = "Suivre ma demande";
    onPrimary = () => void runPartnerGate("status");
  } else if (status === "DRAFT") {
    title = "Dossier en brouillon";
    body = "Reprenez votre demande de partenariat là où vous l'avez laissée.";
    primary = "Continuer mon dossier";
    onPrimary = () => void runPartnerGate("become-partner");
  } else if (status === "REJECTED") {
    title = "Corriger mon dossier";
    body = partnerStatusPhrase(status);
    primary = "Corriger mon dossier";
    onPrimary = () => void runPartnerGate("status");
  } else if (status === "APPROVED") {
    title = "Publiez votre bien ou votre service";
    body = "Votre dossier est approuvé. Proposez une annonce dès maintenant.";
    primary = "Publier une annonce";
    onPrimary = () => openPublish();
  }

  return (
    <View style={styles.ctaBanner}>
      {!actionRequired ? (
        <Pressable
          style={styles.close}
          onPress={() => void dismiss()}
          accessibilityLabel="Masquer la bannière"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
      <Text style={styles.ctaTitle}>{title}</Text>
      <Text style={styles.ctaText}>{body}</Text>
      <Button label={primary} variant="navy" onPress={onPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  ctaBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  close: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  ctaTitle: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: spacing.xs,
    paddingRight: 40,
  },
  ctaText: { color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
});
