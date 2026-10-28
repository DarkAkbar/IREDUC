import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchHome } from "../../api/home";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { ServiceCard } from "../../components/ServiceCard";
import { Button } from "../../components/ui/Button";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { HomeSkeleton } from "../../components/ui/SkeletonLoader";
import { PUBLISH_FAB_SIDE_INSET } from "../../components/PublishFab";
import { colors, radii, spacing, typography } from "../../theme";

export default function AllServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader title="Tous les services" showCity={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? <HomeSkeleton /> : null}

        {isError ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Impossible de charger les services</Text>
            <Text style={styles.stateText}>
              Vérifiez votre connexion et l'URL de l'API (EXPO_PUBLIC_API_URL).
            </Text>
            <Button label="Réessayer" onPress={() => void refetch()} />
          </View>
        ) : null}

        {!isLoading && !isError && data
          ? data.sections.servicesByCategory.map((section) => (
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
                    style={styles.carouselScroll}
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
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  section: { marginTop: spacing.xl },
  carouselScroll: { flexGrow: 0, flexShrink: 0 },
  carousel: {
    flexGrow: 0,
    paddingLeft: spacing.lg,
    paddingRight: PUBLISH_FAB_SIDE_INSET,
    paddingBottom: spacing.sm,
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
