import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../../api/client";
import { fetchFavorites } from "../../api/favorites";
import { Favorite } from "../../api/types";
import { FavoriteButton } from "../../components/FavoriteButton";
import { GuestPrompt } from "../../components/GuestPrompt";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { HorizontalChipScroll } from "../../components/ui/HorizontalChipScroll";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useAuthStore } from "../../store/authStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { colors, radii, spacing, typography } from "../../theme";

type FavTab = "PROPERTY" | "SERVICE";

const TABS: { key: FavTab; label: string }[] = [
  { key: "PROPERTY", label: "Biens" },
  { key: "SERVICE", label: "Services" },
];

export default function FavoritesTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useFavoritesStore((s) => s.hydrate);
  const storeItems = useFavoritesStore((s) => s.items);
  const [tab, setTab] = useState<FavTab>("PROPERTY");

  useEffect(() => {
    if (isAuthenticated) {
      void hydrate();
    }
  }, [isAuthenticated, hydrate]);

  const query = useQuery({
    queryKey: ["favorites"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await fetchFavorites();
      return Array.isArray(data) ? data : [];
    },
  });

  const items: Favorite[] =
    query.data && query.data.length > 0 ? query.data : storeItems;

  const filtered = useMemo(
    () => items.filter((item) => item.targetType === tab),
    [items, tab]
  );

  const propertyCount = items.filter((i) => i.targetType === "PROPERTY").length;
  const serviceCount = items.filter((i) => i.targetType === "SERVICE").length;

  if (isHydrated && !isAuthenticated) {
    return (
      <GuestPrompt
        icon="heart-outline"
        title="Retrouvez vos favoris"
        message="Connectez-vous pour retrouver les biens et services que vous aimez."
        returnTo="/(tabs)/favorites"
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={[typography.title, styles.title]}>Favoris</Text>
      <Text style={styles.subtitle}>
        Vos biens et services sauvegardés.
      </Text>

      <HorizontalChipScroll contentContainerStyle={styles.tabsContent}>
        {TABS.map((t) => {
          const count = t.key === "PROPERTY" ? propertyCount : serviceCount;
          const active = tab === t.key;
          const label = count > 0 ? `${t.label} (${count})` : t.label;
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

      {query.isLoading && items.length === 0 ? <ListSkeleton /> : null}
      {query.isError && items.length === 0 ? (
        <ErrorState
          onRetry={() => {
            void query.refetch();
            void hydrate();
          }}
        />
      ) : null}

      {!(query.isLoading && items.length === 0) && !query.isError ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => {
                void query.refetch();
                void hydrate();
              }}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[
            { paddingBottom: spacing.xxl },
            filtered.length === 0 && { flexGrow: 1 },
          ]}
          ListEmptyComponent={
            <EmptyState
              fill
              title={
                tab === "PROPERTY" ? "Aucun bien favori" : "Aucun service favori"
              }
              message="Ajoutez un élément en tapant sur le cœur depuis une fiche."
            />
          }
          renderItem={({ item }) => {
            if (item.targetType === "PROPERTY" && item.property) {
              const cover = item.property.media?.[0];
              const targetId = item.propertyId ?? item.property.id;
              return (
                <Pressable
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: "/property/[id]",
                      params: { id: item.property!.id },
                    } as never)
                  }
                >
                  {cover ? (
                    <Image
                      source={{ uri: mediaUrl(cover.url) ?? undefined }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={[styles.image, styles.placeholder]} />
                  )}
                  <View style={styles.info}>
                    <Text style={styles.badge}>Bien</Text>
                    <Text style={styles.name}>{item.property.title}</Text>
                    <Text style={styles.meta}>
                      {item.property.commune?.name ?? "Kinshasa"}
                    </Text>
                  </View>
                  <FavoriteButton
                    targetType="PROPERTY"
                    targetId={targetId}
                    returnTo="/(tabs)/favorites"
                  />
                </Pressable>
              );
            }
            if (item.targetType === "SERVICE" && item.service) {
              const cover = item.service.media?.[0];
              const targetId = item.serviceId ?? item.service.id;
              return (
                <Pressable
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: "/service/[id]",
                      params: { id: item.service!.id },
                    } as never)
                  }
                >
                  {cover ? (
                    <Image
                      source={{ uri: mediaUrl(cover.url) ?? undefined }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={[styles.image, styles.placeholder]} />
                  )}
                  <View style={styles.info}>
                    <Text style={styles.badge}>Service</Text>
                    <Text style={styles.name}>{item.service.title}</Text>
                    <Text style={styles.meta}>
                      {item.service.category?.name ?? "Service"}
                    </Text>
                  </View>
                  <FavoriteButton
                    targetType="SERVICE"
                    targetId={targetId}
                    returnTo="/(tabs)/favorites"
                  />
                </Pressable>
              );
            }
            return null;
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tabsContent: { marginBottom: spacing.md },
  tab: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: colors.white },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.sm,
  },
  image: { width: 96, height: 96 },
  placeholder: { backgroundColor: colors.skeleton },
  info: { flex: 1, padding: spacing.md, justifyContent: "center", gap: 4 },
  badge: { color: colors.primary, fontWeight: "800", fontSize: 11 },
  name: { color: colors.navy, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 12 },
});
