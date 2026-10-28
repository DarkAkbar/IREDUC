import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchSessions,
  revokeOtherSessions,
  revokeSession,
} from "../../api/users";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  async function onRevoke(id: string, isCurrent: boolean) {
    if (isCurrent) {
      Alert.alert(
        "Session actuelle",
        "Utilisez « Se déconnecter » depuis le profil pour quitter cet appareil."
      );
      return;
    }
    Alert.alert("Déconnecter", "Déconnecter cet appareil ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: async () => {
          try {
            await revokeSession(id);
            await queryClient.invalidateQueries({ queryKey: ["sessions"] });
          } catch (error) {
            Alert.alert(
              "Sessions",
              getErrorMessage(error, "Impossible de déconnecter l'appareil.")
            );
          }
        },
      },
    ]);
  }

  function onRevokeOthers() {
    Alert.alert(
      "Autres appareils",
      "Déconnecter tous les autres appareils ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await revokeOtherSessions();
              Alert.alert("Sessions", result.message);
              await queryClient.invalidateQueries({ queryKey: ["sessions"] });
            } catch (error) {
              Alert.alert(
                "Sessions",
                getErrorMessage(error, "Impossible de déconnecter les appareils.")
              );
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={typography.title}>Mes appareils</Text>
        <Text style={styles.hint}>
          Sessions actives sur vos appareils. La session actuelle est repérée.
        </Text>

        {query.isLoading ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <SkeletonLoader height={72} />
            <SkeletonLoader height={72} />
          </View>
        ) : null}

        {query.isError ? (
          <Text style={styles.error}>
            Impossible de charger les sessions. Tirez pour actualiser.
          </Text>
        ) : null}

        <View style={styles.list}>
          {(query.data ?? []).map((session) => (
            <View key={session.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.device}>
                  {session.deviceName}
                  {session.isCurrent ? " · Cet appareil" : ""}
                </Text>
                <Text style={styles.meta}>
                  Dernière activité : {formatDate(session.lastUsedAt)}
                </Text>
              </View>
              {!session.isCurrent ? (
                <Pressable onPress={() => void onRevoke(session.id, false)}>
                  <Text style={styles.revoke}>Déconnecter</Text>
                </Pressable>
              ) : (
                <View style={styles.currentPill}>
                  <Text style={styles.currentText}>Actuelle</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {(query.data?.length ?? 0) > 1 ? (
          <Button
            label="Déconnecter tous les autres appareils"
            variant="outline"
            onPress={onRevokeOthers}
            style={{ marginTop: spacing.xl }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
  hint: { ...typography.body, marginTop: spacing.sm },
  error: { color: colors.primary, marginTop: spacing.md, fontWeight: "600" },
  list: { marginTop: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  device: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  revoke: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  currentPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  currentText: { color: "#166534", fontWeight: "700", fontSize: 11 },
});
