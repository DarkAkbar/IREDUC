import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import {
  completeRequest,
  fetchReceivedRequests,
  reviewRequest,
} from "../../api/requests";
import { RequestListItem } from "../../api/types";
import { EmptyState } from "../../components/list/EmptyState";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { ListSkeleton } from "../../components/ui/SkeletonLoader";
import { colors, radii, spacing, typography } from "../../theme";
import { formatRequestDate } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

export default function ReceivedRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["requests-received"],
    queryFn: () => fetchReceivedRequests({ limit: 50 }),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["requests-received"] });
  }

  function onApprove(item: RequestListItem) {
    Alert.alert("Approuver", `Approuver la demande ${item.number} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Approuver",
        onPress: () => {
          void reviewRequest(item.id, "APPROVED")
            .then(() => refresh())
            .catch((error) =>
              Alert.alert(
                "Erreur",
                getErrorMessage(error, "Approbation impossible.")
              )
            );
        },
      },
    ]);
  }

  function onRejectConfirm() {
    if (!rejectId || reason.trim().length < 3) {
      Alert.alert("Rejet", "Indiquez un motif (3 caractères minimum).");
      return;
    }
    void reviewRequest(rejectId, "REJECTED", reason.trim())
      .then(() => {
        setRejectId(null);
        setReason("");
        return refresh();
      })
      .catch((error) =>
        Alert.alert("Erreur", getErrorMessage(error, "Rejet impossible."))
      );
  }

  function onComplete(item: RequestListItem) {
    Alert.alert("Terminer", "Marquer cette demande comme terminée ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Terminer",
        onPress: () => {
          void completeRequest(item.id)
            .then(() => refresh())
            .catch((error) =>
              Alert.alert(
                "Erreur",
                getErrorMessage(error, "Clôture impossible.")
              )
            );
        },
      },
    ]);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <Text style={[typography.title, styles.title]}>Demandes reçues</Text>
      <Text style={styles.subtitle}>
        Gérez les demandes sur vos biens et services.
      </Text>

      {query.isLoading ? <ListSkeleton /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={query.data?.data ?? []}
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
              title="Aucune demande reçue"
              message="Les demandes concernant vos annonces apparaîtront ici."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.number}>{item.number}</Text>
              <Text style={styles.meta}>
                Demandée le {formatRequestDate(item.createdAt)}
              </Text>
              <Text style={styles.cardTitle}>
                {item.target?.title ?? "Demande"}
              </Text>
              <Text style={styles.status}>Statut : {item.status}</Text>

              {item.status === "PENDING" ? (
                <View style={styles.actions}>
                  <Button
                    label="Approuver"
                    style={styles.btn}
                    onPress={() => onApprove(item)}
                  />
                  <Button
                    label="Rejeter"
                    variant="outline"
                    style={styles.btn}
                    onPress={() => {
                      setRejectId(item.id);
                      setReason("");
                    }}
                  />
                </View>
              ) : null}

              {item.status === "APPROVED" ? (
                <View style={styles.actions}>
                  <Button
                    label="Discuter"
                    variant="outline"
                    style={styles.btn}
                    onPress={() =>
                      router.push({
                        pathname: "/discuss",
                        params: { requestId: item.id },
                      } as never)
                    }
                  />
                  <Button
                    label="Marquer terminée"
                    style={styles.btn}
                    onPress={() => onComplete(item)}
                  />
                </View>
              ) : null}

              {rejectId === item.id ? (
                <View style={styles.rejectBox}>
                  <Text style={styles.rejectLabel}>Motif du rejet</Text>
                  <TextInput
                    style={styles.input}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Expliquez le motif…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                  <View style={styles.actions}>
                    <Button
                      label="Annuler"
                      variant="outline"
                      style={styles.btn}
                      onPress={() => setRejectId(null)}
                    />
                    <Button
                      label="Confirmer le rejet"
                      style={styles.btn}
                      onPress={onRejectConfirm}
                    />
                  </View>
                </View>
              ) : null}
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  number: { color: colors.navy, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 12 },
  cardTitle: { color: colors.navy, fontWeight: "800", fontSize: 15, marginTop: 4 },
  status: { color: colors.textMuted, fontWeight: "600", marginTop: 2 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: { flex: 1, minWidth: "45%" },
  rejectBox: { marginTop: spacing.md, gap: spacing.sm },
  rejectLabel: { color: colors.navy, fontWeight: "700" },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    textAlignVertical: "top",
    color: colors.navy,
  },
});
