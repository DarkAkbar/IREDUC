import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { pushPath } from "../../utils/navigation";
import { useEffect, useState } from "react";
import {
  Pressable,
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
import { PropertyListCard } from "../../components/PropertyListCard";
import { ServiceListCard } from "../../components/ServiceListCard";
import { SearchInput } from "../../components/ui/SearchInput";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useSearchStore } from "../../store/searchStore";
import { colors, spacing, typography } from "../../theme";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 450);
  const recent = useSearchStore((s) => s.recent);
  const loadRecent = useSearchStore((s) => s.loadRecent);
  const addRecent = useSearchStore((s) => s.addRecent);
  const clearRecent = useSearchStore((s) => s.clearRecent);
  const filters = useSearchStore((s) => s.filters);

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
  const empty = enabled && !loading && properties.length === 0 && services.length === 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <Text style={[typography.title, styles.title]}>Rechercher</Text>
      <SearchInput
        value={q}
        onChangeText={setQ}
        placeholder="Biens, services, quartier..."
        onFilterPress={() => router.push("/filters")}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {!enabled ? (
          <View style={styles.recentBox}>
            <View style={styles.recentHeader}>
              <Text style={styles.section}>Recherches récentes</Text>
              {recent.length > 0 ? (
                <Pressable onPress={() => void clearRecent()}>
                  <Text style={styles.clear}>Effacer</Text>
                </Pressable>
              ) : null}
            </View>
            {recent.length === 0 ? (
              <Text style={styles.hint}>
                Saisissez au moins 2 caractères pour lancer une recherche.
              </Text>
            ) : (
              recent.map((item) => (
                <Pressable key={item} style={styles.recentItem} onPress={() => setQ(item)}>
                  <Text style={styles.recentText}>{item}</Text>
                </Pressable>
              ))
            )}

            <Text style={[styles.section, { marginTop: spacing.xl }]}>Raccourcis</Text>
            <Pressable
              style={styles.link}
              onPress={() => router.push({ pathname: "/properties", params: { kind: "HOUSE" } })}
            >
              <Text style={styles.linkText}>Voir les maisons</Text>
            </Pressable>
            <Pressable
              style={styles.link}
              onPress={() => router.push("/services")}
            >
              <Text style={styles.linkText}>Voir les services</Text>
            </Pressable>
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
            <Text style={styles.section}>Biens ({propertiesQuery.data?.meta.total})</Text>
            {properties.map((item) => (
              <PropertyListCard key={item.id} item={item} />
            ))}
            <Pressable
              style={styles.link}
              onPress={() =>
                router.push({ pathname: "/properties", params: { q: debouncedQ } })
              }
            >
              <Text style={styles.linkText}>Voir tous les biens</Text>
            </Pressable>
          </View>
        ) : null}

        {services.length > 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.section}>Services ({servicesQuery.data?.meta.total})</Text>
            {services.map((item) => (
              <ServiceListCard key={item.id} item={item} />
            ))}
            <Pressable
              style={styles.link}
              onPress={() =>
                router.push({ pathname: "/services", params: { q: debouncedQ } })
              }
            >
              <Text style={styles.linkText}>Voir tous les services</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  content: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
  recentBox: { paddingHorizontal: spacing.lg },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    ...typography.section,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  clear: { color: colors.primary, fontWeight: "700" },
  hint: { color: colors.textMuted },
  recentItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentText: { color: colors.navy, fontWeight: "600" },
  link: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontWeight: "700" },
});
