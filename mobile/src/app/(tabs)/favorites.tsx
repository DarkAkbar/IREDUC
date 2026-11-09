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
import { mediaUrl } from "../../api/client";
import { fetchFavorites } from "../../api/favorites";
import { Favorite } from "../../api/types";
import { FavoriteButton } from "../../components/FavoriteButton";
import { GuestPrompt } from "../../components/GuestPrompt";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import {
  ScreenLayout,
  screenBodyContentStyle,
} from "../../components/navigation/ScreenLayout";
import { TabScreenHeader } from "../../components/navigation/TabScreenHeader";
import { HorizontalChipScroll } from "../../components/ui/HorizontalChipScroll";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { useAuthStore } from "../../store/authStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { colors, radii, spacing } from "../../theme";

type FavTab = "PROPERTY" | "SERVICE";

const TABS: { key: FavTab; label: string }[] = [
  { key: "PROPERTY", label: "Biens" },
  { key: "SERVICE", label: "Services" },
];

export default function FavoritesTabScreen() {
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

  const header = <TabScreenHeader title="Favoris" />;

  const tabs = (
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
  );

  if (query.isLoading && items.length === 0) {
    return (
      <ScreenLayout header={header}>
        <View style={[screenBodyContentStyle, styles.bodyFill]}>
          {tabs}
          <ListSkeleton />
        </View>
      </ScreenLayout>
    );
  }

  if (query.isError && items.length === 0) {
    return (
      <ScreenLayout header={header}>
        <View style={[screenBodyContentStyle, styles.bodyFill]}>
          {tabs}
          <ErrorState
            onRetry={() => {
              void query.refetch();
              void hydrate();
            }}
          />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout header={header}>
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
        ListHeaderComponent={tabs}
        contentContainerStyle={[
          screenBodyContentStyle,
          styles.listBottom,
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
                <View style={styles.imageWrap}>
                  {cover ? (
                    <Image
                      source={{ uri: mediaUrl(cover.url) ?? undefined }}
                      style={styles.image}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.image, styles.placeholder]} />
                  )}
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>Bien</Text>
                  </View>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.property.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
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
                <View style={styles.imageWrap}>
                  {cover ? (
                    <Image
                      source={{ uri: mediaUrl(cover.url) ?? undefined }}
                      style={styles.image}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.image, styles.placeholder]} />
                  )}
                  <View style={[styles.typeBadge, styles.typeBadgeService]}>
                    <Text style={styles.typeBadgeText}>Service</Text>
                  </View>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.service.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
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
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  bodyFill: { flex: 1 },
  listBottom: { paddingBottom: spacing.xxl },
  tabsContent: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 12,
  },
  tab: {
    paddingHorizontal: spacing.md,
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
    marginBottom: 12,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  imageWrap: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.skeleton,
  },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: colors.skeleton },
  typeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeService: {
    backgroundColor: colors.navy,
  },
  typeBadgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  info: { flex: 1, minWidth: 0, justifyContent: "center", gap: 6 },
  name: { color: colors.navy, fontWeight: "800", fontSize: 16, lineHeight: 20 },
  meta: { color: colors.textMuted, fontSize: 13 },
});
