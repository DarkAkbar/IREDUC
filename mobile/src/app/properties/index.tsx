import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchProperties } from "../../api/properties";
import { PropertyKind, PropertySort } from "../../api/types";
import { CategoryTabs } from "../../components/list/CategoryTabs";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { InfoBanner } from "../../components/list/InfoBanner";
import { AppHeader } from "../../components/navigation/AppHeader";
import {
  ScreenLayout,
  screenBodyContentStyle,
} from "../../components/navigation/ScreenLayout";
import { PropertyListCard } from "../../components/PropertyListCard";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useSearchStore } from "../../store/searchStore";
import { colors, radii, spacing, typography } from "../../theme";
import { kindLabel } from "../../utils/format";
import { formatResultCount } from "../../utils/formatCount";

const KIND_TABS = [
  { key: "HOUSE", label: "Maison", icon: "home-outline" as const },
  { key: "APARTMENT", label: "Appartement", icon: "business-outline" as const },
  { key: "VILLA", label: "Villa", icon: "home" as const },
  { key: "LAND", label: "Terrain", icon: "map-outline" as const },
  { key: "ALL", label: "Plus", icon: "ellipsis-horizontal" as const },
];

const SORT_OPTIONS: { key: PropertySort; label: string }[] = [
  { key: "recent", label: "Récent" },
  { key: "price_asc", label: "Prix croissant" },
  { key: "price_desc", label: "Prix décroissant" },
];

export default function PropertiesListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    kind?: string;
    offerType?: string;
    q?: string;
  }>();
  const filters = useSearchStore((s) => s.filters);

  const [kind, setKind] = useState<string>(params.kind ?? "HOUSE");
  const [sort, setSort] = useState<PropertySort>("recent");
  const [q, setQ] = useState(params.q ?? filters.q ?? "");
  const [offerType] = useState<"RENT" | "SALE" | undefined>(
    (params.offerType as "RENT" | "SALE" | undefined) ?? filters.offerType
  );
  const debouncedQ = useDebouncedValue(q);

  const queryFilters = useMemo(
    () => ({
      kind: kind === "ALL" ? undefined : (kind as PropertyKind),
      offerType,
      communeId: filters.communeId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
      minArea: filters.minArea,
      q: debouncedQ || undefined,
      sort,
    }),
    [kind, offerType, filters, debouncedQ, sort]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (offerType) n += 1;
    if (filters.communeId) n += 1;
    if (filters.minPrice != null || filters.maxPrice != null) n += 1;
    if (filters.bedrooms != null) n += 1;
    if (filters.bathrooms != null) n += 1;
    if (filters.minArea != null) n += 1;
    return n;
  }, [offerType, filters]);

  const query = useInfiniteQuery({
    queryKey: ["properties", queryFilters],
    queryFn: ({ pageParam }) =>
      fetchProperties({ ...queryFilters, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  function openSort() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Annuler", ...SORT_OPTIONS.map((o) => o.label)],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index > 0) setSort(SORT_OPTIONS[index - 1].key);
        }
      );
      return;
    }
    const idx = SORT_OPTIONS.findIndex((o) => o.key === sort);
    setSort(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key);
  }

  const kindPlural =
    kind === "ALL" ? "Biens" : `${kindLabel(kind as PropertyKind)}s`;
  const listTitle =
    offerType === "RENT"
      ? `${kindPlural} à louer`
      : offerType === "SALE"
        ? `${kindPlural} à vendre`
        : `${kindPlural} à louer et à vendre`;

  const filterLabel =
    activeFilterCount > 0 ? `Filtres (${activeFilterCount})` : "Filtres";

  return (
    <ScreenLayout
      header={
        <AppHeader
          title="Biens"
          searchable
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Rechercher par ville, quartier…"
        />
      }
      fixedBelow={
        <CategoryTabs
          tabs={KIND_TABS}
          activeKey={kind}
          onChange={setKind}
          activeColor={colors.primary}
        />
      }
    >
      {query.isLoading ? (
        <View style={screenBodyContentStyle}>
          <ListSkeleton />
        </View>
      ) : null}
      {query.isError ? (
        <View style={screenBodyContentStyle}>
          <ErrorState onRetry={() => void query.refetch()} />
        </View>
      ) : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardSlot}>
              <PropertyListCard item={item} />
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.heading}>
              <Text style={styles.listTitle}>{listTitle}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.count}>{formatResultCount(total)}</Text>
                <View style={styles.metaActions}>
                  <Pressable
                    style={styles.filterBtn}
                    onPress={() => router.push("/filters")}
                    accessibilityLabel={filterLabel}
                  >
                    <Ionicons
                      name="options-outline"
                      size={16}
                      color={colors.navy}
                    />
                    <Text style={styles.filterText}>{filterLabel}</Text>
                  </Pressable>
                  <Pressable style={styles.sortBtn} onPress={openSort}>
                    <Text style={styles.sortText}>
                      Trier par ·{" "}
                      {SORT_OPTIONS.find((o) => o.key === sort)?.label}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={colors.navy}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          }
          contentContainerStyle={[
            screenBodyContentStyle,
            { paddingBottom: spacing.xxl },
          ]}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
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
              title="Aucun bien trouvé"
              message="Modifiez vos filtres ou votre recherche."
            />
          }
          ListFooterComponent={
            <>
              {query.isFetchingNextPage ? (
                <Text style={styles.loadingMore}>Chargement...</Text>
              ) : null}
              <InfoBanner text="Cliquez sur une image ou sur le bouton « Réserver » pour voir tous les détails de l'offre et effectuer votre réservation." />
            </>
          }
        />
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.sectionHeading,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  count: { color: colors.textMuted, fontWeight: "600" },
  metaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  filterBtn: {
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
  filterText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  cardSlot: {
    marginHorizontal: -spacing.lg,
    marginBottom: 12 - spacing.lg,
  },
  loadingMore: {
    textAlign: "center",
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
});
