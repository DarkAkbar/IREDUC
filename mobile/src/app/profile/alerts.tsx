import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteAlert, fetchAlerts, updateAlert } from "../../api/alerts";
import { AlertItem } from "../../api/types";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

function criteriaLabel(item: AlertItem) {
  const parts: string[] = [];
  if (item.criteria.offerType === "RENT") parts.push("Location");
  if (item.criteria.offerType === "SALE") parts.push("Achat");
  if (item.criteria.minPrice != null || item.criteria.maxPrice != null) {
    parts.push(
      `Budget ${item.criteria.minPrice ?? 0} – ${item.criteria.maxPrice ?? "∞"} USD`
    );
  }
  if (item.criteria.bedrooms != null) {
    parts.push(`${item.criteria.bedrooms}+ ch.`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Critères personnalisés";
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
  });

  async function toggle(item: AlertItem, isActive: boolean) {
    try {
      await updateAlert(item.id, { isActive });
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    } catch (error) {
      Alert.alert(
        "Alerte",
        getErrorMessage(error, "Impossible de mettre à jour l'alerte.")
      );
    }
  }

  function onDelete(item: AlertItem) {
    Alert.alert("Supprimer l'alerte", "Confirmez-vous la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          void deleteAlert(item.id)
            .then(() =>
              queryClient.invalidateQueries({ queryKey: ["alerts"] })
            )
            .catch((error) =>
              Alert.alert(
                "Alerte",
                getErrorMessage(error, "Suppression impossible.")
              )
            );
        },
      },
    ]);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <Text style={[typography.title, styles.title]}>Mes alertes</Text>
      <Text style={styles.subtitle}>
        Activez ou supprimez vos alertes de recherche.
      </Text>

      {query.isLoading ? <ListSkeleton /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Aucune alerte"
              message="Créez une alerte depuis une fiche pour être notifié des nouvelles offres."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{criteriaLabel(item)}</Text>
                <Text style={styles.meta}>
                  {item.isActive ? "Active" : "Désactivée"}
                </Text>
              </View>
              <Switch
                value={item.isActive}
                onValueChange={(v) => void toggle(item, v)}
                trackColor={{ true: colors.navy, false: colors.border }}
              />
              <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { paddingHorizontal: spacing.lg },
  subtitle: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
