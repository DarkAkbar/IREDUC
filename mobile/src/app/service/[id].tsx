import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../../api/client";
import { fetchService, fetchServiceReviews } from "../../api/services";
import { DetailGallery } from "../../components/detail/DetailGallery";
import { FavoriteButton } from "../../components/FavoriteButton";
import { ErrorState } from "../../components/list/ErrorState";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { colors, radii, spacing, typography } from "../../theme";

const ENGAGEMENTS = [
  "Techniciens qualifiés",
  "Respect des délais",
  "Matériel de qualité",
  "Service après-vente",
];

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [tab, setTab] = useState<"photos" | "video" | "about">("photos");
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const query = useQuery({
    queryKey: ["service", id],
    queryFn: () => fetchService(id!),
    enabled: Boolean(id),
  });

  const reviewsQuery = useInfiniteQuery({
    queryKey: ["service-reviews", id],
    queryFn: ({ pageParam }) => fetchServiceReviews(id!, pageParam, 5),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(id),
  });

  const service = query.data;
  const photos = service?.media.filter((m) => (m.type ?? "PHOTO") !== "VIDEO") ?? [];
  const videos = service?.media.filter((m) => m.type === "VIDEO") ?? [];
  const summary = reviewsQuery.data?.pages[0]?.summary;
  const reviews = reviewsQuery.data?.pages.flatMap((p) => p.data) ?? [];

  async function shareWhatsApp() {
    if (!service) return;
    await Share.share({
      message: `${service.title} — ${service.provider.displayName}\nhttps://ireduc.cd/services/${service.id}`,
    });
  }

  function plan() {
    const returnTo = `/reserve?type=SERVICE&id=${id}`;
    if (!requireAuth(returnTo)) return;
    router.push({
      pathname: "/reserve",
      params: { type: "SERVICE", id: id!, title: service?.title },
    } as never);
  }

  function discuss() {
    if (!requireAuth(`/service/${id}`)) return;
    router.push({
      pathname: "/discuss",
      params: { type: "SERVICE", id: id!, title: service?.title },
    } as never);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ListScreenHeader showBack />

      {query.isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonLoader height={220} borderRadius={radii.lg} />
          <SkeletonLoader width="70%" height={24} />
        </View>
      ) : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {service ? (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <DetailGallery
            photos={photos}
            videos={videos}
            tab={tab}
            onTabChange={setTab}
            index={photoIndex}
            onIndexChange={setPhotoIndex}
            showAboutTab
          />

          <View style={styles.content}>
            {tab === "about" ? (
              <View style={styles.card}>
                <Text style={styles.section}>À propos du service</Text>
                <Text style={styles.body}>{service.description}</Text>
              </View>
            ) : null}

            <Text style={styles.breadcrumb}>
              {service.category.name}
              {service.subServices[0] ? ` > ${service.subServices[0]}` : ""}
            </Text>
            <Text style={typography.title}>{service.title}</Text>
            <View style={styles.providerRow}>
              <Text style={styles.by}>
                Par <Text style={styles.byBold}>{service.provider.displayName}</Text>
              </Text>
              {service.provider.verified ? (
                <Ionicons name="checkmark-circle" size={16} color="#2F80ED" />
              ) : null}
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F2C94C" />
              <Text style={styles.ratingLine}>
                {service.averageRating?.toFixed(1) ?? "—"} ({service.reviewsCount} avis)
                {"  |  "}
                {service.viewsCount} projets réalisés
              </Text>
            </View>

            <View style={styles.tags}>
              {service.subServices.slice(0, 3).map((s) => (
                <View key={s} style={styles.featureTag}>
                  <Ionicons name="flash-outline" size={14} color={colors.navy} />
                  <Text style={styles.featureText}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.section}>Description du service</Text>
              <Text style={styles.body} numberOfLines={expanded ? undefined : 4}>
                {service.description}
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
              <Text style={styles.section}>Zone d'intervention</Text>
              <View style={styles.mapBox}>
                <Ionicons name="location" size={32} color={colors.primary} />
                <Text style={styles.mapHint}>Kinshasa et environs</Text>
              </View>
              <Text style={styles.zoneLabel}>Nous intervenons à :</Text>
              <View style={styles.tags}>
                {service.coverageCommunes.map((c) => (
                  <Chip key={c.id} label={c.name} tone="muted" />
                ))}
              </View>
            </View>

            <View style={styles.ctaBox}>
              <Text style={styles.ctaTitle}>Demander ce service</Text>
              <Text style={styles.ctaHint}>Gratuit et sans engagement</Text>
              <Button label="Planifier une intervention" onPress={plan} />
              <Button
                label="Discuter avec le prestataire"
                variant="navy"
                onPress={discuss}
                style={{ marginTop: spacing.sm }}
              />
              <View style={styles.secondaryRow}>
                <View style={styles.secondaryBtn}>
                  <FavoriteButton
                    targetType="SERVICE"
                    targetId={service.id}
                    returnTo={`/service/${service.id}`}
                  />
                  <Text style={styles.secondaryLabel}>Favori</Text>
                </View>
                <Pressable style={styles.secondaryBtn}>
                  <Ionicons name="notifications-outline" size={20} color={colors.navy} />
                  <Text style={styles.secondaryLabel}>Créer une alerte</Text>
                </Pressable>
              </View>
              <Pressable style={styles.whatsapp} onPress={() => void shareWhatsApp()}>
                <Ionicons name="logo-whatsapp" size={18} color={colors.whatsapp} />
                <Text style={styles.whatsappText}>Partager sur WhatsApp</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.section}>À propos du prestataire</Text>
              <View style={styles.providerCard}>
                {service.provider.logoUrl ? (
                  <Image
                    source={{ uri: mediaUrl(service.provider.logoUrl) ?? undefined }}
                    style={styles.logo}
                  />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Ionicons name="business" size={20} color={colors.navy} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.providerRow}>
                    <Text style={styles.providerName}>{service.provider.displayName}</Text>
                    {service.provider.verified ? (
                      <Ionicons name="checkmark-circle" size={16} color="#2F80ED" />
                    ) : null}
                  </View>
                  {service.provider.verified ? (
                    <Text style={styles.verified}>Prestataire vérifié</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.statsRow}>
                <Stat value={String(service.viewsCount)} label="Projets réalisés" />
                <Stat
                  value={service.averageRating?.toFixed(1) ?? "—"}
                  label="Note moyenne"
                />
                <Stat
                  value={
                    service.provider.yearsOfExperience != null
                      ? `${service.provider.yearsOfExperience} ans`
                      : "—"
                  }
                  label="Expérience"
                />
              </View>
              {service.provider.phone ? (
                <ContactRow icon="call-outline" text={service.provider.phone} />
              ) : null}
              {service.provider.contactEmail ? (
                <ContactRow icon="mail-outline" text={service.provider.contactEmail} />
              ) : null}
              <ContactRow icon="location-outline" text="Kinshasa, RDC" />
            </View>

            <View style={styles.card}>
              <Text style={styles.section}>Nos engagements</Text>
              {ENGAGEMENTS.map((e) => (
                <View key={e} style={styles.engage}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.navy} />
                  <Text style={styles.engageText}>{e}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.section}>Avis des clients</Text>
              {summary ? (
                <>
                  <Text style={styles.avg}>
                    {summary.averageRating?.toFixed(1) ?? "—"} sur 5
                  </Text>
                  <Text style={styles.statLine}>{summary.totalRatings} avis</Text>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = summary.percentage[star as 1 | 2 | 3 | 4 | 5] ?? 0;
                    return (
                      <View key={star} style={styles.barRow}>
                        <Text style={styles.barLabel}>{star}★</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.barPct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </>
              ) : null}

              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <Text style={styles.reviewAuthor}>{review.author.fullName}</Text>
                  <Text style={styles.reviewStars}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </Text>
                  {review.comment ? (
                    <Text style={styles.body}>{review.comment}</Text>
                  ) : null}
                </View>
              ))}

              {reviewsQuery.hasNextPage ? (
                <Button
                  label="Voir tous les avis"
                  variant="outline"
                  onPress={() => void reviewsQuery.fetchNextPage()}
                  loading={reviewsQuery.isFetchingNextPage}
                />
              ) : null}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  breadcrumb: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  by: { color: colors.textMuted },
  byBold: { color: colors.navy, fontWeight: "800" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingLine: { color: colors.textMuted, fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 4 },
  featureTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8EEF9",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  featureText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  section: { color: colors.navy, fontWeight: "800", fontSize: 16 },
  body: { ...typography.body, lineHeight: 22 },
  moreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  more: { color: colors.navy, fontWeight: "700" },
  mapBox: {
    height: 110,
    borderRadius: radii.md,
    backgroundColor: "#DCE7F8",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  mapHint: { color: colors.navy, fontWeight: "600" },
  zoneLabel: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  ctaBox: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  ctaTitle: { color: colors.navy, fontWeight: "800", fontSize: 16 },
  ctaHint: { color: colors.textMuted, marginBottom: spacing.md, marginTop: 2 },
  secondaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  secondaryLabel: { color: colors.navy, fontWeight: "700", fontSize: 12 },
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
  },
  whatsappText: { color: colors.whatsapp, fontWeight: "700" },
  providerCard: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  logo: { width: 52, height: 52, borderRadius: 26 },
  logoFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: { color: colors.navy, fontWeight: "800" },
  verified: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#D6E8FF",
    color: colors.navy,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: "#E8EEF9",
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  statValue: { color: colors.navy, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 10, textAlign: "center", marginTop: 2 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { color: colors.textMuted, fontSize: 13 },
  engage: { flexDirection: "row", alignItems: "center", gap: 8 },
  engageText: { color: colors.navy, fontWeight: "600" },
  avg: { color: colors.navy, fontWeight: "800", fontSize: 20 },
  statLine: { color: colors.textMuted, fontSize: 12 },
  barRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  barLabel: { width: 28, color: colors.textMuted, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.skeleton,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: colors.primary },
  barPct: { width: 36, textAlign: "right", color: colors.textMuted, fontSize: 12 },
  reviewCard: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
  },
  reviewAuthor: { color: colors.navy, fontWeight: "800" },
  reviewStars: { color: "#F2C94C" },
});
