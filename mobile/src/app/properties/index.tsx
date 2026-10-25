import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { pushPath } from "../../utils/navigation";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchProperties } from "../../api/properties";
import { PropertyKind, PropertySort } from "../../api/types";
import { CategoryTabs } from "../../components/list/CategoryTabs";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { InfoBanner } from "../../components/list/InfoBanner";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { RemovableChip } from "../../components/list/RemovableChip";
import { PropertyListCard } from "../../components/PropertyListCard";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { SearchInput } from "../../components/ui/SearchInput";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useSearchStore } from "../../store/searchStore";
import { colors, spacing, typography } from "../../theme";
import { kindLabel } from "../../utils/format";

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    kind?: string;
    offerType?: string;
    q?: string;
  }>();
  const filters = useSearchStore((s) => s.filters);
  const patchFilters = useSearchStore((s) => s.patchFilters);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [kind, setKind] = useState<string>(params.kind ?? "HOUSE");
  const [sort, setSort] = useState<PropertySort>("recent");
  const [q, setQ] = useState(params.q ?? filters.q ?? "");
  const [offerType, setOfferType] = useState<"RENT" | "SALE" | undefined>(
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

  const activeChips = [
    offerType === "RENT" ? { key: "offer", label: "À louer" } : null,
    offerType === "SALE" ? { key: "offer", label: "À vendre" } : null,
    filters.communeId ? { key: "commune", label: "Commune filtrée" } : null,
    filters.minPrice != null || filters.maxPrice != null
      ? { key: "price", label: "Prix" }
      : null,
    filters.bedrooms != null
      ? { key: "bedrooms", label: `${filters.bedrooms}+ ch.` }
      : null,
    filters.bathrooms != null
      ? { key: "bathrooms", label: `${filters.bathrooms}+ sdb` }
      : null,
    filters.minArea != null
      ? { key: "area", label: `${filters.minArea}+ m²` }
      : null,
  ].filter(Boolean) as { key: string; label: string }[];

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
    // Android / web : cycle simple
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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader title="Biens" />
      <SearchInput
        value={q}
        onChangeText={setQ}
        placeholder="Rechercher par ville, quartier, type de bien..."
        onFilterPress={() => router.push("/filters")}
        activeFilterCount={activeChips.length}
      />
      <View style={{ marginTop: spacing.md }}>
        <CategoryTabs tabs={KIND_TABS} activeKey={kind} onChange={setKind} />
      </View>

      {activeChips.length > 0 ? (
        <View style={styles.chips}>
          {activeChips.map((chip) => (
            <RemovableChip
              key={chip.key}
              label={chip.label}
              onRemove={() => {
                if (chip.key === "offer") {
                  setOfferType(undefined);
                  patchFilters({ offerType: undefined });
                }
                if (chip.key === "commune") patchFilters({ communeId: undefined });
                if (chip.key === "price")
                  patchFilters({ minPrice: undefined, maxPrice: undefined });
                if (chip.key === "bedrooms") patchFilters({ bedrooms: undefined });
                if (chip.key === "bathrooms") patchFilters({ bathrooms: undefined });
                if (chip.key === "area") patchFilters({ minArea: undefined });
              }}
            />
          ))}
          <Pressable onPress={resetFilters}>
            <Text style={styles.reset}>Réinitialiser</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.heading}>
        <Text style={typography.title}>{listTitle}</Text>
        <Text style={styles.subtitle}>
          Des biens vérifiés pour un cadre de vie meilleur.
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.count}>{total} résultats</Text>
          <Pressable style={styles.sortBtn} onPress={openSort}>
            <Text style={styles.sortText}>
              Trier par · {SORT_OPTIONS.find((o) => o.key === sort)?.label}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.navy} />
          </Pressable>
        </View>
      </View>

      {query.isLoading ? <ListSkeleton /> : null}
      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyListCard item={item} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  subtitle: { color: colors.textMuted, marginTop: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  count: { color: colors.textMuted, fontWeight: "600" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  reset: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  loadingMore: {
    textAlign: "center",
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
});
