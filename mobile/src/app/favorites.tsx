import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../api/client";
import { fetchFavorites } from "../api/favorites";
import { Favorite } from "../api/types";
import { EmptyState } from "../components/list/EmptyState";
import { ErrorState } from "../components/list/ErrorState";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { ListSkeleton } from "../components/ui/SkeletonLoader";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useFavoritesStore } from "../store/favoritesStore";
import { colors, radii, spacing, typography } from "../theme";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const hydrate = useFavoritesStore((s) => s.hydrate);
  const storeItems = useFavoritesStore((s) => s.items);

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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <Text style={[typography.title, styles.title]}>Favoris</Text>

      {!isAuthenticated ? (
        <EmptyState
          title="Connexion requise"
          message="Connectez-vous pour voir vos favoris."
          actionLabel="Se connecter"
          onAction={() => {
            requireAuth("/favorites");
          }}
        />
      ) : null}

      {isAuthenticated && query.isLoading && items.length === 0 ? (
        <ListSkeleton />
      ) : null}
      {isAuthenticated && query.isError && items.length === 0 ? (
        <ErrorState
          onRetry={() => {
            void query.refetch();
            void hydrate();
          }}
        />
      ) : null}

      {isAuthenticated && !(query.isLoading && items.length === 0) ? (
        <FlatList
          data={items}
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
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              title="Aucun favori"
              message="Ajoutez un bien ou un service en tapant sur le cœur."
            />
          }
          renderItem={({ item }) => {
            if (item.targetType === "PROPERTY" && item.property) {
              const cover = item.property.media?.[0];
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
                </Pressable>
              );
            }
            if (item.targetType === "SERVICE" && item.service) {
              const cover = item.service.media?.[0];
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
  title: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: 96, height: 96 },
  placeholder: { backgroundColor: colors.skeleton },
  info: { flex: 1, padding: spacing.md, justifyContent: "center", gap: 4 },
  badge: { color: colors.primary, fontWeight: "800", fontSize: 11 },
  name: { color: colors.navy, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 12 },
});
