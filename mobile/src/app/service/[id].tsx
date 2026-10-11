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
  const photos = service?.media.filter((m) => m.type !== "VIDEO") ?? [];
  const current = photos[photoIndex] ?? photos[0];
  const summary = reviewsQuery.data?.pages[0]?.summary;
  const reviews = reviewsQuery.data?.pages.flatMap((p) => p.data) ?? [];

  async function shareWhatsApp() {
    if (!service) return;
    await Share.share({
      message: `${service.title} — ${service.provider.displayName}\nhttps://ireduc.cd/services/${service.id}`,
    });
  }

  function plan() {
    if (!requireAuth(`/service/${id}`)) return;
    router.push({
      pathname: "/reserve",
      params: { type: "SERVICE", id: id!, title: service?.title },
    });
  }

  function discuss() {
    if (!requireAuth(`/service/${id}`)) return;
    router.push({
      pathname: "/discuss",
      params: { type: "SERVICE", id: id!, title: service?.title },
    });
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
          <View style={styles.gallery}>
            {current ? (
              <Image
                source={{ uri: mediaUrl(current.url) ?? undefined }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <Ionicons name="image-outline" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {photos.length ? `${photoIndex + 1}/${photos.length}` : "0/0"}
              </Text>
            </View>
            {current?.caption ? (
              <Text style={styles.caption}>{current.caption}</Text>
            ) : null}
            {photos.length > 1 ? (
              <>
                <Pressable
                  style={[styles.nav, styles.navLeft]}
                  onPress={() =>
                    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)
                  }
                >
                  <Ionicons name="chevron-back" size={18} color={colors.navy} />
                </Pressable>
                <Pressable
                  style={[styles.nav, styles.navRight]}
                  onPress={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.navy} />
                </Pressable>
              </>
            ) : null}
          </View>

          <View style={styles.content}>
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
            <Text style={styles.ratingLine}>
              {service.averageRating?.toFixed(1) ?? "—"} ({service.reviewsCount} avis)
              {"  |  "}
              {service.viewsCount} projets réalisés
            </Text>

            <View style={styles.tags}>
              {service.subServices.slice(0, 3).map((s) => (
                <Chip key={s} label={s} tone="muted" />
              ))}
            </View>

            <Text style={styles.section}>Description du service</Text>
            <Text style={styles.body} numberOfLines={expanded ? undefined : 4}>
              {service.description}
            </Text>
            <Pressable onPress={() => setExpanded((v) => !v)}>
              <Text style={styles.more}>{expanded ? "Voir moins" : "Voir plus"}</Text>
            </Pressable>

            <Text style={styles.section}>Zone d'intervention</Text>
            <View style={styles.tags}>
              {service.coverageCommunes.map((c) => (
                <Chip key={c.id} label={c.name} tone="muted" />
              ))}
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
              <View style={styles.secondary}>
                <FavoriteButton
                  targetType="SERVICE"
                  targetId={service.id}
                  returnTo={`/service/${service.id}`}
                />
                <Pressable style={styles.whatsapp} onPress={() => void shareWhatsApp()}>
                  <Ionicons name="logo-whatsapp" size={18} color={colors.whatsapp} />
                  <Text style={styles.whatsappText}>Partager sur WhatsApp</Text>
                </Pressable>
              </View>
            </View>

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
                    <Text style={styles.verified}>Prestataire vérifié</Text>
                  ) : null}
                </View>
                <Text style={styles.stat}>
                  {service.viewsCount} projets · note {service.averageRating ?? "—"}
                  {service.provider.yearsOfExperience != null
                    ? ` · ${service.provider.yearsOfExperience} ans d'expérience`
                    : ""}
                </Text>
                {service.provider.phone ? (
                  <Text style={styles.stat}>{service.provider.phone}</Text>
                ) : null}
                {service.provider.contactEmail ? (
                  <Text style={styles.stat}>{service.provider.contactEmail}</Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.section}>Nos engagements</Text>
            {ENGAGEMENTS.map((e) => (
              <View key={e} style={styles.engage}>
                <Ionicons name="checkmark-circle" size={16} color={colors.navy} />
                <Text style={styles.engageText}>{e}</Text>
              </View>
            ))}

            <Text style={styles.section}>Avis des clients</Text>
            {summary ? (
              <View style={styles.reviewSummary}>
                <Text style={styles.avg}>
                  {summary.averageRating?.toFixed(1) ?? "—"} sur 5
                </Text>
                <Text style={styles.stat}>{summary.totalRatings} avis</Text>
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct =
                    summary.percentage[star as 1 | 2 | 3 | 4 | 5] ?? 0;
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
              </View>
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
                label="Voir plus d'avis"
                variant="outline"
                onPress={() => void reviewsQuery.fetchNextPage()}
                loading={reviewsQuery.isFetchingNextPage}
              />
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  gallery: { height: 240, backgroundColor: colors.skeleton },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  counter: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  counterText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  caption: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  nav: {
    position: "absolute",
    top: "42%",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: { left: spacing.md },
  navRight: { right: spacing.md },
  content: { padding: spacing.lg, gap: spacing.sm },
  breadcrumb: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  by: { color: colors.textMuted },
  byBold: { color: colors.navy, fontWeight: "800" },
  ratingLine: { color: colors.textMuted, fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 4 },
  section: { ...typography.section, marginTop: spacing.md },
  body: { ...typography.body, lineHeight: 22 },
  more: { color: colors.navy, fontWeight: "700" },
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
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
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
  },
  whatsappText: { color: colors.whatsapp, fontWeight: "700" },
  providerCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: { width: 52, height: 52, borderRadius: 26 },
  logoFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: { color: colors.navy, fontWeight: "800" },
  verified: {
    backgroundColor: "#D6E8FF",
    color: colors.navy,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  stat: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  engage: { flexDirection: "row", alignItems: "center", gap: 8 },
  engageText: { color: colors.navy, fontWeight: "600" },
  reviewSummary: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  avg: { color: colors.navy, fontWeight: "800", fontSize: 20 },
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
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  reviewAuthor: { color: colors.navy, fontWeight: "800" },
  reviewStars: { color: "#F2C94C" },
});
