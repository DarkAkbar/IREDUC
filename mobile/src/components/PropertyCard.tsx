import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mediaUrl } from "../api/client";
import { PropertyListItem } from "../api/types";
import { colors, radii, spacing, typography } from "../theme";
import { Badge } from "./ui/Badge";

type Props = {
  item: PropertyListItem;
  featured?: boolean;
  onPress?: () => void;
};

function formatPrice(item: PropertyListItem) {
  const amount = new Intl.NumberFormat("fr-FR").format(item.price);
  if (item.offerType === "RENT") {
    return `${amount} $ / mois`;
  }
  return `${amount} $`;
}

export function PropertyCard({ item, featured, onPress }: Props) {
  const image = mediaUrl(item.coverPhoto?.url);
  const location =
    item.neighborhood?.name
      ? `${item.neighborhood.name}`
      : item.commune.name;

  return (
    <Pressable
      style={[styles.card, featured && styles.featuredCard]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={image}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="home-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        {(featured || item.isFeatured) && (
          <View style={styles.badge}>
            <Badge label="À la une" />
          </View>
        )}
        <View style={styles.imageOverlay}>
          <Text style={styles.kind}>{item.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.white} />
            <Text style={styles.location}>{location}</Text>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={typography.price}>{formatPrice(item)}</Text>
        <View style={styles.meta}>
          {item.bedrooms != null ? (
            <Text style={styles.metaText}>{item.bedrooms} ch.</Text>
          ) : null}
          {item.bathrooms != null ? (
            <Text style={styles.metaText}>{item.bathrooms} SDB</Text>
          ) : null}
          {item.areaM2 != null ? (
            <Text style={styles.metaText}>{Math.round(item.areaM2)} m²</Text>
          ) : null}
          {item.kind === "LAND" ? (
            <Text style={styles.metaText}>Terrain</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    shadowColor: colors.navy,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginRight: spacing.md,
  },
  featuredCard: { width: 250 },
  imageWrap: { height: 150, position: "relative" },
  image: { width: "100%", height: "100%" },
  placeholder: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { position: "absolute", top: spacing.sm, right: spacing.sm },
  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  kind: { color: colors.white, fontWeight: "700", fontSize: 14 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  location: { color: colors.white, fontSize: 12 },
  body: { padding: spacing.md, gap: spacing.xs },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
