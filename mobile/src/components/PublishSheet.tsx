import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMyProvider } from "../api/providers";
import { usePartnerGate } from "./PartnerGate";
import { useAuthStore } from "../store/authStore";
import { PublishListingType, usePublishStore } from "../store/publishStore";
import { usePublishSheetStore } from "../store/publishSheetStore";
import { colors, radii, spacing } from "../theme";

type SheetOption = {
  key: PublishListingType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  partnerType: "INDIVIDUAL" | "AGENCY" | "SERVICE_PROVIDER";
};

const OPTIONS: SheetOption[] = [
  {
    key: "RENT",
    title: "Mettre un bien en location",
    description: "Appartement, maison ou villa à louer",
    icon: "key-outline",
    partnerType: "INDIVIDUAL",
  },
  {
    key: "SALE",
    title: "Vendre un bien",
    description: "Maison, appartement ou villa à vendre",
    icon: "home-outline",
    partnerType: "INDIVIDUAL",
  },
  {
    key: "LAND",
    title: "Vendre un terrain",
    description: "Parcelle ou terrain constructible",
    icon: "map-outline",
    partnerType: "INDIVIDUAL",
  },
  {
    key: "SERVICE",
    title: "Proposer un service",
    description: "Électricité, plomberie, travaux…",
    icon: "construct-outline",
    partnerType: "SERVICE_PROVIDER",
  },
];

function hasUsableDraft(draft: {
  title: string;
  listingId: string | null;
  pendingMedia: unknown[];
}) {
  return (
    Boolean(draft.listingId) ||
    draft.title.trim().length >= 3 ||
    draft.pendingMedia.length > 0
  );
}

export function PublishSheet() {
  const insets = useSafeAreaInsets();
  const visible = usePublishSheetStore((s) => s.visible);
  const close = usePublishSheetStore((s) => s.close);
  const setReopenAfterAuth = usePublishSheetStore((s) => s.setReopenAfterAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { runPartnerGate } = usePartnerGate();
  const draft = usePublishStore((s) => s.draft);
  const setListingType = usePublishStore((s) => s.setListingType);
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 1.1) {
          close();
          translateY.setValue(0);
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated && visible,
    queryFn: fetchMyProvider,
    retry: false,
  });

  const approved = providerQuery.data?.reviewStatus === "APPROVED";
  const showResume = approved && hasUsableDraft(draft);

  const cards = useMemo(() => OPTIONS, []);

  async function onSelect(option: SheetOption) {
    setListingType(option.key);
    close();
    if (!isAuthenticated) {
      setReopenAfterAuth(true);
    }
    await runPartnerGate("publish", {
      listingType: option.key,
      partnerType: option.partnerType,
    });
  }

  async function onResumeDraft() {
    close();
    await runPartnerGate("publish", {
      listingType: draft.listingType,
      resumeDraft: true,
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityLabel="Fermer"
          accessibilityRole="button"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY }],
            },
          ]}
          accessibilityViewIsModal
        >
          <View {...panResponder.panHandlers} style={styles.handleZone}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.title}>Que souhaitez-vous publier ?</Text>
          <Text style={styles.subtitle}>
            Choisissez le type d&apos;annonce. Nous vous guiderons ensuite.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {showResume ? (
              <Pressable
                style={[styles.card, styles.resumeCard]}
                onPress={() => void onResumeDraft()}
                accessibilityRole="button"
                accessibilityLabel="Reprendre mon brouillon"
              >
                <View style={[styles.iconWrap, styles.resumeIcon]}>
                  <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>Reprendre mon brouillon</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {draft.title.trim() || "Annonce en cours de rédaction"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}

            {cards.map((option) => (
              <Pressable
                key={option.key}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => void onSelect(option)}
                accessibilityRole="button"
                accessibilityLabel={option.title}
                accessibilityHint={option.description}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={option.icon} size={22} color={colors.navy} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardDesc}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: "88%",
  },
  handleZone: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    minHeight: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  title: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: -0.3,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  list: { paddingBottom: spacing.md, gap: spacing.sm },
  card: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  cardPressed: { opacity: 0.92, borderColor: colors.navy },
  resumeCard: {
    borderColor: colors.primary,
    backgroundColor: "#FEF2F2",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E8EEF9",
    alignItems: "center",
    justifyContent: "center",
  },
  resumeIcon: { backgroundColor: "#FDE8EA" },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  cardDesc: { color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },
});
