import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL, mediaUrl } from "../../api/client";
import { fetchPublicConfig } from "../../api/config";
import { fetchMyProvider } from "../../api/providers";
import {
  fetchProfileSummary,
  uploadAvatar,
  type ProfileSummary,
} from "../../api/users";
import { GuestPrompt } from "../../components/GuestPrompt";
import { Button } from "../../components/ui/Button";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage } from "../../utils/errors";
import {
  formatPhoneDisplay,
  phoneDigitsForWhatsApp,
} from "../../utils/phone";

type HealthInfo = {
  database: string;
  apiUrl: string;
  propertiesTotal: number;
  propertiesByStatus: Record<string, number>;
};

function MenuRow({
  icon,
  label,
  onPress,
  badge,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
  last?: boolean;
}) {
  return (
    <Pressable
      style={[styles.menuRow, last && styles.menuRowLast]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={colors.navy} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge != null && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function StatChip({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.statChip} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function roleBadges(
  user: {
    systemRole: string;
    providerProfile: { reviewStatus: string } | null;
  },
  reviewStatus?: string
) {
  const badges: { label: string; tone: "navy" | "ok" | "warn" | "bad" }[] = [
    { label: "Client", tone: "navy" },
  ];
  const status = reviewStatus ?? user.providerProfile?.reviewStatus;
  if (status === "APPROVED") {
    badges.push({ label: "Partenaire approuvé", tone: "ok" });
  } else if (status === "PENDING") {
    badges.push({ label: "Partenaire en attente", tone: "warn" });
  } else if (status === "REJECTED") {
    badges.push({ label: "Partenaire rejeté", tone: "bad" });
  }
  if (user.systemRole === "ADMIN" || user.systemRole === "SUPER_ADMIN") {
    badges.push({ label: "Admin", tone: "navy" });
  }
  return badges;
}

function profileCompletion(user: {
  avatarUrl: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  whatsapp: string | null;
}) {
  const checks = [
    { key: "photo", ok: Boolean(user.avatarUrl), tip: "Ajoutez une photo de profil" },
    { key: "name", ok: user.fullName.trim().length >= 2, tip: "Complétez votre nom" },
    { key: "phone", ok: Boolean(user.phone), tip: "Ajoutez votre numéro" },
    { key: "email", ok: Boolean(user.email), tip: "Ajoutez un e-mail (facultatif)" },
    { key: "whatsapp", ok: Boolean(user.whatsapp), tip: "Indiquez votre WhatsApp" },
  ];
  const done = checks.filter((c) => c.ok).length;
  const percent = Math.round((done / checks.length) * 100);
  const next = checks.find((c) => !c.ok);
  return { percent, tip: next?.tip ?? "Profil complet" };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isHydrated, logout, setUser } = useAuthStore();

  const summaryQuery = useQuery({
    queryKey: ["profile-summary"],
    enabled: isAuthenticated,
    queryFn: fetchProfileSummary,
  });

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated && Boolean(user?.providerProfile),
    queryFn: fetchMyProvider,
    retry: false,
  });

  const configQuery = useQuery({
    queryKey: ["public-config"],
    enabled: isAuthenticated,
    queryFn: fetchPublicConfig,
    staleTime: 300_000,
  });

  const healthQuery = useQuery({
    queryKey: ["health-info"],
    enabled: __DEV__ && isAuthenticated,
    queryFn: async () => {
      const origin = API_URL.replace(/\/api\/v1\/?$/, "");
      const response = await fetch(`${origin}/health/info`);
      if (!response.ok) throw new Error("health/info indisponible");
      return (await response.json()) as HealthInfo;
    },
    retry: false,
    staleTime: 60_000,
  });

  const provider = providerQuery.data;
  const reviewStatus =
    provider?.reviewStatus ?? user?.providerProfile?.reviewStatus;
  const summary: ProfileSummary | undefined = summaryQuery.data;
  const partner = summary?.partner;

  const completion = useMemo(
    () => (user ? profileCompletion(user) : { percent: 0, tip: "" }),
    [user]
  );
  const badges = useMemo(
    () => (user ? roleBadges(user, reviewStatus) : []),
    [user, reviewStatus]
  );

  async function onRefresh() {
    await Promise.all([
      summaryQuery.refetch(),
      providerQuery.refetch(),
      configQuery.refetch(),
      __DEV__ ? healthQuery.refetch() : Promise.resolve(),
    ]);
  }

  async function pickAndUploadAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à la galerie pour choisir une photo."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      const updated = await uploadAvatar(manipulated.uri, "image/jpeg");
      setUser(updated);
      await queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
    } catch (error) {
      Alert.alert(
        "Avatar",
        getErrorMessage(error, "Impossible d'envoyer la photo.")
      );
    }
  }

  function onLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  }

  async function contactSupport() {
    const number =
      configQuery.data?.supportWhatsapp ?? "+243810000000";
    const digits = phoneDigitsForWhatsApp(number);
    const version =
      Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
    const text = encodeURIComponent(
      `Bonjour IREDUC, je suis ${user?.fullName ?? "un utilisateur"} (app v${version}).`
    );
    const url = `https://wa.me/${digits}?text=${text}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Support", "Impossible d'ouvrir WhatsApp.");
    }
  }

  if (isHydrated && !isAuthenticated) {
    return (
      <GuestPrompt
        icon="person-outline"
        title="Votre espace IREDUC"
        message="Connectez-vous pour gérer votre profil, vos alertes et vos demandes."
        returnTo="/(tabs)/profile"
      />
    );
  }

  const avatar = mediaUrl(user?.avatarUrl);
  const loading = summaryQuery.isLoading && !summary;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={
              summaryQuery.isRefetching ||
              providerQuery.isRefetching ||
              configQuery.isRefetching
            }
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={typography.title}>Profil</Text>

        {summaryQuery.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Impossible de charger le résumé. Tirez pour actualiser.
            </Text>
          </View>
        ) : null}

        <View style={styles.headerCard}>
          <Pressable style={styles.avatarWrap} onPress={() => void pickAndUploadAvatar()}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={28} color={colors.navy} />
              </View>
            )}
            <View style={styles.avatarEdit}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.phone}>
              {user?.phone ? formatPhoneDisplay(user.phone) : ""}
            </Text>
            <View style={styles.badgeRow}>
              {badges.map((b) => (
                <View
                  key={b.label}
                  style={[
                    styles.roleBadge,
                    b.tone === "ok" && styles.roleOk,
                    b.tone === "warn" && styles.roleWarn,
                    b.tone === "bad" && styles.roleBad,
                  ]}
                >
                  <Text style={styles.roleBadgeText}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          style={styles.progressCard}
          onPress={() => router.push("/profile/edit" as never)}
        >
          <Text style={styles.progressTitle}>
            Profil complété à {completion.percent} %
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${completion.percent}%` }]}
            />
          </View>
          <Text style={styles.progressTip}>{completion.tip}</Text>
        </Pressable>

        {loading ? (
          <View style={styles.statsRow}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} height={64} style={{ flex: 1 }} />
            ))}
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatChip
              label="Demandes"
              value={summary?.requestsTotal ?? 0}
              onPress={() => router.push("/(tabs)/requests" as never)}
            />
            <StatChip
              label="Favoris"
              value={summary?.favorites ?? 0}
              onPress={() => router.push("/(tabs)/favorites" as never)}
            />
            <StatChip
              label="Messages"
              value={summary?.unreadMessages ?? 0}
              onPress={() => router.push("/messages" as never)}
            />
            {partner ? (
              <StatChip
                label="Annonces"
                value={partner.listingsTotal}
                onPress={() => router.push("/listings" as never)}
              />
            ) : null}
          </View>
        )}

        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.menu}>
          <MenuRow
            icon="create-outline"
            label="Modifier mon profil"
            onPress={() => router.push("/profile/edit" as never)}
          />
          <MenuRow
            icon="lock-closed-outline"
            label="Changer le mot de passe"
            onPress={() => router.push("/profile/password" as never)}
          />
          <MenuRow
            icon="phone-portrait-outline"
            label="Mes appareils"
            onPress={() => router.push("/profile/sessions" as never)}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>Mon activité</Text>
        <View style={styles.menu}>
          <MenuRow
            icon="document-text-outline"
            label="Mes demandes"
            onPress={() => router.push("/(tabs)/requests" as never)}
          />
          <MenuRow
            icon="heart-outline"
            label="Favoris"
            onPress={() => router.push("/(tabs)/favorites" as never)}
          />
          <MenuRow
            icon="chatbubble-ellipses-outline"
            label="Messages"
            badge={summary?.unreadMessages}
            onPress={() => router.push("/messages" as never)}
          />
          <MenuRow
            icon="notifications-outline"
            label="Alertes de recherche"
            onPress={() => router.push("/profile/alerts" as never)}
          />
          <MenuRow
            icon="notifications"
            label="Notifications"
            badge={summary?.unreadNotifications}
            onPress={() => router.push("/notifications" as never)}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>Espace partenaire</Text>
        {reviewStatus ? (
          <Pressable
            style={styles.partnerStatusCard}
            onPress={() => router.push("/partner/status" as never)}
          >
            <View style={styles.partnerStatusRow}>
              <Text style={styles.partnerStatusTitle}>Ma demande de partenariat</Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      reviewStatus === "APPROVED"
                        ? colors.success
                        : reviewStatus === "REJECTED"
                          ? colors.primary
                          : reviewStatus === "DRAFT"
                            ? colors.textMuted
                            : "#D97706",
                  },
                ]}
              >
                <Text style={styles.statusPillText}>
                  {reviewStatus === "PENDING"
                    ? provider?.reviewNote
                      ? "À compléter"
                      : "En examen"
                    : reviewStatus === "APPROVED"
                      ? "Approuvé"
                      : reviewStatus === "REJECTED"
                        ? "Rejeté"
                        : "Brouillon"}
                </Text>
              </View>
            </View>
            <Text style={styles.partnerReason}>
              {reviewStatus === "REJECTED" && provider?.rejectionReason
                ? `Motif : ${provider.rejectionReason}`
                : provider?.reviewNote
                  ? provider.reviewNote
                  : "Appuyez pour suivre l'état de votre dossier."}
            </Text>
          </Pressable>
        ) : null}
        {reviewStatus === "APPROVED" ? (
          <View style={styles.menu}>
            <MenuRow
              icon="add-circle-outline"
              label="Publier une annonce"
              onPress={() => router.push("/publish" as never)}
            />
            <MenuRow
              icon="home-outline"
              label="Mes annonces"
              onPress={() => router.push("/listings" as never)}
            />
            <MenuRow
              icon="mail-unread-outline"
              label="Demandes reçues"
              badge={partner?.pendingReceivedRequests}
              onPress={() => router.push("/listings/received" as never)}
              last
            />
          </View>
        ) : null}
        {!reviewStatus ? (
          <View style={styles.becomeCard}>
            <Text style={styles.becomeTitle}>Devenir partenaire</Text>
            <Text style={styles.becomeItem}>• Visibilité auprès des chercheurs</Text>
            <Text style={styles.becomeItem}>• Clients qualifiés à Kinshasa</Text>
            <Text style={styles.becomeItem}>• Portfolio professionnel</Text>
            <Button
              label="Créer mon dossier"
              onPress={() => router.push("/partner" as never)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Aide et à propos</Text>
        <View style={styles.menu}>
          <MenuRow
            icon="logo-whatsapp"
            label="Contacter le support"
            onPress={() => void contactSupport()}
          />
          <MenuRow
            icon="document-outline"
            label="Conditions d'utilisation"
            onPress={() => router.push("/profile/terms" as never)}
          />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Politique de confidentialité"
            onPress={() => router.push("/profile/privacy" as never)}
          />
          <MenuRow
            icon="information-circle-outline"
            label={`Version ${Constants.expoConfig?.version ?? "1.0.0"}`}
            onPress={() => router.push("/profile/about" as never)}
            last
          />
        </View>

        <Button
          label="Se déconnecter"
          variant="outline"
          onPress={onLogout}
          style={{ marginTop: spacing.xl }}
        />
        <Pressable
          onPress={() => router.push("/profile/delete-account" as never)}
          style={styles.deleteLink}
        >
          <Text style={styles.deleteLinkText}>Supprimer mon compte</Text>
        </Pressable>

        {__DEV__ ? (
          <View style={styles.devBox}>
            <Text style={styles.devTitle}>Mode développement</Text>
            <Text style={styles.devText}>API : {API_URL}</Text>
            <Text style={styles.devText}>
              Base : {healthQuery.data?.database ?? "…"}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  content: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
  errorBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "#FEE2E2",
    borderRadius: radii.md,
  },
  errorText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  headerCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEdit: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: { color: colors.navy, fontWeight: "800", fontSize: 18 },
  phone: { color: colors.textMuted, marginTop: 2, fontWeight: "600" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  roleBadge: {
    backgroundColor: "#E8EEF9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  roleOk: { backgroundColor: "#DCFCE7" },
  roleWarn: { backgroundColor: "#FEF3C7" },
  roleBad: { backgroundColor: "#FEE2E2" },
  roleBadgeText: { fontSize: 11, fontWeight: "700", color: colors.navy },
  progressCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  progressTrack: {
    height: 8,
    backgroundColor: colors.skeleton,
    borderRadius: 4,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.navy,
    borderRadius: 4,
  },
  progressTip: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  statValue: { color: colors.navy, fontWeight: "800", fontSize: 18 },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  sectionTitle: {
    ...typography.section,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuLabel: { flex: 1, color: colors.navy, fontWeight: "700", fontSize: 14 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  partnerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { color: colors.white, fontWeight: "800", fontSize: 11 },
  partnerStatusCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  partnerStatusTitle: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  partnerReason: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  becomeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  becomeTitle: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  becomeItem: {
    color: colors.textMuted,
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  deleteLink: { alignItems: "center", marginTop: spacing.lg, padding: spacing.sm },
  deleteLinkText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  devBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.navy,
    gap: 4,
  },
  devTitle: { color: colors.white, fontWeight: "800", fontSize: 13 },
  devText: { color: "#D7DEEE", fontSize: 11, fontWeight: "600" },
});
