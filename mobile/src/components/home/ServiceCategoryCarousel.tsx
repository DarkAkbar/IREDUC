import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SectionHeader } from "../ui/SectionHeader";
import { colors, radii, spacing } from "../../theme";

const CARD_GAP = spacing.md;
const CARD_HEIGHT = 160;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  electricite: "flash-outline",
  plomberie: "water-outline",
  demenagement: "bus-outline",
  menuiserie: "hammer-outline",
  peinture: "color-palette-outline",
  decoration: "sparkles-outline",
  ameublement: "bed-outline",
  batiment: "business-outline",
  mecanique: "cog-outline",
};

export type ServiceCategoryCarouselItem = {
  id: string;
  name: string;
  slug: string;
  serviceCount: number;
  /** URLs d'images des services de la catégorie (déjà chargées). */
  imageUrls: string[];
};

type Props = {
  categories: ServiceCategoryCarouselItem[];
  onCategoryPress?: (category: ServiceCategoryCarouselItem) => void;
  onSeeAll?: () => void;
};

export function ServiceCategoryCarousel({
  categories,
  onCategoryPress,
  onSeeAll,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.round(screenWidth * 0.6);
  const itemSize = cardWidth + CARD_GAP;
  const initialIndex = categories.length >= 3 ? 1 : 0;
  const scrollX = useRef(new Animated.Value(initialIndex * itemSize)).current;

  const imagesKey = categories
    .map((c) => `${c.id}:${c.imageUrls.join(",")}`)
    .join("|");

  /** Choix aléatoire une seule fois par jeu de données (pas à chaque rendu). */
  const coverByCategoryId = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const category of categories) {
      const urls = category.imageUrls.filter(Boolean);
      map[category.id] =
        urls.length > 0
          ? urls[Math.floor(Math.random() * urls.length)]!
          : null;
    }
    return map;
    // imagesKey capture le contenu des URLs ; categories seul changerait de référence à chaque render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilisé via imagesKey
  }, [imagesKey]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View>
      <SectionHeader
        title="Services"
        subtitle="Toutes les catégories près de chez vous"
        icon="construct-outline"
        onSeeAll={onSeeAll}
      />
      <Animated.FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        style={styles.carouselScroll}
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemSize}
        decelerationRate="fast"
        bounces={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: itemSize,
          offset: itemSize * index,
          index,
        })}
        contentContainerStyle={{
          paddingHorizontal: (screenWidth - cardWidth) / 2,
          paddingBottom: spacing.sm,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * itemSize,
            index * itemSize,
            (index + 1) * itemSize,
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.65, 1, 0.65],
            extrapolate: "clamp",
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [12, 0, 12],
            extrapolate: "clamp",
          });
          const iconName =
            CATEGORY_ICONS[item.slug] ?? ("briefcase-outline" as const);
          const coverUri = coverByCategoryId[item.id];

          return (
            <Animated.View
              style={{
                width: itemSize,
                opacity,
                transform: [{ scale }, { translateY }],
              }}
            >
              <Pressable
                style={[styles.card, { width: cardWidth, height: CARD_HEIGHT }]}
                onPress={
                  onCategoryPress ? () => onCategoryPress(item) : undefined
                }
                accessibilityRole="button"
                accessibilityLabel={`Catégorie ${item.name}`}
              >
                {coverUri ? (
                  <Image
                    source={{ uri: coverUri }}
                    style={styles.cardImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.cardFallback}>
                    <Ionicons name={iconName} size={40} color={colors.white} />
                  </View>
                )}
                <View style={styles.cardScrim} pointerEvents="none" />
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselScroll: { flexGrow: 0, flexShrink: 0 },
  card: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  cardTitle: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 1,
  },
});
