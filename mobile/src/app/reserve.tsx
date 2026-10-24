import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchProperty } from "../api/properties";
import { createRequest } from "../api/requests";
import { fetchService } from "../api/services";
import { ProjectType, VisitMode } from "../api/types";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { MonthCalendar } from "../components/reservation/MonthCalendar";
import { ProgressSteps } from "../components/reservation/ProgressSteps";
import { TargetSummaryCard } from "../components/reservation/TargetSummaryCard";
import { Button } from "../components/ui/Button";
import { SkeletonLoader } from "../components/ui/SkeletonLoader";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useAuthStore } from "../store/authStore";
import { useReservationStore } from "../store/reservationStore";
import { colors, radii, spacing, typography } from "../theme";
import { formatDateFr, VISIT_SLOTS } from "../utils/dates";
import { propertyLocation } from "../utils/format";

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }
  return fallback;
}

export default function ReserveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ type?: string; id?: string; title?: string }>();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const {
    step,
    draft,
    property,
    service,
    submitted,
    initProperty,
    initService,
    patchDraft,
    setStep,
    setSubmitted,
    reset,
  } = useReservationStore();
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const targetType = params.type === "SERVICE" ? "SERVICE" : "PROPERTY";
  const targetId = params.id ?? "";
  const returnTo = `/reserve?type=${targetType}&id=${targetId}`;

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(returnTo);
    }
  }, [isAuthenticated, requireAuth, returnTo]);

  const propertyQuery = useQuery({
    queryKey: ["property", targetId],
    enabled: isAuthenticated && targetType === "PROPERTY" && Boolean(targetId),
    queryFn: () => fetchProperty(targetId),
  });

  const serviceQuery = useQuery({
    queryKey: ["service", targetId],
    enabled: isAuthenticated && targetType === "SERVICE" && Boolean(targetId),
    queryFn: () => fetchService(targetId),
  });

  useEffect(() => {
    if (
      propertyQuery.data &&
      (!draft || draft.targetId !== propertyQuery.data.id || draft.targetType !== "PROPERTY")
    ) {
      initProperty(propertyQuery.data, user ?? undefined);
    }
  }, [propertyQuery.data, initProperty, user, draft]);

  useEffect(() => {
    if (
      serviceQuery.data &&
      (!draft || draft.targetId !== serviceQuery.data.id || draft.targetType !== "SERVICE")
    ) {
      initService(serviceQuery.data, user ?? undefined);
    }
  }, [serviceQuery.data, initService, user, draft]);

  const visitLabel = targetType === "SERVICE" ? "Intervention" : "Visite";
  const loading =
    (targetType === "PROPERTY" && propertyQuery.isLoading) ||
    (targetType === "SERVICE" && serviceQuery.isLoading);

  const title = useMemo(() => {
    if (targetType === "SERVICE") return "Demander ce service";
    return "Réserver ce bien";
  }, [targetType]);

  function validateStep1() {
    if (!draft) return false;
    if (!draft.desiredDate) {
      Alert.alert("Projet", "Choisissez une date d'entrée ou d'intervention souhaitée.");
      return false;
    }
    if (draft.targetType === "PROPERTY" && draft.projectType === "RENT" && !draft.durationMonths) {
      Alert.alert("Projet", "Indiquez la durée de location.");
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (!draft?.visitDate) {
      Alert.alert(visitLabel, "Choisissez une date sur le calendrier.");
      return false;
    }
    if (!draft.visitSlot) {
      Alert.alert(visitLabel, "Choisissez un créneau horaire.");
      return false;
    }
    return true;
  }

  function validateStep3() {
    if (!draft) return false;
    const errors: Record<string, string> = {};
    if (draft.fullName.trim().length < 2) {
      errors.fullName = "Le nom complet est requis";
    }
    if (draft.phone.trim().length < 6) {
      errors.phone = "Numéro de téléphone invalide";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      errors.email = "Adresse e-mail invalide";
    }
    if (draft.message.length > 500) {
      errors.message = "Le message ne peut pas dépasser 500 caractères";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit() {
    if (!draft || !validateStep3()) return;
    setSubmitting(true);
    try {
      const payload = {
        targetType: draft.targetType,
        propertyId: draft.targetType === "PROPERTY" ? draft.targetId : undefined,
        serviceId: draft.targetType === "SERVICE" ? draft.targetId : undefined,
        projectType: draft.projectType,
        desiredDate: draft.desiredDate
          ? new Date(`${draft.desiredDate}T12:00:00`).toISOString()
          : undefined,
        durationMonths:
          draft.targetType === "PROPERTY" && draft.projectType === "RENT"
            ? draft.durationMonths ?? undefined
            : undefined,
        occupants: draft.occupants ?? undefined,
        visitMode: draft.visitMode,
        visitDate: draft.visitDate
          ? new Date(`${draft.visitDate}T12:00:00`).toISOString()
          : undefined,
        visitSlot: draft.visitSlot ?? undefined,
        fullName: draft.fullName.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim().toLowerCase(),
        whatsapp: draft.whatsapp.trim() || undefined,
        message: draft.message.trim() || undefined,
      };
      const created = await createRequest(payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["requests-received"] }),
        queryClient.invalidateQueries({ queryKey: ["home"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      setSubmitted(created);
    } catch (error) {
      Alert.alert(
        "Demande impossible",
        getErrorMessage(
          error,
          "Impossible d'envoyer la demande. Vérifiez vos informations et réessayez."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3) void submit();
  }

  function goBack() {
    if (step === 1) {
      reset();
      router.back();
      return;
    }
    if (step < 4) setStep((step - 1) as 1 | 2 | 3);
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <Text style={styles.centerText}>Connexion requise pour continuer…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {step < 4
            ? "Parlez-nous de votre projet pour mieux vous accompagner."
            : "Votre demande a bien été transmise."}
        </Text>

        <ProgressSteps current={step} visitLabel={visitLabel} />

        {loading ? (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <SkeletonLoader height={120} borderRadius={radii.lg} />
            <SkeletonLoader height={180} />
          </View>
        ) : null}

        {!loading && draft && step === 1 ? (
          <View style={styles.block}>
            <TargetSummaryCard property={property} service={service} />
            <Text style={styles.section}>Quel est votre projet ?</Text>
            {targetType === "PROPERTY" ? (
              <View style={styles.seg}>
                {(
                  [
                    ["RENT", "Location"],
                    ["BUY", "Achat"],
                    ["OTHER", "Autre"],
                  ] as const
                ).map(([key, label]) => (
                  <Pressable
                    key={key}
                    style={[styles.segItem, draft.projectType === key && styles.segActive]}
                    onPress={() =>
                      patchDraft({
                        projectType: key as ProjectType,
                        durationMonths: key === "RENT" ? draft.durationMonths ?? 12 : null,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.segText,
                        draft.projectType === key && styles.segTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <FieldRow
              icon="calendar-outline"
              label={
                targetType === "SERVICE"
                  ? "Date d'intervention souhaitée"
                  : "Date d'entrée souhaitée"
              }
              value={draft.desiredDate ? formatDateFr(draft.desiredDate) : "Choisir"}
            />
            <MonthCalendar
              value={draft.desiredDate}
              onChange={(desiredDate) => patchDraft({ desiredDate })}
            />

            {draft.targetType === "PROPERTY" && draft.projectType === "RENT" ? (
              <View style={styles.pickerRow}>
                <Text style={styles.fieldLabel}>Durée de location</Text>
                <View style={styles.chipRow}>
                  {[6, 12, 24].map((n) => (
                    <Pressable
                      key={n}
                      style={[
                        styles.chip,
                        draft.durationMonths === n && styles.chipActive,
                      ]}
                      onPress={() => patchDraft({ durationMonths: n })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          draft.durationMonths === n && styles.chipTextActive,
                        ]}
                      >
                        {n} mois
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {draft.targetType === "PROPERTY" ? (
              <View style={styles.pickerRow}>
                <Text style={styles.fieldLabel}>Nombre d'occupants (facultatif)</Text>
                <View style={styles.chipRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      style={[styles.chip, draft.occupants === n && styles.chipActive]}
                      onPress={() =>
                        patchDraft({ occupants: draft.occupants === n ? null : n })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          draft.occupants === n && styles.chipTextActive,
                        ]}
                      >
                        {n}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {!loading && draft && step === 2 ? (
          <View style={styles.block}>
            <Text style={styles.section}>Mode de {visitLabel.toLowerCase()}</Text>
            <ModeCard
              active={draft.visitMode === "PHYSICAL"}
              icon="home-outline"
              title={
                targetType === "SERVICE" ? "Intervention sur place" : "Visite physique"
              }
              subtitle={
                targetType === "SERVICE"
                  ? "Le prestataire se déplace chez vous"
                  : "Sur place avec le propriétaire ou l'agence"
              }
              onPress={() => patchDraft({ visitMode: "PHYSICAL" as VisitMode })}
            />
            <ModeCard
              active={draft.visitMode === "VIRTUAL"}
              icon="videocam-outline"
              title={
                targetType === "SERVICE" ? "Échange à distance" : "Visite virtuelle"
              }
              subtitle="Par appel vidéo (WhatsApp, Zoom, etc.)"
              onPress={() => patchDraft({ visitMode: "VIRTUAL" as VisitMode })}
            />

            <Text style={styles.section}>
              Choisir une date {targetType === "SERVICE" ? "d'intervention" : "de visite"}
            </Text>
            <MonthCalendar
              value={draft.visitDate}
              onChange={(visitDate) => patchDraft({ visitDate })}
            />

            <Text style={styles.section}>Choisir un créneau horaire</Text>
            <View style={styles.slots}>
              {VISIT_SLOTS.map((slot) => (
                <Pressable
                  key={slot}
                  style={[styles.slot, draft.visitSlot === slot && styles.slotActive]}
                  onPress={() => patchDraft({ visitSlot: slot })}
                >
                  <Text
                    style={[
                      styles.slotText,
                      draft.visitSlot === slot && styles.slotTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!loading && draft && step === 3 ? (
          <View style={styles.block}>
            <Text style={styles.section}>Vos coordonnées</Text>
            <LabeledInput
              icon="person-outline"
              label="Nom complet"
              value={draft.fullName}
              onChangeText={(fullName) => patchDraft({ fullName })}
              error={fieldErrors.fullName}
            />
            <LabeledInput
              icon="call-outline"
              label="Téléphone"
              value={draft.phone}
              onChangeText={(phone) => patchDraft({ phone })}
              keyboardType="phone-pad"
              error={fieldErrors.phone}
            />
            <LabeledInput
              icon="mail-outline"
              label="E-mail"
              value={draft.email}
              onChangeText={(email) => patchDraft({ email })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldErrors.email}
            />
            <LabeledInput
              icon="logo-whatsapp"
              label="WhatsApp (facultatif)"
              value={draft.whatsapp}
              onChangeText={(whatsapp) => patchDraft({ whatsapp })}
              keyboardType="phone-pad"
            />
            <Text style={styles.fieldLabel}>
              Message {targetType === "SERVICE" ? "au prestataire" : "au propriétaire"}{" "}
              (facultatif)
            </Text>
            <TextInput
              style={styles.textarea}
              value={draft.message}
              onChangeText={(message) => patchDraft({ message: message.slice(0, 500) })}
              multiline
              maxLength={500}
              placeholder="Présentez brièvement votre besoin…"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.counter}>{draft.message.length}/500</Text>
            {fieldErrors.message ? (
              <Text style={styles.error}>{fieldErrors.message}</Text>
            ) : null}
          </View>
        ) : null}

        {!loading && draft && step === 4 && submitted ? (
          <View style={styles.block}>
            <View style={styles.successRow}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={28} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Demande envoyée !</Text>
                <Text style={styles.subtitle}>
                  Votre demande de réservation a bien été transmise. Vous pouvez suivre
                  son statut dans Mes demandes.
                </Text>
              </View>
            </View>

            <View style={styles.numberRow}>
              <Text style={styles.number}>{submitted.number}</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>En attente</Text>
              </View>
            </View>

            <Text style={styles.section}>Récapitulatif de votre demande</Text>
            <TargetSummaryCard property={property} service={service} />
            <View style={styles.recapGrid}>
              <Recap
                label="Type"
                value={
                  draft.projectType === "RENT"
                    ? "Location"
                    : draft.projectType === "BUY"
                      ? "Achat"
                      : "Autre"
                }
              />
              <Recap label="Date souhaitée" value={formatDateFr(draft.desiredDate)} />
              {draft.durationMonths ? (
                <Recap label="Durée" value={`${draft.durationMonths} mois`} />
              ) : null}
              {draft.occupants ? (
                <Recap label="Occupants" value={String(draft.occupants)} />
              ) : null}
              <Recap
                label={visitLabel}
                value={`Le ${formatDateFr(draft.visitDate)} à ${draft.visitSlot}`}
              />
              <Recap
                label="Mode"
                value={draft.visitMode === "PHYSICAL" ? "Physique" : "Virtuel"}
              />
            </View>

            {(property?.owner || service?.provider) && (
              <View style={styles.ownerCard}>
                <Text style={styles.section}>
                  {property ? "Propriétaire / Agence" : "Prestataire"}
                </Text>
                <Text style={styles.ownerName}>
                  {property?.owner.agency?.displayName ??
                    property?.owner.fullName ??
                    service?.provider.displayName}
                </Text>
                {property ? (
                  <Text style={styles.meta}>{propertyLocation(property)}</Text>
                ) : null}
              </View>
            )}

            <Button
              label="Voir mes demandes"
              variant="outline"
              onPress={() => {
                reset();
                router.replace("/(tabs)/requests" as never);
              }}
            />
            <Button
              label="Retour à l'accueil"
              variant="navy"
              style={{ marginTop: spacing.sm }}
              onPress={() => {
                reset();
                router.replace("/(tabs)" as never);
              }}
            />
            <Text style={styles.thanks}>Merci de votre confiance !</Text>
          </View>
        ) : null}

        {step < 4 && !loading && draft ? (
          <View style={styles.actions}>
            {step > 1 ? (
              <Button
                label="Retour"
                variant="outline"
                onPress={goBack}
                style={{ flex: 1 }}
              />
            ) : null}
            <Button
              label="Continuer"
              onPress={goNext}
              loading={submitting}
              style={{ flex: 1.4 }}
            />
          </View>
        ) : null}

        {step < 4 ? (
          <View style={styles.secure}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
            <Text style={styles.secureText}>
              Vos informations sont sécurisées et utilisées uniquement pour traiter votre
              demande.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function FieldRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <Ionicons name={icon} size={18} color={colors.navy} />
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

function ModeCard({
  active,
  icon,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeCard, active && styles.modeCardActive]}
    >
      <Ionicons name={icon} size={22} color={colors.navy} />
      <View style={{ flex: 1 }}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeSub}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function LabeledInput({
  icon,
  label,
  value,
  onChangeText,
  error,
  keyboardType,
  autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color={colors.navy} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "words"}
          placeholderTextColor={colors.textMuted}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.recapItem}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { ...typography.body, marginTop: spacing.xs, marginBottom: spacing.lg },
  centerText: { ...typography.body, padding: spacing.xl, textAlign: "center" },
  block: { marginTop: spacing.xl, gap: spacing.md },
  section: { color: colors.navy, fontWeight: "800", fontSize: 16, marginTop: spacing.sm },
  seg: {
    flexDirection: "row",
    backgroundColor: "#E8EEF9",
    borderRadius: radii.pill,
    padding: 4,
  },
  segItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    alignItems: "center",
  },
  segActive: { backgroundColor: colors.navy },
  segText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  segTextActive: { color: colors.white },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  fieldLabel: { color: colors.navy, fontWeight: "700", fontSize: 13, marginBottom: 4 },
  fieldValue: { color: colors.textMuted },
  pickerRow: { gap: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.navy, fontWeight: "700" },
  chipTextActive: { color: colors.white },
  modeCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  modeCardActive: { borderColor: colors.navy, backgroundColor: "#EEF3FF" },
  modeTitle: { color: colors.navy, fontWeight: "800" },
  modeSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.navy },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.navy,
  },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: {
    width: "30%",
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  slotActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  slotText: { color: colors.navy, fontWeight: "700" },
  slotTextActive: { color: colors.white },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: spacing.md, color: colors.navy },
  textarea: {
    minHeight: 110,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.navy,
    textAlignVertical: "top",
  },
  counter: { alignSelf: "flex-end", color: colors.textMuted, fontSize: 12 },
  error: { color: colors.primary, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  secure: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignItems: "flex-start",
  },
  secureText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  successRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { color: colors.navy, fontWeight: "800", fontSize: 22 },
  numberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  number: { color: colors.navy, fontWeight: "800" },
  pendingBadge: {
    backgroundColor: "#FFF1E0",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  pendingText: { color: "#D97706", fontWeight: "800", fontSize: 12 },
  recapGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  recapItem: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recapLabel: { color: colors.textMuted, fontSize: 11 },
  recapValue: { color: colors.navy, fontWeight: "700", marginTop: 2 },
  ownerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  ownerName: { color: colors.navy, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 12 },
  thanks: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.lg,
    fontWeight: "600",
  },
});
