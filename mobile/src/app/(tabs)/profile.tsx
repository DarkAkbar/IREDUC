import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resendVerification } from "../../api/auth";
import { API_URL, mediaUrl } from "../../api/client";
import { fetchMyProvider } from "../../api/providers";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

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
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Ionicons
        name={icon}
        size={20}
        color={danger ? colors.primary : colors.navy}
      />
      <Text style={[styles.menuLabel, danger && styles.menuDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function providerStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    default:
      return status;
  }
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, logout } = useAuthStore();
  const [resending, setResending] = useState(false);

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated && Boolean(user?.providerProfile),
    queryFn: fetchMyProvider,
    retry: false,
  });

  const healthQuery = useQuery({
    queryKey: ["health-info"],
    enabled: __DEV__,
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

  async function onResend() {
    if (!user?.email) return;
    setResending(true);
    try {
      const result = await resendVerification(user.email);
      Alert.alert("Vérification", result.message);
    } catch (error) {
      Alert.alert(
        "Vérification",
        getErrorMessage(error, "Impossible de renvoyer l'e-mail.")
      );
    } finally {
      setResending(false);
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

  if (isHydrated && !isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={typography.title}>Profil</Text>
        <Text style={styles.subtitle}>
          Connectez-vous ou créez un compte pour gérer vos favoris, alertes et
          demandes.
        </Text>
        <Button
          label="Se connecter"
          style={{ marginTop: spacing.lg }}
          onPress={() =>
            router.push({
              pathname: "/auth/login",
              params: { returnTo: "/(tabs)/profile" },
            } as never)
          }
        />
        <Button
          label="Créer un compte"
          variant="outline"
          style={{ marginTop: spacing.sm }}
          onPress={() =>
            router.push({
              pathname: "/auth/login",
              params: { returnTo: "/(tabs)/profile" },
            } as never)
          }
        />
      </View>
    );
  }

  const avatar = mediaUrl(user?.avatarUrl);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={providerQuery.isRefetching || healthQuery.isRefetching}
            onRefresh={() => {
              void providerQuery.refetch();
              if (__DEV__) void healthQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={typography.title}>Profil</Text>

        <View style={styles.headerCard}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={28} color={colors.navy} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {user && !user.emailVerified ? (
          <View style={styles.verifyBanner}>
            <Ionicons name="mail-unread-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyTitle}>Vérifiez votre e-mail</Text>
              <Text style={styles.verifyText}>
                Un e-mail de confirmation est requis pour certaines actions.
              </Text>
              <Button
                label="Renvoyer l'e-mail"
                variant="outline"
                loading={resending}
                onPress={() => void onResend()}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.partnerCard}>
          <Text style={styles.partnerTitle}>
            Voulez-vous proposer un bien ou un service ?
          </Text>
          {reviewStatus ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>
                Statut partenaire : {providerStatusLabel(reviewStatus)}
              </Text>
              {reviewStatus === "REJECTED" && provider?.rejectionReason ? (
                <Text style={styles.statusReason}>
                  Motif : {provider.rejectionReason}
                </Text>
              ) : null}
              {reviewStatus === "APPROVED" ? (
                <>
                  <Text style={styles.statusReason}>
                    Votre profil partenaire est approuvé. Vous pouvez publier.
                  </Text>
                  <Button
                    label="Publier"
                    onPress={() => router.push("/publish" as never)}
                    style={{ marginTop: spacing.sm }}
                  />
                </>
              ) : null}
              {reviewStatus === "PENDING" || reviewStatus === "REJECTED" ? (
                <Button
                  label="Voir mon dossier"
                  variant="outline"
                  onPress={() => router.push("/partner" as never)}
                  style={{ marginTop: spacing.sm }}
                />
              ) : null}
            </View>
          ) : (
            <Button
              label="Devenir partenaire"
              onPress={() => router.push("/partner" as never)}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>

        <View style={styles.menu}>
          {reviewStatus === "APPROVED" ? (
            <MenuRow
              icon="home-outline"
              label="Mes annonces"
              onPress={() => router.push("/listings" as never)}
            />
          ) : null}
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
            icon="heart-outline"
            label="Mes favoris"
            onPress={() => router.push("/favorites" as never)}
          />
          <MenuRow
            icon="notifications-outline"
            label="Mes alertes"
            onPress={() => router.push("/profile/alerts" as never)}
          />
          <MenuRow
            icon="notifications"
            label="Notifications"
            onPress={() => router.push("/notifications" as never)}
          />
          <MenuRow
            icon="information-circle-outline"
            label="À propos"
            onPress={() => router.push("/profile/about" as never)}
          />
          <MenuRow
            icon="log-out-outline"
            label="Se déconnecter"
            danger
            onPress={onLogout}
          />
        </View>

        {__DEV__ ? (
          <View style={styles.devBox}>
            <Text style={styles.devTitle}>Mode développement</Text>
            <Text style={styles.devText}>API : {API_URL}</Text>
            <Text style={styles.devText}>
              Base : {healthQuery.data?.database ?? "…"}
            </Text>
            <Text style={styles.devText}>
              Biens : {healthQuery.data?.propertiesTotal ?? "—"}
              {healthQuery.data?.propertiesByStatus
                ? ` (${Object.entries(healthQuery.data.propertiesByStatus)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(", ")})`
                : ""}
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
    paddingHorizontal: spacing.lg,
  },
  content: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
  subtitle: { ...typography.body, marginTop: spacing.md },
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
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: colors.navy, fontWeight: "800", fontSize: 18 },
  email: { color: colors.textMuted, marginTop: 2 },
  verifyBanner: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "#FDECEC",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#F5C2C2",
  },
  verifyTitle: { color: colors.primary, fontWeight: "800" },
  verifyText: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  partnerCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partnerTitle: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  statusBox: { marginTop: spacing.sm, gap: 4 },
  statusLabel: { color: colors.navy, fontWeight: "700" },
  statusReason: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  menu: {
    marginTop: spacing.lg,
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
  menuLabel: { flex: 1, color: colors.navy, fontWeight: "700", fontSize: 14 },
  menuDanger: { color: colors.primary },
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
