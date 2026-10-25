import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMyProvider } from "../../api/providers";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { colors, radii, spacing, typography } from "../../theme";

const CARDS = [
  {
    key: "PROPERTY" as const,
    title: "Propriétaire, bailleur ou agence",
    type: "INDIVIDUAL",
    icon: "home-outline" as const,
    benefits: [
      "Publiez vos biens à louer ou à vendre",
      "Recevez des demandes qualifiées",
      "Gérez vos annonces depuis l'app",
    ],
  },
  {
    key: "SERVICE" as const,
    title: "Prestataire de services",
    type: "SERVICE_PROVIDER",
    icon: "construct-outline" as const,
    benefits: [
      "Proposez vos services habitat",
      "Touchez des clients à Kinshasa",
      "Suivez vos demandes reçues",
    ],
  },
];

export default function PartnerChooseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useRequireAuth();

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
    const status = providerQuery.data?.reviewStatus;
    if (!status) return;
    if (status === "DRAFT") {
      router.replace("/partner/form" as never);
      return;
    }
    router.replace("/partner/status" as never);
  }, [providerQuery.data, router]);

  if (!isAuthenticated || providerQuery.isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.navy} />
      </View>
    );
  }

  if (providerQuery.data) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.content}>
        <Text style={typography.title}>Devenir partenaire</Text>
        <Text style={styles.subtitle}>
          Choisissez le profil qui correspond à votre activité. Vous pourrez
          compléter le dossier ensuite.
        </Text>

        {CARDS.map((card) => (
          <Pressable
            key={card.key}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/partner/form",
                params: {
                  type:
                    card.key === "SERVICE" ? "SERVICE_PROVIDER" : "INDIVIDUAL",
                  intent: card.key,
                },
              } as never)
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Ionicons name={card.icon} size={22} color={colors.navy} />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
            {card.benefits.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.benefit}>{b}</Text>
              </View>
            ))}
            {card.key === "PROPERTY" ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/partner/form",
                    params: { type: "AGENCY", intent: "PROPERTY" },
                  } as never)
                }
                style={styles.agencyLink}
              >
                <Text style={styles.agencyLinkText}>
                  Vous êtes une agence ? Continuer en tant qu&apos;agence
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  subtitle: { color: colors.muted, marginBottom: spacing.sm, lineHeight: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8EEF9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { flex: 1, fontWeight: "800", fontSize: 16, color: colors.navy },
  benefitRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: 6 },
  benefit: { flex: 1, color: colors.muted, fontSize: 13 },
  agencyLink: { marginTop: spacing.sm },
  agencyLinkText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
