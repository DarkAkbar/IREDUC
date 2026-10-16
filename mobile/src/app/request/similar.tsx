import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSimilarRequests } from "../../api/requests";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { PropertyListCard } from "../../components/PropertyListCard";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { colors, spacing, typography } from "../../theme";

export default function SimilarPropertiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["request-similar", id],
    queryFn: () => fetchSimilarRequests(id!),
    enabled: Boolean(id),
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <Text style={[typography.title, styles.title]}>Biens similaires</Text>
      {query.isLoading ? <ListSkeleton /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyListCard item={item} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              title="Aucun bien similaire"
              message="Parcourez le catalogue pour trouver une autre offre."
              actionLabel="Voir les biens"
              onAction={() => router.push("/properties" as never)}
            />
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
});
