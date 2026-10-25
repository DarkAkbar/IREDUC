import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../../api/client";
import { fetchConversations } from "../../api/conversations";
import { fetchHome } from "../../api/home";
import { fetchNotifications } from "../../api/notifications";
import { IreducLogo } from "../../components/IreducLogo";
import { PartnerHomeBanner } from "../../components/PartnerHomeBanner";
import { PropertyCard } from "../../components/PropertyCard";
import {
  PublishFab,
  PUBLISH_FAB_BOTTOM_INSET,
  PUBLISH_FAB_SIDE_INSET,
  usePublishFabScroll,
} from "../../components/PublishFab";
import { ServiceCard } from "../../components/ServiceCard";
import { Button } from "../../components/ui/Button";
import { SearchBar } from "../../components/ui/SearchBar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { HomeSkeleton } from "../../components/ui/SkeletonLoader";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";

/** Logo local de secours si aucune photo de bien n'est disponible. */
const HERO_FALLBACK = require("../../../assets/icon.png");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const { onScroll: onFabScroll } = usePublishFabScroll();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
  });

  const notifQuery = useQuery({
    queryKey: ["notifications", "badge"],
    enabled: isAuthenticated,
    queryFn: () => fetchNotifications({ page: 1, limit: 1 }),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
  const unreadNotifs = notifQuery.data?.unreadCount ?? 0;

  const conversationsQuery = useQuery({
    queryKey: ["conversations", "badge"],
    enabled: isAuthenticated,
    queryFn: fetchConversations,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
  const unreadMessages =
    conversationsQuery.data?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ??
    0;

  const properties =
    data?.sections.featuredProperties.items?.length
      ? data.sections.featuredProperties.items
      : data?.sections.housesForRent.items ?? [];

  const heroUri = mediaUrl(properties[0]?.coverPhoto?.url);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: PUBLISH_FAB_BOTTOM_INSET },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => onFabScroll(e.nativeEvent.contentOffset.y)}
      >
        <View style={styles.header}>
          <IreducLogo tagline="Trouvez. Comparez. Réalisez." compact />
          <View style={styles.headerRight}>
            <Pressable style={styles.cityPill}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.cityText}>Kinshasa</Text>
              <Ionicons name="chevron-down" size={14} color={colors.navy} />
            </Pressable>
            <Pressable
              style={styles.bell}
              onPress={() => {
                if (requireAuth("/messages")) {
                  router.push("/messages" as never);
                }
              }}
              accessibilityLabel="Messages"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color={colors.navy}
              />
              {unreadMessages > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              style={styles.bell}
              onPress={() => {
                if (requireAuth("/notifications")) {
                  router.push("/notifications" as never);
                }
              }}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={colors.navy} />
              {unreadNotifs > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifs > 99 ? "99+" : unreadNotifs}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {isLoading ? <HomeSkeleton /> : null}

        {isError ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Impossible de charger l'accueil</Text>
            <Text style={styles.stateText}>
              Vérifiez votre connexion et l'URL de l'API (EXPO_PUBLIC_API_URL).
            </Text>
            <Button label="Réessayer" onPress={() => void refetch()} />
          </View>
        ) : null}

        {!isLoading && !isError && data ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroImageWrap}>
                {heroUri ? (
                  <Image
                    source={{ uri: heroUri }}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Image
                    source={HERO_FALLBACK}
                    style={styles.heroImage}
                    contentFit="cover"
                  />
                )}
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTitle}>
                    Un chez-vous,{"\n"}une vie meilleure.
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    Immobilier et services pour concrétiser tous vos projets.
                  </Text>
                </View>
              </View>
              <View style={styles.searchWrap}>
                <SearchBar
                  onPress={() => router.push("/(tabs)/search")}
                  onFilterPress={() => router.push("/filters")}
                />
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Maison"
                subtitle="Appartements, villas, terrains et plus encore"
                icon="home"
                onSeeAll={() =>
                  router.push({
                    pathname: "/properties",
                    params: { kind: "HOUSE", offerType: "RENT" },
                  })
                }
              />
              {properties.length === 0 ? (
                <Text style={styles.empty}>Aucun bien à afficher pour le moment.</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                >
                  {properties.map((item, index) => (
                    <PropertyCard
                      key={item.id}
                      item={item}
                      featured={item.isFeatured || index === 0}
                      onPress={() =>
                        router.push({
                          pathname: "/property/[id]",
                          params: { id: item.id },
                        })
                      }
                    />
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.trust}>
              <View style={styles.trustItem}>
                <Ionicons name="people-outline" size={22} color={colors.navy} />
                <Text style={styles.trustNumber}>
                  + {data.counters.activeUsers.toLocaleString("fr-FR")}
                </Text>
                <Text style={styles.trustLabel}>utilisateurs actifs</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.navy} />
                <Text style={styles.trustNumber}>
                  {data.counters.verifiedProperties.toLocaleString("fr-FR")}
                </Text>
                <Text style={styles.trustLabel}>biens vérifiés</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.navy} />
                <Text style={styles.trustLabel}>Un accompagnement{"\n"}de A à Z</Text>
              </View>
            </View>

            {data.sections.servicesByCategory.map((section) => (
              <View key={section.category.id} style={styles.section}>
                <SectionHeader
                  title={section.title}
                  subtitle="Prestataires vérifiés à Kinshasa"
                  icon="construct-outline"
                  onSeeAll={() =>
                    router.push({
                      pathname: "/services",
                      params: {
                        categoryId: section.category.id,
                        categorySlug: section.category.slug,
                      },
                    })
                  }
                />
                {section.items.length === 0 ? (
                  <Text style={styles.empty}>Aucun service dans cette catégorie.</Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carousel}
                  >
                    {section.items.map((item) => (
                      <ServiceCard
                        key={item.id}
                        item={item}
                        onPress={() =>
                          router.push({
                            pathname: "/service/[id]",
                            params: { id: item.id },
                          })
                        }
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}

            <PartnerHomeBanner />
          </>
        ) : null}
      </ScrollView>
      <PublishFab />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  bell: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: colors.white, fontSize: 9, fontWeight: "800" },
  hero: { marginBottom: spacing.xl },
  heroImageWrap: {
    width: "100%",
    height: 220,
    backgroundColor: colors.navy,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroSubtitle: {
    color: colors.white,
    marginTop: spacing.sm,
    fontSize: 14,
    opacity: 0.95,
    maxWidth: "85%",
  },
  searchWrap: {
    marginTop: -28,
    paddingHorizontal: spacing.lg,
  },
  section: { marginTop: spacing.xl },
  carousel: {
    paddingLeft: spacing.lg,
    paddingRight: PUBLISH_FAB_SIDE_INSET,
    paddingBottom: spacing.sm,
  },
  trust: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  trustItem: { flex: 1, alignItems: "center", gap: 4 },
  trustNumber: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  trustLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  stateBox: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    gap: spacing.md,
  },
  stateTitle: { ...typography.section },
  stateText: { ...typography.body },
  empty: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
  },
});
