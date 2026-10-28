import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchPublicConfig } from "../../api/config";
import {
  fetchMyProvider,
  submitProvider,
  uploadProviderDocument,
  withdrawProvider,
} from "../../api/providers";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import {
  partnerEventLabel,
  partnerStatusColor,
  partnerStatusLabel,
  partnerStatusPhrase,
  partnerTypeLabel,
} from "../../lib/partnerLabels";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage } from "../../utils/errors";
import * as ImagePicker from "expo-image-picker";
import { compressImage, uploadWithRetry } from "../../utils/media";
import { formatRequestDate } from "../../utils/dates";

export default function PartnerStatusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    queryFn: fetchMyProvider,
    retry: false,
  });

  const configQuery = useQuery({
    queryKey: ["public-config"],
    queryFn: fetchPublicConfig,
  });

  const onRefresh = useCallback(async () => {
    await providerQuery.refetch();
  }, [providerQuery]);

  const provider = providerQuery.data;
  const sla = configQuery.data?.partnerReviewSlaHours ?? 48;
  const hasComplement = Boolean(provider?.reviewNote);

  async function onWithdraw() {
    Alert.alert(
      "Retirer ma demande",
      "Votre dossier repassera en brouillon. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await withdrawProvider();
              await queryClient.invalidateQueries({ queryKey: ["provider-me"] });
            } catch (error) {
              Alert.alert("Erreur", getErrorMessage(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  async function onAddDocument() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission", "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setBusy(true);
    try {
      const uri = await compressImage(result.assets[0].uri);
      await uploadWithRetry(() =>
        uploadProviderDocument(uri, "ID", result.assets[0].mimeType ?? "image/jpeg")
      );
      await queryClient.invalidateQueries({ queryKey: ["provider-me"] });
      Alert.alert("Pièce ajoutée", "Le document a été joint au dossier.");
    } catch (error) {
      Alert.alert("Erreur", getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function onResubmit() {
    setBusy(true);
    try {
      await submitProvider();
      await queryClient.invalidateQueries({ queryKey: ["provider-me"] });
      router.replace("/partner/confirm" as never);
    } catch (error) {
      Alert.alert("Soumission", getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (providerQuery.isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack title="Ma demande" />
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.navy} />
      </View>
    );
  }

  if (providerQuery.isError || !provider) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack title="Ma demande" />
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>
            {providerQuery.isError
              ? getErrorMessage(providerQuery.error, "Dossier introuvable")
              : "Aucun dossier partenaire."}
          </Text>
          <Button
            label="Devenir partenaire"
            onPress={() => router.replace("/partner" as never)}
          />
        </View>
      </View>
    );
  }

  const statusColor = partnerStatusColor(provider.reviewStatus);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack title="Ma demande de partenariat" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={providerQuery.isRefetching}
            onRefresh={() => void onRefresh()}
            tintColor={colors.navy}
          />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.typeLabel}>{partnerTypeLabel(provider.type)}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>
              {partnerStatusLabel(provider.reviewStatus)}
            </Text>
          </View>
          <Text style={styles.phrase}>
            {partnerStatusPhrase(provider.reviewStatus, sla, hasComplement)}
          </Text>
        </View>

        <Text style={styles.section}>Chronologie</Text>
        <View style={styles.timeline}>
          {(provider.history ?? []).map((event, index) => (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={styles.dot} />
                {index < (provider.history?.length ?? 0) - 1 ? (
                  <View style={styles.line} />
                ) : null}
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.eventTitle}>{partnerEventLabel(event.type)}</Text>
                {event.message ? (
                  <Text style={styles.eventMsg}>{event.message}</Text>
                ) : null}
                <Text style={styles.eventDate}>
                  {formatRequestDate(event.createdAt)}
                </Text>
              </View>
            </View>
          ))}
          {(provider.history ?? []).length === 0 ? (
            <Text style={styles.muted}>Aucun événement pour le moment.</Text>
          ) : null}
        </View>

        <Text style={styles.section}>Pièces jointes</Text>
        {(provider.documents ?? []).map((doc) => (
          <View key={doc.id} style={styles.docRow}>
            <Ionicons name="document-outline" size={18} color={colors.navy} />
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>{doc.docType}</Text>
              <Text style={styles.muted}>{partnerStatusLabel(doc.reviewStatus)}</Text>
            </View>
          </View>
        ))}
        {(provider.documents ?? []).length === 0 ? (
          <Text style={styles.muted}>Aucune pièce envoyée.</Text>
        ) : null}
        {provider.reviewStatus === "DRAFT" ||
        provider.reviewStatus === "REJECTED" ||
        hasComplement ? (
          <Pressable style={styles.addDoc} onPress={() => void onAddDocument()}>
            <Ionicons name="add-circle-outline" size={20} color={colors.navy} />
            <Text style={styles.addDocText}>Ajouter une pièce</Text>
          </Pressable>
        ) : null}

        {hasComplement ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Message de l&apos;admin</Text>
            <Text style={styles.noteBody}>{provider.reviewNote}</Text>
          </View>
        ) : null}

        {provider.reviewStatus === "REJECTED" && provider.rejectionReason ? (
          <View style={[styles.noteCard, styles.rejectCard]}>
            <Text style={styles.noteTitle}>Motif du rejet</Text>
            <Text style={styles.noteBody}>{provider.rejectionReason}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {provider.reviewStatus === "DRAFT" ? (
            <Button
              label="Continuer mon dossier"
              onPress={() => router.push("/partner/form" as never)}
              disabled={busy}
            />
          ) : null}
          {provider.reviewStatus === "PENDING" && !hasComplement ? (
            <Button
              label="Retirer ma demande"
              variant="outline"
              onPress={() => void onWithdraw()}
              disabled={busy}
            />
          ) : null}
          {provider.reviewStatus === "REJECTED" || hasComplement ? (
            <>
              <Button
                label="Corriger le dossier"
                variant="outline"
                onPress={() => router.push("/partner/form" as never)}
                disabled={busy}
              />
              <Button
                label="Corriger et renvoyer"
                onPress={() => void onResubmit()}
                disabled={busy}
                style={{ marginTop: spacing.sm }}
              />
            </>
          ) : null}
          {provider.reviewStatus === "APPROVED" ? (
            <Button
              label="Publier une annonce"
              onPress={() => router.push("/publish" as never)}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centerBox: { padding: spacing.lg, gap: spacing.md },
  errorText: { color: colors.muted, marginBottom: spacing.md },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeLabel: { ...typography.subtitle, color: colors.navy, fontWeight: "800" },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  phrase: { marginTop: spacing.md, color: colors.muted, lineHeight: 20 },
  section: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontWeight: "800",
    color: colors.navy,
    fontSize: 15,
  },
  timeline: { gap: spacing.sm },
  timelineRow: { flexDirection: "row", gap: spacing.md },
  timelineRail: { alignItems: "center", width: 16 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.navy,
    marginTop: 4,
  },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  timelineBody: { flex: 1, paddingBottom: spacing.md },
  eventTitle: { fontWeight: "700", color: colors.navy },
  eventMsg: { color: colors.muted, marginTop: 2, fontSize: 13 },
  eventDate: { color: colors.muted, marginTop: 4, fontSize: 12 },
  docRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  docTitle: { fontWeight: "700", color: colors.navy },
  muted: { color: colors.muted, fontSize: 13 },
  addDoc: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  addDocText: { color: colors.navy, fontWeight: "700" },
  noteCard: {
    marginTop: spacing.lg,
    backgroundColor: "#FFF7ED",
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  rejectCard: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  noteTitle: { fontWeight: "800", color: colors.navy, marginBottom: 4 },
  noteBody: { color: colors.muted, lineHeight: 20 },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
});
