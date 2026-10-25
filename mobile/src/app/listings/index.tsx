import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../../api/client";
import {
  archiveProperty,
  fetchMyProperties,
  submitProperty,
} from "../../api/properties";
import {
  archiveService,
  fetchMyServices,
  submitService,
} from "../../api/services";
import { ListingStatus, PropertyDetail, ServiceDetail } from "../../api/types";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import {
  PublishFab,
  PUBLISH_FAB_BOTTOM_INSET,
  usePublishFabScroll,
} from "../../components/PublishFab";
import { Button } from "../../components/ui/Button";
import { HorizontalChipScroll } from "../../components/ui/HorizontalChipScroll";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useOpenPublish } from "../../hooks/useOpenPublish";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { usePublishStore } from "../../store/publishStore";
import { colors, radii, spacing, typography } from "../../theme";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/errors";

type TabKey = ListingStatus;
type ListingItem =
  | { kind: "PROPERTY"; data: PropertyDetail }
  | { kind: "SERVICE"; data: ServiceDetail };

const TABS: { key: TabKey; label: string }[] = [
  { key: "DRAFT", label: "Brouillons" },
  { key: "PENDING", label: "En attente" },
  { key: "APPROVED", label: "Approuvées" },
  { key: "REJECTED", label: "Rejetées" },
  { key: "ARCHIVED", label: "Archivées" },
];

function statusColor(status: string) {
  switch (status) {
    case "APPROVED":
      return colors.success;
    case "PENDING":
      return "#D97706";
    case "REJECTED":
      return colors.primary;
    case "ARCHIVED":
      return colors.textMuted;
    default:
      return colors.navy;
  }
}

export default function MyListingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const { openPublish } = useOpenPublish();
  const { onScroll: onFabScroll } = usePublishFabScroll();
  const resetPublish = usePublishStore((s) => s.reset);
  const [tab, setTab] = useState<TabKey>("DRAFT");

  const propertiesQuery = useQuery({
    queryKey: ["my-properties", tab],
    enabled: isAuthenticated,
    queryFn: () => fetchMyProperties({ status: tab, limit: 50 }),
  });

  const servicesQuery = useQuery({
    queryKey: ["my-services", tab],
    enabled: isAuthenticated,
    queryFn: () => fetchMyServices({ status: tab, limit: 50 }),
  });

  const items: ListingItem[] = [
    ...(propertiesQuery.data?.data ?? []).map((data) => ({
      kind: "PROPERTY" as const,
      data,
    })),
    ...(servicesQuery.data?.data ?? []).map((data) => ({
      kind: "SERVICE" as const,
      data,
    })),
  ];

  const loading = propertiesQuery.isLoading || servicesQuery.isLoading;
  const error = propertiesQuery.isError || servicesQuery.isError;

  async function refresh() {
    await Promise.all([
      propertiesQuery.refetch(),
      servicesQuery.refetch(),
    ]);
  }

  function onEdit(item: ListingItem) {
    resetPublish();
    router.push({
      pathname: "/publish",
      params: { id: item.data.id, type: item.kind },
    } as never);
  }

  function onSubmit(item: ListingItem) {
    Alert.alert("Soumettre", "Envoyer cette annonce pour validation ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Soumettre",
        onPress: () => {
          void (item.kind === "PROPERTY"
            ? submitProperty(item.data.id)
            : submitService(item.data.id)
          )
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: ["my-properties"] });
              void queryClient.invalidateQueries({ queryKey: ["my-services"] });
              Alert.alert("OK", "Annonce soumise pour validation.");
            })
            .catch((error) =>
              Alert.alert(
                "Erreur",
                getErrorMessage(error, "Soumission impossible.")
              )
            );
        },
      },
    ]);
  }

  function onArchive(item: ListingItem) {
    Alert.alert("Archiver", "Archiver cette annonce ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Archiver",
        style: "destructive",
        onPress: () => {
          void (item.kind === "PROPERTY"
            ? archiveProperty(item.data.id)
            : archiveService(item.data.id)
          )
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: ["my-properties"] });
              void queryClient.invalidateQueries({ queryKey: ["my-services"] });
            })
            .catch((error) =>
              Alert.alert(
                "Erreur",
                getErrorMessage(error, "Archivage impossible.")
              )
            );
        },
      },
    ]);
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <EmptyState
          title="Connexion requise"
          message="Connectez-vous pour gérer vos annonces."
          actionLabel="Se connecter"
          onAction={() => requireAuth("/listings")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.header}>
        <Text style={typography.title}>Mes annonces</Text>
      </View>
      <Pressable
        style={styles.partnerBanner}
        onPress={() => router.push("/partner/status" as never)}
      >
        <Ionicons name="briefcase-outline" size={18} color={colors.navy} />
        <Text style={styles.partnerBannerText}>Suivre mon dossier partenaire</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <Pressable
        style={styles.receivedLink}
        onPress={() => router.push("/listings/received" as never)}
      >
        <Ionicons name="mail-unread-outline" size={18} color={colors.navy} />
        <Text style={styles.receivedText}>Demandes reçues</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <ScrollTabs tab={tab} onChange={setTab} />

      {loading ? <ListSkeleton /> : null}
      {error ? <ErrorState onRetry={() => void refresh()} /> : null}

      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.kind}-${item.data.id}`}
          contentContainerStyle={[
            {
              paddingBottom: PUBLISH_FAB_BOTTOM_INSET,
              paddingTop: spacing.md,
            },
            items.length === 0 && { flexGrow: 1 },
          ]}
          scrollEventThrottle={16}
          onScroll={(e) => onFabScroll(e.nativeEvent.contentOffset.y)}
          refreshControl={
            <RefreshControl
              refreshing={
                propertiesQuery.isRefetching || servicesQuery.isRefetching
              }
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              fill
              title="Aucune annonce"
              message="Publiez un bien ou un service pour le voir ici."
              actionLabel="Publier une annonce"
              onAction={() => openPublish("/listings")}
            />
          }
          renderItem={({ item }) => {
            const photo = mediaUrl(
              item.data.coverPhoto?.url ?? item.data.media?.[0]?.url
            );
            const rejected =
              item.data.status === "REJECTED"
                ? item.data.rejectionReason
                : null;
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  {photo ? (
                    <Image
                      source={{ uri: photo }}
                      style={styles.image}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.image, styles.placeholder]} />
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.badge}>
                      {item.kind === "PROPERTY" ? "Bien" : "Service"}
                    </Text>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.data.title}
                    </Text>
                    {item.kind === "PROPERTY" ? (
                      <Text style={styles.price}>
                        {formatPrice(
                          item.data.price,
                          item.data.offerType
                        ).replace(" $", " USD")}
                      </Text>
                    ) : null}
                    <Text style={[styles.status, { color: statusColor(item.data.status) }]}>
                      {TABS.find((t) => t.key === item.data.status)?.label ??
                        item.data.status}
                    </Text>
                  </View>
                </View>
                {rejected ? (
                  <Text style={styles.reason}>Motif : {rejected}</Text>
                ) : null}
                <View style={styles.actions}>
                  {(item.data.status === "DRAFT" ||
                    item.data.status === "REJECTED") && (
                    <>
                      <Button
                        label="Modifier"
                        variant="outline"
                        style={styles.btn}
                        onPress={() => onEdit(item)}
                      />
                      <Button
                        label="Soumettre"
                        style={styles.btn}
                        onPress={() => onSubmit(item)}
                      />
                    </>
                  )}
                  {item.data.status === "REJECTED" ? (
                    <Button
                      label="Voir le motif"
                      variant="outline"
                      style={styles.btn}
                      onPress={() =>
                        Alert.alert(
                          "Motif du rejet",
                          rejected || "Motif non précisé."
                        )
                      }
                    />
                  ) : null}
                  {item.data.status !== "ARCHIVED" ? (
                    <Button
                      label="Archiver"
                      variant="outline"
                      style={styles.btn}
                      onPress={() => onArchive(item)}
                    />
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      ) : null}
      <PublishFab aboveTabs={false} />
    </View>
  );
}

function ScrollTabs({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <HorizontalChipScroll>
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <Pressable
            key={t.key}
            style={[styles.tab, active && styles.tabOn]}
            onPress={() => onChange(t.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextOn]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </HorizontalChipScroll>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  partnerBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  partnerBannerText: { flex: 1, color: colors.navy, fontWeight: "700", fontSize: 13 },
  receivedLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receivedText: { flex: 1, color: colors.navy, fontWeight: "700" },
  tab: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  tabOn: { backgroundColor: colors.navy },
  tabText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  tabTextOn: { color: colors.white },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  top: { flexDirection: "row", gap: spacing.md },
  image: { width: 84, height: 84, borderRadius: radii.md },
  placeholder: { backgroundColor: colors.skeleton },
  badge: { color: colors.primary, fontWeight: "800", fontSize: 11 },
  title: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  price: { color: colors.primary, fontWeight: "800" },
  status: { fontWeight: "700", fontSize: 12, marginTop: 2 },
  reason: { color: colors.primary, marginTop: spacing.sm, fontSize: 12 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: { flexGrow: 1, minWidth: "45%", minHeight: 44 },
});
