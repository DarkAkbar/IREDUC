import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { mediaUrl } from "../../api/client";
import { PropertyDetail, ServiceDetail } from "../../api/types";
import { colors, radii, spacing } from "../../theme";
import { formatPrice, offerBadge, propertyLocation } from "../../utils/format";
import { Badge } from "../ui/Badge";

type Props = {
  property?: PropertyDetail | null;
  service?: ServiceDetail | null;
};

export function TargetSummaryCard({ property, service }: Props) {
  if (property) {
    const photo = property.coverPhoto ?? property.media?.[0] ?? property.photos?.[0];
    return (
      <View style={styles.card}>
        {photo ? (
          <Image
            source={{ uri: mediaUrl(photo.url) ?? undefined }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="home-outline" size={28} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.body}>
          <Badge label={offerBadge(property.offerType)} />
          <Text style={styles.title} numberOfLines={2}>
            {property.title}
          </Text>
          <View style={styles.row}>
            <Ionicons name="location" size={12} color={colors.primary} />
            <Text style={styles.meta} numberOfLines={1}>
              {property.address
                ? `${property.address}, ${propertyLocation(property)}`
                : propertyLocation(property)}
            </Text>
          </View>
          <Text style={styles.price}>
            {formatPrice(property.price, property.offerType).replace(" $", " USD")}
          </Text>
          <Text style={styles.specs}>
            {[
              property.bedrooms != null ? `${property.bedrooms} ch.` : null,
              property.bathrooms != null ? `${property.bathrooms} sdb` : null,
              property.areaM2 != null ? `${Math.round(property.areaM2)} m²` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      </View>
    );
  }

  if (service) {
    const photo = service.coverPhoto ?? service.media?.[0] ?? service.photos?.[0];
    return (
      <View style={styles.card}>
        {photo ? (
          <Image
            source={{ uri: mediaUrl(photo.url) ?? undefined }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="construct-outline" size={28} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.body}>
          <Badge label="Service" />
          <Text style={styles.title} numberOfLines={2}>
            {service.title}
          </Text>
          <Text style={styles.meta}>{service.provider.displayName}</Text>
          <Text style={styles.specs}>{service.category.name}</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  image: { width: 110, height: 120 },
  placeholder: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, padding: spacing.md, gap: 4 },
  title: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { color: colors.textMuted, fontSize: 12, flex: 1 },
  price: { color: colors.primary, fontWeight: "800", marginTop: 2 },
  specs: { color: colors.textMuted, fontSize: 12 },
});
