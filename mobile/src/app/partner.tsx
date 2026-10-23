import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../api/client";
import {
  createProvider,
  fetchMyProvider,
  updateProvider,
  uploadProviderDocument,
  uploadProviderLogo,
} from "../api/providers";
import { ProviderDocument, ProviderType } from "../api/types";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { colors, radii, spacing, typography } from "../theme";
import { getErrorMessage } from "../utils/errors";
import { compressImage, uploadWithRetry } from "../utils/media";

type Step = 1 | 2 | 3 | "status";

type LocalDoc = {
  key: string;
  uri: string;
  mimeType?: string;
  docType: ProviderDocument["docType"];
  name: string;
};

const PROFILE_TYPES: { key: ProviderType; label: string; hint: string }[] = [
  {
    key: "INDIVIDUAL",
    label: "Particulier bailleur ou vendeur",
    hint: "Vous proposez vos propres biens",
  },
  {
    key: "AGENCY",
    label: "Agence immobilière",
    hint: "Vous gérez un portefeuille de biens",
  },
  {
    key: "SERVICE_PROVIDER",
    label: "Prestataire de services",
    hint: "Vous proposez des services habitat",
  },
];

function statusLabel(status: string) {
  if (status === "PENDING") return "En attente de validation";
  if (status === "APPROVED") return "Approuvé";
  if (status === "REJECTED") return "Rejeté";
  return status;
}

export default function PartnerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<ProviderType>("INDIVIDUAL");
  const [displayName, setDisplayName] = useState(user?.fullName ?? "");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [years, setYears] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [docs, setDocs] = useState<LocalDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [correctMode, setCorrectMode] = useState(false);

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated,
    queryFn: fetchMyProvider,
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated) requireAuth("/partner");
  }, [isAuthenticated, requireAuth]);

  useEffect(() => {
    if (providerQuery.data && !correctMode) {
      setStep("status");
      setDisplayName(providerQuery.data.displayName);
      setDescription(providerQuery.data.description ?? "");
      setPhone(providerQuery.data.phone ?? "");
      setWhatsapp(providerQuery.data.whatsapp ?? "");
      setWebsite(providerQuery.data.website ?? "");
      setAddress(providerQuery.data.address ?? "");
      setYears(
        providerQuery.data.yearsOfExperience != null
          ? String(providerQuery.data.yearsOfExperience)
          : ""
      );
      setIsRegistered(providerQuery.data.isRegistered);
      setType(providerQuery.data.type as ProviderType);
      if (providerQuery.data.logoUrl) {
        setLogoUri(mediaUrl(providerQuery.data.logoUrl));
      }
    }
  }, [providerQuery.data, correctMode]);

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission", "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  }

  async function pickDoc(docType: ProviderDocument["docType"]) {
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
    const asset = result.assets[0];
    setDocs((prev) => [
      ...prev.filter((d) => d.docType !== docType || docType === "PORTFOLIO"),
      {
        key: `${docType}-${Date.now()}`,
        uri: asset.uri,
        mimeType: asset.mimeType,
        docType,
        name: asset.fileName ?? `${docType}.jpg`,
      },
    ]);
  }

  function validateStep2() {
    if (displayName.trim().length < 2) {
      Alert.alert("Informations", "Indiquez le nom affiché ou la raison sociale.");
      return false;
    }
    if (whatsapp.trim().length < 6) {
      Alert.alert("Informations", "Le numéro WhatsApp est requis.");
      return false;
    }
    return true;
  }

  function validateDocs() {
    if (isRegistered) {
      if (!docs.some((d) => d.docType === "RCCM") || !docs.some((d) => d.docType === "PATENTE")) {
        Alert.alert(
          "Documents",
          "Joignez le RCCM et la patente pour une entreprise immatriculée."
        );
        return false;
      }
    } else if (
      !docs.some((d) => d.docType === "ID") ||
      !docs.some((d) => d.docType === "PORTFOLIO") ||
      !docs.some((d) => d.docType === "REFERENCE")
    ) {
      Alert.alert(
        "Documents",
        "Joignez une pièce d'identité, un portfolio et des références."
      );
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validateDocs()) return;
    setLoading(true);
    try {
      const payload = {
        type,
        displayName: displayName.trim(),
        description: description.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim(),
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        isRegistered,
        yearsOfExperience: years ? Number(years) : undefined,
      };

      if (providerQuery.data) {
        await updateProvider(payload);
      } else {
        await createProvider(payload);
      }

      if (logoUri && !logoUri.startsWith("http") && !logoUri.includes("/uploads/")) {
        const compressed = await compressImage(logoUri, 800);
        await uploadWithRetry(() => uploadProviderLogo(compressed, "image/jpeg"));
      }

      for (const doc of docs) {
        const uri =
          doc.mimeType === "application/pdf"
            ? doc.uri
            : await compressImage(doc.uri);
        await uploadWithRetry(() =>
          uploadProviderDocument(uri, doc.docType, doc.mimeType ?? "image/jpeg")
        );
      }

      const me = await fetchMyProvider();
      await queryClient.invalidateQueries({ queryKey: ["provider-me"] });
      if (user) {
        setUser({
          ...user,
          providerProfile: {
            id: me.id,
            type: me.type,
            displayName: me.displayName,
            reviewStatus: me.reviewStatus,
            isRegistered: me.isRegistered,
          },
        });
      }
      setCorrectMode(false);
      setDocs([]);
      setStep("status");
      Alert.alert(
        "Demande envoyée",
        "Votre dossier partenaire a été transmis pour validation."
      );
    } catch (error) {
      Alert.alert(
        "Partenaire",
        getErrorMessage(error, "Impossible d'envoyer le dossier partenaire.")
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <Text style={styles.center}>Connexion requise…</Text>
      </View>
    );
  }

  if (providerQuery.isLoading && step !== 1) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.navy} />
      </View>
    );
  }

  const provider = providerQuery.data;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Devenir partenaire</Text>
        <Text style={styles.subtitle}>
          Publiez vos biens ou services après validation de votre dossier.
        </Text>

        {step === "status" && provider ? (
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusIcon,
                provider.reviewStatus === "APPROVED" && styles.statusOk,
                provider.reviewStatus === "REJECTED" && styles.statusKo,
              ]}
            >
              <Ionicons
                name={
                  provider.reviewStatus === "APPROVED"
                    ? "checkmark"
                    : provider.reviewStatus === "REJECTED"
                      ? "close"
                      : "time-outline"
                }
                size={28}
                color={colors.white}
              />
            </View>
            <Text style={styles.statusTitle}>
              {statusLabel(provider.reviewStatus)}
            </Text>
            {provider.reviewStatus === "PENDING" ? (
              <Text style={styles.subtitle}>
                Notre équipe examine votre dossier. Vous serez notifié dès qu'il
                sera traité.
              </Text>
            ) : null}
            {provider.reviewStatus === "APPROVED" ? (
              <>
                <Text style={styles.subtitle}>
                  Vous pouvez publier vos annonces dès maintenant.
                </Text>
                <Button
                  label="Publier une annonce"
                  onPress={() => router.push("/publish" as never)}
                  style={{ marginTop: spacing.md }}
                />
              </>
            ) : null}
            {provider.reviewStatus === "REJECTED" ? (
              <>
                <Text style={styles.reason}>
                  Motif : {provider.rejectionReason || "Non précisé"}
                </Text>
                <Button
                  label="Corriger et renvoyer"
                  onPress={() => {
                    setCorrectMode(true);
                    setStep(1);
                  }}
                  style={{ marginTop: spacing.md }}
                />
              </>
            ) : null}
            <Button
              label="Retour au profil"
              variant="outline"
              style={{ marginTop: spacing.sm }}
              onPress={() => router.replace("/(tabs)/profile" as never)}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.block}>
            <Text style={styles.section}>Choisissez votre profil</Text>
            {PROFILE_TYPES.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.card, type === item.key && styles.cardActive]}
                onPress={() => setType(item.key)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  <Text style={styles.cardHint}>{item.hint}</Text>
                </View>
                <View style={[styles.radio, type === item.key && styles.radioOn]}>
                  {type === item.key ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            ))}
            <Button label="Continuer" onPress={() => setStep(2)} />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.block}>
            <Text style={styles.section}>Informations</Text>
            <Field
              label={type === "INDIVIDUAL" ? "Nom affiché" : "Raison sociale"}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field
              label="WhatsApp"
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
            />
            <Field label="Site web (facultatif)" value={website} onChangeText={setWebsite} />
            <Field label="Adresse" value={address} onChangeText={setAddress} />
            <Field
              label="Années d'expérience"
              value={years}
              onChangeText={setYears}
              keyboardType="number-pad"
            />

            <Pressable style={styles.logoBox} onPress={() => void pickLogo()}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logo} contentFit="cover" />
              ) : (
                <Ionicons name="image-outline" size={28} color={colors.textMuted} />
              )}
              <Text style={styles.logoText}>Ajouter un logo</Text>
            </Pressable>

            <View style={styles.actions}>
              <Button label="Retour" variant="outline" style={{ flex: 1 }} onPress={() => setStep(1)} />
              <Button
                label="Continuer"
                style={{ flex: 1.3 }}
                onPress={() => {
                  if (validateStep2()) setStep(3);
                }}
              />
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.block}>
            <Text style={styles.section}>Documents justificatifs</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Mon entreprise est immatriculée (RCCM)
              </Text>
              <Switch
                value={isRegistered}
                onValueChange={setIsRegistered}
                trackColor={{ true: colors.navy, false: colors.border }}
              />
            </View>

            {isRegistered ? (
              <>
                <DocButton
                  label="RCCM"
                  selected={docs.some((d) => d.docType === "RCCM")}
                  onPress={() => void pickDoc("RCCM")}
                />
                <DocButton
                  label="Patente"
                  selected={docs.some((d) => d.docType === "PATENTE")}
                  onPress={() => void pickDoc("PATENTE")}
                />
              </>
            ) : (
              <>
                <DocButton
                  label="Pièce d'identité"
                  selected={docs.some((d) => d.docType === "ID")}
                  onPress={() => void pickDoc("ID")}
                />
                <DocButton
                  label="Portfolio de réalisations"
                  selected={docs.some((d) => d.docType === "PORTFOLIO")}
                  onPress={() => void pickDoc("PORTFOLIO")}
                />
                <DocButton
                  label="Références"
                  selected={docs.some((d) => d.docType === "REFERENCE")}
                  onPress={() => void pickDoc("REFERENCE")}
                />
              </>
            )}

            <Text style={styles.hint}>
              Formats acceptés : jpg, png, pdf — 5 Mo maximum par fichier.
            </Text>

            <View style={styles.actions}>
              <Button label="Retour" variant="outline" style={{ flex: 1 }} onPress={() => setStep(2)} />
              <Button
                label="Envoyer le dossier"
                loading={loading}
                style={{ flex: 1.3 }}
                onPress={() => void submit()}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "number-pad";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

function DocButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.docBtn, selected && styles.docBtnOn]} onPress={onPress}>
      <Ionicons
        name={selected ? "checkmark-circle" : "document-attach-outline"}
        size={20}
        color={selected ? colors.success : colors.navy}
      />
      <Text style={styles.docLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { ...typography.body, padding: spacing.xl },
  subtitle: { ...typography.body, marginTop: spacing.xs, marginBottom: spacing.lg },
  block: { gap: spacing.sm },
  section: { color: colors.navy, fontWeight: "800", fontSize: 16, marginBottom: spacing.sm },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardActive: { borderColor: colors.navy, backgroundColor: "#EEF3FF" },
  cardTitle: { color: colors.navy, fontWeight: "800" },
  cardHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.navy },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.navy,
  },
  label: { color: colors.navy, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.navy,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  logoBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 120,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  logo: { width: 72, height: 72, borderRadius: 36 },
  logoText: { color: colors.navy, fontWeight: "700" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  switchLabel: { flex: 1, color: colors.navy, fontWeight: "700" },
  docBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  docBtnOn: { borderColor: colors.success, backgroundColor: "#E8F7F0" },
  docLabel: { color: colors.navy, fontWeight: "700" },
  hint: { color: colors.textMuted, fontSize: 12, marginVertical: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  statusOk: { backgroundColor: colors.success },
  statusKo: { backgroundColor: colors.primary },
  statusTitle: { color: colors.navy, fontWeight: "800", fontSize: 18 },
  reason: { color: colors.primary, marginTop: spacing.sm, textAlign: "center" },
});
