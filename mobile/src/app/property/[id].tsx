import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { DetailGallery } from "../../components/detail/DetailGallery";
import { FavoriteButton } from "../../components/FavoriteButton";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { colors, radii, spacing, typography } from "../../theme";
import { formatPrice, kindLabel, offerBadge, propertyLocation } from "../../utils/format";

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [tab, setTab] = useState<"photos" | "video" | "about">("photos");
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [charsOpen, setCharsOpen] = useState(true);

  const query = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id!),
    enabled: Boolean(id),
  });

  const property = query.data;
  const photos =
    property?.media.filter((m) => (m.type ?? "PHOTO") !== "VIDEO") ??
    property?.photos ??
    [];
  const videos = property?.media.filter((m) => m.type === "VIDEO") ?? [];

  async function openMap() {
    if (!property) return;
    if (property.latitude != null && property.longitude != null) {
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
      );
      return;
    }
    const q = encodeURIComponent(property.address || propertyLocation(property));
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  }

  async function shareWhatsApp() {
    if (!property) return;
    await Share.share({
      message: `${property.title} — ${formatPrice(property.price, property.offerType)}\n${propertyLocation(property)}\nhttps://ireduc.cd/properties/${property.id}`,
    });
  }

  function reserve() {
    const returnTo = `/reserve?type=PROPERTY&id=${id}`;
    if (!requireAuth(returnTo)) return;
    router.push({
      pathname: "/reserve",
      params: { type: "PROPERTY", id: id!, title: property?.title },
    } as never);
  }

  function discuss() {
    const returnTo = `/discuss?type=PROPERTY&id=${id}`;
    if (!requireAuth(returnTo)) return;
    router.push({
      pathname: "/discuss",
      params: { type: "PROPERTY", id: id!, title: property?.title },
    } as never);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ListScreenHeader showBack />

      {query.isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonLoader height={220} borderRadius={radii.lg} />
          <SkeletonLoader width="60%" height={24} />
          <SkeletonLoader height={120} />
        </View>
      ) : null}

      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {property ? (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <DetailGallery
            photos={photos}
            videos={videos}
            tab={tab}
            onTabChange={setTab}
            index={photoIndex}
            onIndexChange={setPhotoIndex}
          />

          <View style={styles.content}>
            <View style={styles.locRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.loc} numberOfLines={2}>
                {property.address
                  ? `${property.address}, ${propertyLocation(property)}`
                  : propertyLocation(property)}
              </Text>
              <View style={styles.views}>
                <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
                <Text style={styles.viewsText}>{property.viewsCount} vues</Text>
              </View>
            </View>

            <Text style={styles.title}>{kindLabel(String(property.kind))}</Text>
            <Text style={styles.subtitleTitle}>{property.title}</Text>
            <Badge label={offerBadge(property.offerType)} />

            <View style={styles.metaRow}>
              {property.bedrooms != null ? (
                <Meta icon="bed-outline" label={`${property.bedrooms} chambres`} />
              ) : null}
              {property.bathrooms != null ? (
                <Meta icon="water-outline" label={`${property.bathrooms} sdb`} />
              ) : null}
              {property.areaM2 != null ? (
                <Meta icon="resize-outline" label={`${Math.round(property.areaM2)} m²`} />
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHead}>
                <Ionicons name="document-text-outline" size={18} color={colors.navy} />
                <Text style={styles.section}>Description</Text>
              </View>
              <Text style={styles.body} numberOfLines={expanded ? undefined : 4}>
                {property.description}
              </Text>
              <Pressable style={styles.moreRow} onPress={() => setExpanded((v) => !v)}>
                <Text style={styles.more}>{expanded ? "Voir moins" : "Voir plus"}</Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.navy}
                />
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHead}>
                <Ionicons name="map-outline" size={18} color={colors.navy} />
                <Text style={styles.section}>Localisation</Text>
              </View>
              <Pressable style={styles.mapBox} onPress={() => void openMap()}>
                <Ionicons name="location" size={36} color={colors.primary} />
                <Text style={styles.mapHint}>Aperçu Kinshasa</Text>
                <View style={styles.mapBtn}>
                  <Ionicons name="navigate-outline" size={16} color={colors.navy} />
                  <Text style={styles.mapBtnText}>Voir sur la carte</Text>
                </View>
              </Pressable>
              <Text style={styles.addressLine}>
                {property.address || propertyLocation(property)}
              </Text>
            </View>

            <Pressable style={styles.card} onPress={() => setCharsOpen((v) => !v)}>
              <View style={styles.sectionHead}>
                <Ionicons name="list-outline" size={18} color={colors.navy} />
                <Text style={[styles.section, { flex: 1 }]}>Caractéristiques</Text>
                <Ionicons
                  name={charsOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.navy}
                />
              </View>
              {charsOpen ? (
                <View style={styles.chips}>
                  {property.parking ? <Tag label="Parking" /> : null}
                  {property.hasPool ? <Tag label="Piscine" /> : null}
                  {property.hasTitleDeed ? <Tag label="Titre foncier" /> : null}
                  {property.tags.map((t) => (
                    <Tag key={t} label={t} />
                  ))}
                </View>
              ) : null}
            </Pressable>

            <View style={styles.priceCard}>
              <Text style={styles.price}>
                {formatPrice(property.price, property.offerType).replace(" $", " USD")}
              </Text>
              <View style={styles.priceHintRow}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                <Text style={styles.priceHint}>Frais de service IREDUC inclus</Text>
              </View>
            </View>

            <Button label="Réserver une visite" onPress={reserve} />
            <Button
              label="Discuter avec le propriétaire"
              variant="navy"
              onPress={discuss}
              style={{ marginTop: spacing.sm }}
            />

            <View style={styles.secondaryRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => undefined}>
                <FavoriteButton
                  targetType="PROPERTY"
                  targetId={property.id}
                  returnTo={`/property/${property.id}`}
                />
                <Text style={styles.secondaryLabel}>Ajouter aux favoris</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn}>
                <Ionicons name="notifications-outline" size={20} color={colors.navy} />
                <Text style={styles.secondaryLabel}>Créer une alerte</Text>
              </Pressable>
            </View>

            <Pressable style={styles.whatsapp} onPress={() => void shareWhatsApp()}>
              <Ionicons name="logo-whatsapp" size={18} color={colors.whatsapp} />
              <Text style={styles.whatsappText}>Partager sur WhatsApp</Text>
            </Pressable>

            <View style={styles.card}>
              <View style={styles.sectionHead}>
                <Ionicons name="person-outline" size={18} color={colors.navy} />
                <Text style={styles.section}>
                  {property.owner.agency
                    ? "Agence de cette offre"
                    : "Propriétaire de cette offre"}
                </Text>
              </View>
              <View style={styles.ownerTop}>
                {property.owner.agency?.logoUrl ? (
                  <Image
                    source={{
                      uri: mediaUrl(property.owner.agency.logoUrl) ?? undefined,
                    }}
                    style={styles.ownerLogo}
                  />
                ) : (
                  <View style={[styles.ownerLogo, styles.logoFallback]}>
                    <Ionicons name="business" size={20} color={colors.navy} />
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
              <ContactRow
                icon="location-outline"
                text={propertyLocation(property)}
              />
              <ContactRow
                icon="call-outline"
                text={property.contacts.phoneMasked ?? "Téléphone masqué"}
              />
              {property.contacts.whatsapp ? (
                <ContactRow icon="logo-whatsapp" text={property.contacts.whatsapp} />
              ) : null}
            </View>
          </View>
        </ScrollView>
      ) : null}
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
      <Ionicons name={icon} size={16} color={colors.navy} />
      <Text style={styles.metaText}>{label}</Text>
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

function ContactRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.contactRow}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.contactText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  locRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  loc: { flex: 1, color: colors.textMuted, fontSize: 13 },
  views: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewsText: { color: colors.textMuted, fontSize: 12 },
  title: { ...typography.title, marginTop: spacing.sm },
  subtitleTitle: { color: colors.textMuted, marginBottom: spacing.sm },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  section: { color: colors.navy, fontWeight: "800", fontSize: 16 },
  body: { ...typography.body, lineHeight: 22 },
  moreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  more: { color: colors.navy, fontWeight: "700" },
  mapBox: {
    height: 140,
    borderRadius: radii.md,
    backgroundColor: "#DCE7F8",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  mapHint: { color: colors.navy, fontWeight: "600" },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBtnText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  addressLine: { color: colors.textMuted, fontSize: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: {
    backgroundColor: "#E8EEF9",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: { color: colors.navy, fontSize: 12, fontWeight: "600" },
  priceCard: {
    backgroundColor: "#E8EEF9",
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  price: { color: colors.navy, fontSize: 26, fontWeight: "800" },
  priceHintRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  priceHint: { color: colors.textMuted, fontSize: 12 },
  secondaryRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  secondaryLabel: { color: colors.navy, fontWeight: "700", fontSize: 12, flexShrink: 1 },
  whatsapp: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.whatsapp,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  whatsappText: { color: colors.whatsapp, fontWeight: "700" },
  ownerTop: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  ownerLogo: { width: 52, height: 52, borderRadius: 26 },
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
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { color: colors.textMuted, fontSize: 13 },
});
