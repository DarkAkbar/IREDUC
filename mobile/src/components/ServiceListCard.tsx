import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { pushPath } from "../utils/navigation";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mediaUrl } from "../api/client";
import { ServiceListItem } from "../api/types";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { colors, radii, spacing } from "../theme";
import { MediaCarousel } from "./MediaCarousel";
import { Chip } from "./ui/Chip";

type Props = {
  item: ServiceListItem;
};

const HIGHLIGHTS = [
  { icon: "people-outline" as const, label: "Équipe qualifiée" },
  { icon: "shield-checkmark-outline" as const, label: "Assurance incluse" },
  { icon: "time-outline" as const, label: "Disponible 7j/7" },
];

export function ServiceListCard({ item }: Props) {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const photos =
    item.photos && item.photos.length > 0
      ? item.photos
      : item.coverPhoto
        ? [item.coverPhoto]
        : [];
  const logo = mediaUrl(item.provider.logoUrl);
  const city = item.coverageCommunes[0]?.name ?? "Kinshasa";

  function openDetail() {
    router.push({ pathname: "/service/[id]", params: { id: item.id } });
  }

  function onReserve() {
    if (!requireAuth(`/service/${item.id}`)) return;
    router.push({
      pathname: "/reserve",
      params: { type: "SERVICE", id: item.id, title: item.title },
    });
  }

  return (
    <View style={styles.card}>
      <MediaCarousel photos={photos} onPress={openDetail} />

      <View style={styles.body}>
        <View style={styles.providerRow}>
          <Pressable style={styles.providerLeft} onPress={openDetail}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Ionicons name="business-outline" size={18} color={colors.navy} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.provider.displayName}
                </Text>
                {item.provider.verified ? (
                  <Ionicons name="checkmark-circle" size={16} color="#2F80ED" />
                ) : null}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F2C94C" />
                <Text style={styles.rating}>
                  {item.averageRating?.toFixed(1) ?? "—"} ({item.reviewsCount} avis)
                </Text>
              </View>
            </View>
          </Pressable>
          <Pressable style={styles.reserve} onPress={onReserve}>
            <Ionicons name="calendar-outline" size={14} color={colors.white} />
            <Text style={styles.reserveText}>RÉSERVER</Text>
          </Pressable>
        </View>

        <View style={styles.highlights}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.label} style={styles.highlight}>
              <Ionicons name={h.icon} size={14} color={colors.navy} />
              <Text style={styles.highlightText}>{h.label}</Text>
            </View>
          ))}
          <View style={styles.highlight}>
            <Ionicons name="location-outline" size={14} color={colors.navy} />
            <Text style={styles.highlightText}>{city}</Text>
          </View>
        </View>

        {item.subServices && item.subServices.length > 0 ? (
          <View style={styles.tags}>
            {item.subServices.slice(0, 4).map((tag) => (
              <Chip key={tag} label={tag} tone="muted" />
            ))}
          </View>
        ) : (
          <Text style={styles.titleHint} numberOfLines={1}>
            {item.title}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
    paddingBottom: spacing.md,
  },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  providerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  providerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logo: { width: 44, height: 44, borderRadius: 22 },
  logoFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { color: colors.navy, fontWeight: "800", fontSize: 15, flexShrink: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  rating: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  reserve: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  reserveText: { color: colors.white, fontWeight: "800", fontSize: 11 },
  highlights: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  highlight: { width: "45%", flexDirection: "row", alignItems: "center", gap: 6 },
  highlightText: { color: colors.navy, fontSize: 12, fontWeight: "600" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  titleHint: { color: colors.textMuted, fontSize: 13 },
});
