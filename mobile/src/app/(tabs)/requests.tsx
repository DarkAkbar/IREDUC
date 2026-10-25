import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMyRequests } from "../../api/requests";
import { RequestStatus } from "../../api/types";
import { GuestPrompt } from "../../components/GuestPrompt";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { RequestCard } from "../../components/requests/RequestCard";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { IreducLogo } from "../../components/IreducLogo";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";

type TabKey = "ALL" | RequestStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "Toutes" },
  { key: "PENDING", label: "En attente" },
  { key: "APPROVED", label: "Approuvées" },
  { key: "REJECTED", label: "Rejetées" },
];

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [tab, setTab] = useState<TabKey>("ALL");

  const query = useInfiniteQuery({
    queryKey: ["my-requests", tab],
    enabled: isAuthenticated,
    queryFn: ({ pageParam }) =>
      fetchMyRequests({
        page: pageParam,
        limit: 10,
        status: tab === "ALL" ? undefined : tab,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const counters = query.data?.pages[0]?.counters;

  if (isHydrated && !isAuthenticated) {
    return (
      <GuestPrompt
        icon="document-text-outline"
        title="Suivez vos demandes"
        message="Connectez-vous pour suivre l'état de toutes vos demandes de réservation."
        returnTo="/(tabs)/requests"
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IreducLogo compact tagline={undefined} />
        <View style={styles.headerRight}>
          <View style={styles.city}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.cityText}>Kinshasa</Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color={colors.navy} />
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={typography.title}>Mes demandes</Text>
        {counters ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{counters.all}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.subtitle}>
        Suivez l'état de toutes vos demandes de réservation.
      </Text>

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const count =
            t.key === "ALL"
              ? counters?.all
              : t.key === "PENDING"
                ? counters?.pending
                : t.key === "APPROVED"
                  ? counters?.approved
                  : counters?.rejected;
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
                {count != null ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? <ListSkeleton /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={items}
          initialNumToRender={10}
          windowSize={7}
          removeClippedSubviews
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RequestCard item={item} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl, paddingTop: spacing.md }}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Aucune demande"
              message="Découvrez des biens et services, puis lancez une réservation."
              actionLabel="Découvrir les biens"
              onAction={() => router.push("/properties" as never)}
            />
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  city: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cityText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 20,
  },
  countBadge: {
    backgroundColor: colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  subtitle: {
    ...typography.body,
    paddingHorizontal: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: 20,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  tabActive: { backgroundColor: colors.navy },
  tabText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: colors.white },
});
