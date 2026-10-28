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
import { HorizontalChipScroll } from "../../components/ui/HorizontalChipScroll";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";

type TabKey = "ALL" | RequestStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "Toutes" },
  { key: "PENDING", label: "En attente" },
  { key: "APPROVED", label: "Approuvées" },
  { key: "REJECTED", label: "Rejetées" },
];

function tabCount(
  key: TabKey,
  counters?: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  }
) {
  if (!counters) return undefined;
  if (key === "ALL") return counters.all;
  if (key === "PENDING") return counters.pending;
  if (key === "APPROVED") return counters.approved;
  if (key === "REJECTED") return counters.rejected;
  return undefined;
}

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
  const isEmpty = !query.isLoading && !query.isError && items.length === 0;

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
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Mes demandes
          </Text>
          {counters && counters.all > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{counters.all}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.city}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text style={styles.cityText}>Kinshasa</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Suivez l'état de toutes vos demandes de réservation.
      </Text>

      <HorizontalChipScroll contentContainerStyle={styles.tabsContent}>
        {TABS.map((t) => {
          const count = tabCount(t.key, counters);
          const active = tab === t.key;
          const label =
            count != null && count > 0 ? `${t.label} (${count})` : t.label;
          return (
            <Pressable
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </HorizontalChipScroll>

      {query.isLoading ? <ListSkeleton /> : null}
      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={items}
          style={styles.list}
          initialNumToRender={10}
          windowSize={7}
          removeClippedSubviews
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RequestCard item={item} />}
          contentContainerStyle={[
            styles.listContent,
            isEmpty && styles.listContentEmpty,
          ]}
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
              fill
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
    minHeight: 48,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  headerTitle: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 17,
  },
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
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  tabsContent: {
    paddingBottom: 0,
  },
  tab: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  tabActive: { backgroundColor: colors.navy },
  tabText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: colors.white },
  list: { flex: 1 },
  listContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
});
