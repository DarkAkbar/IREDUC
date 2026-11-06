import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchProperties } from "../../api/properties";
import { fetchServices } from "../../api/services";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { TabScreenHeader } from "../../components/navigation/TabScreenHeader";
import {
  PublishFab,
  PUBLISH_FAB_BOTTOM_INSET,
  usePublishFabScroll,
} from "../../components/PublishFab";
import { PropertyListCard } from "../../components/PropertyListCard";
import { ServiceListCard } from "../../components/ServiceListCard";
import { SearchInput } from "../../components/ui/SearchInput";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useSearchStore } from "../../store/searchStore";
import { colors, radii, spacing, typography } from "../../theme";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { onScroll: onFabScroll } = usePublishFabScroll();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 450);
  const recent = useSearchStore((s) => s.recent);
  const loadRecent = useSearchStore((s) => s.loadRecent);
  const addRecent = useSearchStore((s) => s.addRecent);
  const clearRecent = useSearchStore((s) => s.clearRecent);
  const filters = useSearchStore((s) => s.filters);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.offerType) n += 1;
    if (filters.kind) n += 1;
    if (filters.communeId) n += 1;
    if (filters.minPrice != null || filters.maxPrice != null) n += 1;
    if (filters.bedrooms != null) n += 1;
    if (filters.bathrooms != null) n += 1;
    if (filters.minArea != null) n += 1;
    return n;
  }, [filters]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    if (debouncedQ.trim().length >= 2) {
      void addRecent(debouncedQ);
    }
  }, [debouncedQ, addRecent]);

  const enabled = debouncedQ.trim().length >= 2;

  const propertiesQuery = useQuery({
    queryKey: ["search-properties", debouncedQ, filters],
    enabled,
    queryFn: () =>
      fetchProperties({
        q: debouncedQ,
        offerType: filters.offerType,
        kind: filters.kind,
        communeId: filters.communeId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        minArea: filters.minArea,
        page: 1,
        limit: 8,
      }),
  });

  const servicesQuery = useQuery({
    queryKey: ["search-services", debouncedQ],
    enabled,
    queryFn: () => fetchServices({ q: debouncedQ, page: 1, limit: 8 }),
  });

  const loading = propertiesQuery.isLoading || servicesQuery.isLoading;
  const error = propertiesQuery.isError && servicesQuery.isError;
  const properties = propertiesQuery.data?.data ?? [];
  const services = servicesQuery.data?.data ?? [];
  const empty =
    enabled && !loading && properties.length === 0 && services.length === 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <TabScreenHeader title="Rechercher">
        <SearchInput
          value={q}
          onChangeText={setQ}
          placeholder="Biens, services, quartier…"
          onFilterPress={() => router.push("/filters")}
          activeFilterCount={activeFilterCount}
        />
      </TabScreenHeader>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: PUBLISH_FAB_BOTTOM_INSET },
        ]}
        scrollEventThrottle={16}
        onScroll={(e) => onFabScroll(e.nativeEvent.contentOffset.y)}
        refreshControl={
          <RefreshControl
            refreshing={
              propertiesQuery.isRefetching || servicesQuery.isRefetching
            }
            onRefresh={() => {
              if (!enabled) return;
              void propertiesQuery.refetch();
              void servicesQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {!enabled ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Recherches récentes</Text>
              {recent.length > 0 ? (
                <Pressable onPress={() => void clearRecent()} hitSlop={8}>
                  <Text style={styles.clear}>Effacer</Text>
                </Pressable>
              ) : null}
            </View>

            {recent.length === 0 ? (
              <View style={styles.hintBox}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={colors.textMuted}
                />
                <Text style={styles.hint}>
                  Saisissez au moins 2 caractères pour lancer une recherche.
                </Text>
              </View>
            ) : (
              <View style={styles.recentList}>
                {recent.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.recentItem}
                    onPress={() => setQ(item)}
                  >
                    <View style={styles.recentIcon}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.navy}
                      />
                    </View>
                    <Text style={styles.recentText} numberOfLines={1}>
                      {item}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.panelDivider} />

            <Text style={styles.panelTitle}>Raccourcis</Text>
            <View style={styles.shortcuts}>
              <Pressable
                style={styles.shortcutCard}
                onPress={() =>
                  router.push({
                    pathname: "/properties",
                    params: { kind: "HOUSE" },
                  })
                }
              >
                <View style={styles.shortcutIcon}>
                  <Ionicons name="home-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.shortcutLabel}>Voir les maisons</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              <Pressable
                style={styles.shortcutCard}
                onPress={() => router.push("/services")}
              >
                <View style={styles.shortcutIcon}>
                  <Ionicons
                    name="construct-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.shortcutLabel}>Voir les services</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
        ) : null}

        {enabled && loading ? <ListSkeleton /> : null}
        {enabled && error ? (
          <ErrorState
            onRetry={() => {
              void propertiesQuery.refetch();
              void servicesQuery.refetch();
            }}
          />
        ) : null}
        {empty ? (
          <EmptyState
            title="Aucun résultat"
            message="Essayez un autre mot-clé ou ouvrez les filtres."
          />
        ) : null}

        {properties.length > 0 ? (
          <View>
            <Text style={styles.section}>
              Biens ({propertiesQuery.data?.meta.total})
            </Text>
            {properties.map((item) => (
              <PropertyListCard key={item.id} item={item} />
            ))}
            <Pressable
              style={styles.link}
              onPress={() =>
                router.push({
                  pathname: "/properties",
                  params: { q: debouncedQ },
                })
              }
            >
              <Text style={styles.linkText}>Voir tous les biens</Text>
            </Pressable>
          </View>
        ) : null}

        {services.length > 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.section}>
              Services ({servicesQuery.data?.meta.total})
            </Text>
            {services.map((item) => (
              <ServiceListCard key={item.id} item={item} />
            ))}
            <Pressable
              style={styles.link}
              onPress={() =>
                router.push({
                  pathname: "/services",
                  params: { q: debouncedQ },
                })
              }
            >
              <Text style={styles.linkText}>Voir tous les services</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      <PublishFab />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: spacing.md },
  panel: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    ...typography.section,
    fontSize: 16,
  },
  panelDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  clear: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  hint: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  recentList: { gap: spacing.xs },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  recentText: { flex: 1, color: colors.navy, fontWeight: "600", fontSize: 14 },
  shortcuts: { gap: spacing.sm },
  shortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    flex: 1,
    color: colors.navy,
    fontWeight: "700",
    fontSize: 14,
  },
  section: {
    ...typography.section,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  link: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontWeight: "700" },
});
