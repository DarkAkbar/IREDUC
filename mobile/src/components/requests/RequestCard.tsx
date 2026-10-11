import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { mediaUrl } from "../../api/client";
import {
  cancelRequest,
  fetchRequest,
  fetchSimilarRequests,
  payRequest,
} from "../../api/requests";
import { createReview } from "../../api/reviews";
import { RequestListItem } from "../../api/types";
import { colors, radii, spacing } from "../../theme";
import { formatRequestDate } from "../../utils/dates";
import { formatPrice, kindLabel } from "../../utils/format";
import { Button } from "../ui/Button";

type Props = {
  item: RequestListItem;
  rejectionReason?: string | null;
};

function statusMeta(item: RequestListItem) {
  if (item.paymentStatus === "PAID") {
    return {
      label: "Payée",
      color: "#0B6E4F",
      bg: "#E8F7F0",
      icon: "card-outline" as const,
      banner: "Paiement simulé enregistré. Vous pouvez discuter avec le propriétaire.",
    };
  }
  switch (item.status) {
    case "APPROVED":
      return {
        label: "Approuvée",
        color: "#0B6E4F",
        bg: "#E8F7F0",
        icon: "checkmark-circle" as const,
        banner:
          "Votre demande a été approuvée. Discutez ou procédez au paiement simulé.",
      };
    case "PENDING":
      return {
        label: "En attente",
        color: "#D97706",
        bg: "#FFF1E0",
        icon: "time-outline" as const,
        banner: "Votre demande attend une réponse du propriétaire ou prestataire.",
      };
    case "REJECTED":
      return {
        label: "Rejetée",
        color: colors.primary,
        bg: "#FDECEC",
        icon: "close-circle" as const,
        banner: "Votre demande a été rejetée.",
      };
    case "COMPLETED":
      return {
        label: "Terminée",
        color: colors.navy,
        bg: "#E8EEF9",
        icon: "flag-outline" as const,
        banner: "Cette demande est terminée. Vous pouvez laisser un avis.",
      };
    case "CANCELLED":
      return {
        label: "Annulée",
        color: colors.textMuted,
        bg: "#EEF1F6",
        icon: "ban-outline" as const,
        banner: "Vous avez annulé cette demande.",
      };
    default:
      return {
        label: item.status,
        color: colors.navy,
        bg: "#E8EEF9",
        icon: "information-circle-outline" as const,
        banner: "",
      };
  }
}

function typeBadge(item: RequestListItem) {
  if (item.targetType === "SERVICE") return { label: "Service", color: colors.navy };
  if (item.target?.kind === "LAND") return { label: "Terrain", color: "#7C3AED" };
  if (item.target?.offerType === "SALE") return { label: "À vendre", color: "#0B6E4F" };
  if (item.target?.offerType === "RENT") return { label: "À louer", color: colors.primary };
  return { label: kindLabel(String(item.target?.kind ?? "Bien")), color: colors.navy };
}

export function RequestCard({ item, rejectionReason }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = statusMeta(item);
  const badge = typeBadge(item);
  const photo = item.target?.photo;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["my-requests"] });
  }

  function onCancel() {
    Alert.alert(
      "Annuler la demande",
      "Confirmez-vous l'annulation de cette demande ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            void cancelRequest(item.id)
              .then(refresh)
              .catch((error) =>
                Alert.alert(
                  "Erreur",
                  typeof error?.response?.data?.message === "string"
                    ? error.response.data.message
                    : "Annulation impossible."
                )
              );
          },
        },
      ]
    );
  }

  function onPay() {
    Alert.alert(
      "Paiement simulé",
      "Confirmer le paiement simulé pour cette demande ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Payer",
          onPress: () => {
            void payRequest(item.id)
              .then(async () => {
                await refresh();
                Alert.alert("Paiement simulé", "Le paiement a été enregistré.");
              })
              .catch((error) =>
                Alert.alert(
                  "Erreur",
                  typeof error?.response?.data?.message === "string"
                    ? error.response.data.message
                    : "Paiement impossible."
                )
              );
          },
        },
      ]
    );
  }

  function onReview() {
    setRating(5);
    setComment("");
    setReviewOpen(true);
  }

  async function submitReview() {
    setReviewLoading(true);
    try {
      await createReview({
        requestId: item.id,
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewOpen(false);
      Alert.alert("Merci", "Votre avis a été enregistré.");
      await refresh();
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (error as { response: { data: { message: string } } }).response.data
              .message
          : "Impossible d'envoyer l'avis.";
      Alert.alert("Erreur", message);
    } finally {
      setReviewLoading(false);
    }
  }

  function onSeeReason() {
    const known = rejectionReason ?? item.rejectionReason;
    if (known) {
      Alert.alert("Motif du rejet", known);
      return;
    }
    void fetchRequest(item.id)
      .then((detail) =>
        Alert.alert(
          "Motif du rejet",
          detail.rejectionReason ||
            "Motif : cette offre n'est plus disponible ou ne correspond pas aux critères."
        )
      )
      .catch(() =>
        Alert.alert(
          "Motif du rejet",
          "Motif : cette offre n'est plus disponible ou ne correspond pas aux critères."
        )
      );
  }

  async function onSimilar() {
    try {
      const similar = await fetchSimilarRequests(item.id);
      if (similar.length === 0) {
        Alert.alert("Biens similaires", "Aucun bien similaire pour le moment.");
        router.push("/properties" as never);
        return;
      }
      router.push({
        pathname: "/request/similar",
        params: { id: item.id },
      } as never);
    } catch {
      router.push("/properties" as never);
    }
  }

  const priceLabel =
    item.target?.price != null
      ? formatPrice(
          item.target.price,
          item.target.offerType === "SALE" ? "SALE" : "RENT"
        ).replace(" $", " USD")
      : null;

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({ pathname: "/request/[id]", params: { id: item.id } } as never)
      }
    >
      <View style={styles.top}>
        <View style={styles.imageWrap}>
          {photo ? (
            <Image
              source={{ uri: mediaUrl(photo) ?? undefined }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
          <View style={[styles.typeBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.typeBadgeText}>{badge.label}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <View style={styles.idRow}>
            <Text style={styles.number}>{item.number}</Text>
            <Text style={styles.date}>
              Demandée le {formatRequestDate(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.target?.title ?? "Demande"}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.target?.location ?? "Kinshasa"}
          </Text>
          {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
          {item.target?.type === "PROPERTY" ? (
            <Text style={styles.specs}>
              {[
                item.target.bedrooms != null ? `${item.target.bedrooms} ch.` : null,
                item.target.bathrooms != null ? `${item.target.bathrooms} sdb` : null,
                item.target.areaM2 != null
                  ? `${Math.round(item.target.areaM2)} m²`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : (
            <Text style={styles.specs}>{item.target?.category}</Text>
          )}
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      {status.banner ? (
        <View style={[styles.banner, { backgroundColor: status.bg }]}>
          <Ionicons name="information-circle" size={16} color={status.color} />
          <Text style={[styles.bannerText, { color: status.color }]}>
            {status.banner}
            {item.status === "REJECTED" && (rejectionReason ?? item.rejectionReason)
              ? ` Motif : ${rejectionReason ?? item.rejectionReason}`
              : ""}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {item.status === "APPROVED" && item.paymentStatus !== "PAID" ? (
          <>
            <Button
              label="Discuter"
              variant="outline"
              style={styles.actionBtn}
              onPress={() =>
                router.push({
                  pathname: "/discuss",
                  params: { type: item.targetType, id: item.target?.id, title: item.target?.title },
                } as never)
              }
            />
            <Button label="Payer" style={styles.actionBtn} onPress={onPay} />
          </>
        ) : null}
        {item.status === "APPROVED" && item.paymentStatus === "PAID" ? (
          <Button
            label="Discuter"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: "/discuss",
                params: { type: item.targetType, id: item.target?.id, title: item.target?.title },
              } as never)
            }
          />
        ) : null}
        {item.status === "PENDING" ? (
          <Button label="Annuler la demande" variant="outline" onPress={onCancel} />
        ) : null}
        {item.status === "REJECTED" ? (
          <>
            <Button
              label="Voir le motif"
              variant="outline"
              style={styles.actionBtn}
              onPress={onSeeReason}
            />
            {item.targetType === "PROPERTY" ? (
              <Button
                label="Voir des biens similaires"
                variant="outline"
                style={styles.actionBtn}
                onPress={() => void onSimilar()}
              />
            ) : null}
          </>
        ) : null}
        {item.status === "COMPLETED" ? (
          <Button label="Laisser un avis" onPress={onReview} />
        ) : null}
      </View>

      <Modal visible={reviewOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Laisser un avis</Text>
            <Text style={styles.modalHint}>Note de 1 à 5</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                  <Ionicons
                    name={n <= rating ? "star" : "star-outline"}
                    size={28}
                    color="#F2C94C"
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.comment}
              value={comment}
              onChangeText={setComment}
              placeholder="Commentaire (facultatif)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <Button
                label="Annuler"
                variant="outline"
                style={styles.actionBtn}
                onPress={() => setReviewOpen(false)}
              />
              <Button
                label="Envoyer"
                style={styles.actionBtn}
                loading={reviewLoading}
                onPress={() => void submitReview()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  top: { flexDirection: "row", gap: spacing.md, padding: spacing.md },
  imageWrap: { width: 96, height: 110, borderRadius: radii.md, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: colors.skeleton },
  typeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  info: { flex: 1, gap: 2 },
  idRow: { gap: 2 },
  number: { color: colors.navy, fontWeight: "800", fontSize: 12 },
  date: { color: colors.textMuted, fontSize: 11 },
  title: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12 },
  price: { color: colors.primary, fontWeight: "800" },
  specs: { color: colors.textMuted, fontSize: 12 },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  statusText: { fontWeight: "800", fontSize: 12 },
  banner: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "flex-start",
  },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  actionBtn: { flex: 1, minWidth: "45%" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { color: colors.navy, fontWeight: "800", fontSize: 18 },
  modalHint: { color: colors.textMuted, fontSize: 13 },
  stars: { flexDirection: "row", gap: spacing.sm },
  comment: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    textAlignVertical: "top",
    color: colors.navy,
  },
  modalActions: { flexDirection: "row", gap: spacing.sm },
});
