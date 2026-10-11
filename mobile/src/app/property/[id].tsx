import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../../api/client";
import { fetchProperty } from "../../api/properties";
import { FavoriteButton } from "../../components/FavoriteButton";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { colors, radii, spacing, typography } from "../../theme";
import { formatPrice, offerBadge, propertyLocation } from "../../utils/format";

const WIDTH = Dimensions.get("window").width;

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [tab, setTab] = useState<"photos" | "video">("photos");
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const query = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id!),
    enabled: Boolean(id),
  });

  const property = query.data;
  const photos =
    property?.media.filter((m) => m.type !== "VIDEO") ??
    property?.photos ??
    [];
  const videos = property?.media.filter((m) => m.type === "VIDEO") ?? [];
  const gallery = tab === "photos" ? photos : videos;
  const current = gallery[photoIndex] ?? gallery[0];

  async function openMap() {
    if (!property?.latitude || !property?.longitude) {
      const q = encodeURIComponent(
        property?.address || propertyLocation(property!)
      );
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
      return;
    }
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
    );
  }

  async function shareWhatsApp() {
    if (!property) return;
    const message = `${property.title} — ${formatPrice(
      property.price,
      property.offerType
    )}\n${propertyLocation(property)}\nhttps://ireduc.cd/properties/${property.id}`;
    await Share.share({ message });
  }

  function reserve() {
    if (!requireAuth(`/property/${id}`)) return;
    router.push({
      pathname: "/reserve",
      params: { type: "PROPERTY", id: id!, title: property?.title },
    });
  }

  function discuss() {
    if (!requireAuth(`/property/${id}`)) return;
    router.push({
      pathname: "/discuss",
      params: { type: "PROPERTY", id: id!, title: property?.title },
    });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ListScreenHeader showBack />

      {query.isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonLoader height={240} borderRadius={radii.lg} />
          <SkeletonLoader width="60%" height={24} />
          <SkeletonLoader height={80} />
        </View>
      ) : null}

      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {property ? (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <View style={styles.tabs}>
            <Pressable onPress={() => { setTab("photos"); setPhotoIndex(0); }}>
              <Text style={[styles.tab, tab === "photos" && styles.tabActive]}>
                Photos ({photos.length})
              </Text>
            </Pressable>
            <Pressable onPress={() => { setTab("video"); setPhotoIndex(0); }}>
              <Text style={[styles.tab, tab === "video" && styles.tabActive]}>
                Vidéo ({videos.length})
              </Text>
            </Pressable>
          </View>

          <View style={styles.gallery}>
            {current ? (
              <Image
                source={{ uri: mediaUrl(current.url) ?? undefined }}
                style={styles.mainImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.mainImage, styles.placeholder]}>
                <Ionicons name="image-outline" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.counter}>
              <Ionicons name="camera-outline" size={14} color={colors.white} />
              <Text style={styles.counterText}>
                {gallery.length ? `${photoIndex + 1}/${gallery.length}` : "0/0"}
              </Text>
            </View>
            {gallery.length > 1 ? (
              <>
                <Pressable
                  style={[styles.nav, styles.navLeft]}
                  onPress={() =>
                    setPhotoIndex((i) => (i - 1 + gallery.length) % gallery.length)
                  }
                >
                  <Ionicons name="chevron-back" size={18} color={colors.navy} />
                </Pressable>
                <Pressable
                  style={[styles.nav, styles.navRight]}
                  onPress={() => setPhotoIndex((i) => (i + 1) % gallery.length)}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.navy} />
                </Pressable>
              </>
            ) : null}
            <ScrollView
              horizontal
              style={styles.thumbs}
              showsHorizontalScrollIndicator={false}
            >
              {gallery.slice(0, 4).map((m, i) => (
                <Pressable key={m.id} onPress={() => setPhotoIndex(i)}>
                  <Image
                    source={{ uri: mediaUrl(m.url) ?? undefined }}
                    style={[styles.thumb, i === photoIndex && styles.thumbActive]}
                  />
                </Pressable>
              ))}
              {gallery.length > 4 ? (
                <View style={[styles.thumb, styles.moreThumb]}>
                  <Text style={styles.moreText}>+{gallery.length - 4}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>

          <View style={styles.content}>
            <View style={styles.locRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.loc}>
                {property.address
                  ? `${property.address}, ${propertyLocation(property)}`
                  : propertyLocation(property)}
              </Text>
              <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
              <Text style={styles.views}>{property.viewsCount} vues</Text>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.title}>{property.title}</Text>
              <Badge label={offerBadge(property.offerType)} />
            </View>

            <View style={styles.meta}>
              {property.bedrooms != null ? (
                <Text style={styles.metaText}>{property.bedrooms} chambres</Text>
              ) : null}
              {property.bathrooms != null ? (
                <Text style={styles.metaText}>{property.bathrooms} sdb</Text>
              ) : null}
              {property.areaM2 != null ? (
                <Text style={styles.metaText}>{Math.round(property.areaM2)} m²</Text>
              ) : null}
            </View>

            <View style={styles.priceBox}>
              <Text style={styles.price}>
                {formatPrice(property.price, property.offerType)}
              </Text>
              <Text style={styles.priceHint}>Frais de service IREDUC inclus</Text>
            </View>

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description} numberOfLines={expanded ? undefined : 4}>
              {property.description}
            </Text>
            <Pressable onPress={() => setExpanded((v) => !v)}>
              <Text style={styles.more}>
                {expanded ? "Voir moins" : "Voir plus"}
              </Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Localisation</Text>
            <Button
              label="Voir sur la carte"
              variant="outline"
              onPress={() => void openMap()}
            />

            <Text style={styles.sectionTitle}>Caractéristiques</Text>
            <View style={styles.chips}>
              {property.parking ? <Tag label="Parking" /> : null}
              {property.hasPool ? <Tag label="Piscine" /> : null}
              {property.hasTitleDeed ? <Tag label="Titre foncier" /> : null}
              {property.tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </View>

            <View style={styles.actions}>
              <Button label="Réserver une visite" onPress={reserve} />
              <Button
                label="Discuter avec le propriétaire"
                variant="navy"
                onPress={discuss}
                style={{ marginTop: spacing.sm }}
              />
              <View style={styles.secondaryActions}>
                <View style={styles.secondaryBtn}>
                  <FavoriteButton
                    targetType="PROPERTY"
                    targetId={property.id}
                    returnTo={`/property/${property.id}`}
                  />
                  <Text style={styles.secondaryLabel}>Favoris</Text>
                </View>
                <Pressable style={styles.whatsapp} onPress={() => void shareWhatsApp()}>
                  <Ionicons name="logo-whatsapp" size={18} color={colors.whatsapp} />
                  <Text style={styles.whatsappText}>Partager sur WhatsApp</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              {property.owner.agency
                ? "Agence de cette offre"
                : "Propriétaire de cette offre"}
            </Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerTop}>
                {property.owner.agency?.logoUrl ? (
                  <Image
                    source={{ uri: mediaUrl(property.owner.agency.logoUrl) ?? undefined }}
                    style={styles.ownerLogo}
                  />
                ) : (
                  <View style={[styles.ownerLogo, styles.logoFallback]}>
                    <Ionicons name="person" size={20} color={colors.navy} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.ownerName}>
                      {property.owner.agency?.displayName ?? property.owner.fullName}
                    </Text>
                    {property.owner.verified ? (
                      <Ionicons name="checkmark-circle" size={16} color="#2F80ED" />
                    ) : null}
                  </View>
                  {property.owner.agency ? (
                    <Text style={styles.verifiedBadge}>Agence vérifiée</Text>
                  ) : null}
                </View>
              </View>
              <Text style={styles.contact}>
                {property.contacts.phoneMasked ?? "Téléphone masqué"}
              </Text>
              {property.contacts.whatsapp ? (
                <Text style={styles.contact}>WhatsApp : {property.contacts.whatsapp}</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tab: { color: colors.textMuted, fontWeight: "700", paddingBottom: 6 },
  tabActive: {
    color: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  gallery: { width: WIDTH, height: 260, backgroundColor: colors.skeleton },
  mainImage: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  counter: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    alignItems: "center",
  },
  counterText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  nav: {
    position: "absolute",
    top: "40%",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: { left: spacing.md },
  navRight: { right: spacing.md },
  thumbs: { position: "absolute", right: spacing.sm, top: spacing.sm, maxHeight: 200 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: colors.primary },
  moreThumb: {
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  content: { padding: spacing.lg, gap: spacing.sm },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  loc: { color: colors.textMuted, flex: 1, fontSize: 13 },
  views: { color: colors.textMuted, fontSize: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { ...typography.title, flex: 1 },
  meta: { flexDirection: "row", gap: spacing.md },
  metaText: { color: colors.navy, fontWeight: "600" },
  priceBox: {
    backgroundColor: "#E8EEF9",
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  price: { color: colors.navy, fontSize: 22, fontWeight: "800" },
  priceHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sectionTitle: { ...typography.section, marginTop: spacing.md },
  description: { ...typography.body, lineHeight: 22 },
  more: { color: colors.navy, fontWeight: "700", marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: {
    backgroundColor: "#E8EEF9",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: { color: colors.navy, fontSize: 12, fontWeight: "600" },
  actions: { marginTop: spacing.md },
  secondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  secondaryBtn: { alignItems: "center", gap: 4 },
  secondaryLabel: { fontSize: 11, color: colors.navy, fontWeight: "600" },
  whatsapp: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.whatsapp,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  whatsappText: { color: colors.whatsapp, fontWeight: "700" },
  ownerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  ownerTop: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  ownerLogo: { width: 48, height: 48, borderRadius: 24 },
  logoFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ownerName: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  verifiedBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#D6E8FF",
    color: colors.navy,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    fontSize: 11,
    fontWeight: "700",
  },
  contact: { color: colors.textMuted, fontSize: 13 },
});
