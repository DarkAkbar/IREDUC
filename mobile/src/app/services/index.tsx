import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchCategories } from "../../api/catalog";
import { fetchServices } from "../../api/services";
import { Category } from "../../api/types";
import { CategoryFilterRow } from "../../components/list/CategoryFilterRow";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { InfoBanner } from "../../components/list/InfoBanner";
import { AppHeader } from "../../components/navigation/AppHeader";
import { ServiceListCard } from "../../components/ServiceListCard";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { colors, spacing, typography } from "../../theme";
import { formatResultCount } from "../../utils/formatCount";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  electricite: "flash-outline",
  plomberie: "water-outline",
  demenagement: "bus-outline",
  menuiserie: "hammer-outline",
  peinture: "color-palette-outline",
  decoration: "sparkles-outline",
  ameublement: "bed-outline",
  batiment: "business-outline",
  mecanique: "cog-outline",
};

function asCategoryList(value: unknown): Category[] {
  return Array.isArray(value) ? (value as Category[]) : [];
}

export default function ServicesListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId?: string;
    categorySlug?: string;
    q?: string;
  }>();

  const categoriesQuery = useQuery({
    queryKey: ["categories", "SERVICE"],
    queryFn: () => fetchCategories("SERVICE"),
  });

  const categories = asCategoryList(categoriesQuery.data);

  const [categoryId, setCategoryId] = useState(params.categoryId ?? "");
  const [q, setQ] = useState(params.q ?? "");
  const debouncedQ = useDebouncedValue(q, 300);

  useEffect(() => {
    if (categoryId || categories.length === 0) return;
    const fromSlug = categories.find((c) => c.slug === params.categorySlug)?.id;
    setCategoryId(params.categoryId || fromSlug || categories[0].id);
  }, [categories, categoryId, params.categoryId, params.categorySlug]);

  const resolvedCategoryId = categoryId || categories[0]?.id;
  const activeCategory = categories.find((c) => c.id === resolvedCategoryId);

  const categoryTabs = useMemo(
    () =>
      categories.map((c) => ({
        key: c.id,
        label: c.name,
        icon: CATEGORY_ICONS[c.slug] ?? ("briefcase-outline" as const),
      })),
    [categories]
  );

  const queryFilters = {
    categoryId: resolvedCategoryId || undefined,
    q: debouncedQ || undefined,
  };

  const query = useInfiniteQuery({
    queryKey: ["services", queryFilters],
    enabled: Boolean(resolvedCategoryId) || Boolean(debouncedQ),
    queryFn: ({ pageParam }) =>
      fetchServices({ ...queryFilters, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Services"
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Rechercher un service…"
      />

      <View style={styles.tabsBlock}>
        {categoryTabs.length > 0 ? (
          <CategoryFilterRow
            tabs={categoryTabs}
            activeKey={resolvedCategoryId ?? ""}
            onChange={setCategoryId}
            onFilterPress={() => router.push("/filters" as never)}
            activeColor={colors.primary}
          />
        ) : null}
      </View>

      <View style={styles.heading}>
        <Text style={typography.title}>
          {activeCategory ? `Services — ${activeCategory.name}` : "Services"}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.count}>{formatResultCount(total)}</Text>
          <View style={styles.sortBtn}>
            <Text style={styles.sortText}>Trier par · Récent</Text>
            <Ionicons name="chevron-down" size={14} color={colors.navy} />
          </View>
        </View>
      </View>

      {categoriesQuery.isError ? (
        <ErrorState onRetry={() => void categoriesQuery.refetch()} />
      ) : null}

      {query.isLoading || categoriesQuery.isLoading ? <ListSkeleton /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {!query.isLoading && !query.isError && !categoriesQuery.isError ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ServiceListCard item={item} />}
          contentContainerStyle={styles.listContent}
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
              title="Aucun service trouvé"
              message={
                debouncedQ
                  ? "Aucun résultat pour cette recherche. Essayez un autre mot-clé."
                  : "Essayez une autre catégorie ou un autre mot-clé."
              }
            />
          }
          ListFooterComponent={
            items.length > 0 ? (
              <InfoBanner text="Cliquez sur une image ou sur le bouton « Réserver » pour voir tous les détails du service, le profil du prestataire et effectuer votre réservation." />
            ) : null
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabsBlock: {
    marginTop: spacing.sm,
    flexGrow: 0,
    flexShrink: 0,
  },
  heading: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  count: { color: colors.textMuted, fontWeight: "600" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
