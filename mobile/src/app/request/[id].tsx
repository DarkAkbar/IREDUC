import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchRequest } from "../../api/requests";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { RequestCard } from "../../components/requests/RequestCard";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { colors, radii, spacing, typography } from "../../theme";
import { formatDateFr } from "../../utils/dates";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: ["request", id],
    queryFn: () => fetchRequest(id!),
    enabled: Boolean(id),
  });

  const request = query.data;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ListScreenHeader showBack />
      <Text style={[typography.title, styles.title]}>Détail de la demande</Text>

      {query.isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonLoader height={180} borderRadius={radii.lg} />
          <SkeletonLoader height={120} />
        </View>
      ) : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {request ? (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <RequestCard
            item={request}
            rejectionReason={request.rejectionReason}
          />
          <View style={styles.details}>
            <Text style={styles.section}>Informations</Text>
            <Row label="Nom" value={request.fullName} />
            <Row label="Téléphone" value={request.phone} />
            <Row label="E-mail" value={request.email} />
            {request.whatsapp ? <Row label="WhatsApp" value={request.whatsapp} /> : null}
            <Row label="Date souhaitée" value={formatDateFr(request.desiredDate)} />
            {request.durationMonths ? (
              <Row label="Durée" value={`${request.durationMonths} mois`} />
            ) : null}
            {request.occupants ? (
              <Row label="Occupants" value={String(request.occupants)} />
            ) : null}
            <Row
              label="Visite / intervention"
              value={
                request.visitDate
                  ? `${formatDateFr(request.visitDate)} à ${request.visitSlot ?? "—"}`
                  : "—"
              }
            />
            <Row
              label="Mode"
              value={
                request.visitMode === "PHYSICAL"
                  ? "Physique"
                  : request.visitMode === "VIRTUAL"
                    ? "Virtuel"
                    : "—"
              }
            />
            {request.message ? <Row label="Message" value={request.message} /> : null}
            {request.rejectionReason ? (
              <Row label="Motif" value={request.rejectionReason} />
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  details: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  section: { color: colors.navy, fontWeight: "800", fontSize: 16, marginBottom: 4 },
  row: { gap: 2 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  value: { color: colors.navy, fontWeight: "700" },
});
