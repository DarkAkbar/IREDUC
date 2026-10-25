import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { pushPath } from "../utils/navigation";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PropertyListItem } from "../api/types";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { colors, radii, spacing, typography } from "../theme";
import { formatPrice, offerBadge, propertyLocation } from "../utils/format";
import { FavoriteButton } from "./FavoriteButton";
import { MediaCarousel } from "./MediaCarousel";
import { Badge } from "./ui/Badge";
import { Chip } from "./ui/Chip";

type Props = {
  item: PropertyListItem;
};

export function PropertyListCard({ item }: Props) {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const photos =
    item.photos && item.photos.length > 0
      ? item.photos
      : item.coverPhoto
        ? [item.coverPhoto]
        : [];

  function openDetail() {
    router.push({ pathname: "/property/[id]", params: { id: item.id } });
  }

  function onReserve() {
    const returnTo = `/reserve?type=PROPERTY&id=${item.id}`;
    if (!requireAuth(returnTo)) return;
    router.push({
      pathname: "/reserve",
      params: { type: "PROPERTY", id: item.id, title: item.title },
    });
  }

  return (
    <View style={styles.card}>
      <MediaCarousel
        photos={photos}
        onPress={openDetail}
        topRight={
          <View style={styles.fav}>
            <FavoriteButton
              targetType="PROPERTY"
              targetId={item.id}
              returnTo={`/properties?kind=${item.kind}`}
            />
          </View>
        }
      />

      <Pressable onPress={openDetail} style={styles.body}>
        <View style={styles.topRow}>
          <Badge label={offerBadge(item.offerType)} />
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View style={styles.locRow}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text style={styles.loc}>{propertyLocation(item)}</Text>
        </View>
        <Text style={typography.price}>{formatPrice(item.price, item.offerType)}</Text>

        <View style={styles.meta}>
          {item.bedrooms != null ? (
            <Meta icon="bed-outline" label={`${item.bedrooms} ch.`} />
          ) : null}
          {item.bathrooms != null ? (
            <Meta icon="water-outline" label={`${item.bathrooms} sdb`} />
          ) : null}
          {item.areaM2 != null ? (
            <Meta icon="resize-outline" label={`${Math.round(item.areaM2)} m²`} />
          ) : null}
          {item.parking ? <Meta icon="car-outline" label="Parking" /> : null}
          {item.hasPool ? <Meta icon="water" label="Piscine" /> : null}
        </View>

        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tags}>
            {item.tags.slice(0, 4).map((tag) => (
              <Chip key={tag} label={tag} tone="muted" />
            ))}
          </View>
        ) : null}

        <Pressable style={styles.reserve} onPress={onReserve}>
          <Ionicons name="calendar-outline" size={16} color={colors.white} />
          <Text style={styles.reserveText}>RÉSERVER</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  fav: { position: "absolute", top: spacing.sm, right: spacing.sm },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.sm },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { ...typography.section, flex: 1, fontSize: 17 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  loc: { color: colors.textMuted, fontSize: 13 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  reserve: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  reserveText: { color: colors.white, fontWeight: "800", fontSize: 13 },
});
