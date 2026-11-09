import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
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
  /**
   * URL de couverture du premier service (même champ que ServiceCard :
   * mediaUrl(item.coverPhoto?.url)). Null si aucun service n'a d'image.
   */
  coverUri: string | null;
};

type Props = {
  categories: ServiceCategoryCarouselItem[];
  onCategoryPress?: (category: ServiceCategoryCarouselItem) => void;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  seeAllIcon?: keyof typeof Ionicons.glyphMap;
};

function CategoryCoverCard({
  item,
  width,
  height,
  onPress,
}: {
  item: ServiceCategoryCarouselItem;
  width: number;
  height: number;
  onPress?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const coverUri = item.coverUri;
  const showImage = Boolean(coverUri) && !failed;
  const iconName = CATEGORY_ICONS[item.slug] ?? ("briefcase-outline" as const);

  return (
    <Pressable
      style={[styles.card, { width, height }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Catégorie ${item.name}`}
    >
      {showImage ? (
        <Image
          source={{ uri: coverUri! }}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
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
  );
}

export function ServiceCategoryCarousel({
  categories,
  onCategoryPress,
  onSeeAll,
  seeAllLabel,
  seeAllIcon,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.round(screenWidth * 0.6);
  const itemSize = cardWidth + CARD_GAP;
  const initialIndex = categories.length >= 3 ? 1 : 0;
  const scrollX = useRef(new Animated.Value(initialIndex * itemSize)).current;

  useEffect(() => {
    if (!__DEV__ || categories.length === 0) return;
    // Diagnostic Bug 1 : la catégorie n'a pas de champ image ;
    // coverUri = coverPhoto du 1er service (même champ que ServiceCard).
    console.log("[ServiceCategoryCarousel] sample", {
      name: categories[0].name,
      categoryOwnImage: null,
      coverUri: categories[0].coverUri,
      serviceCount: categories[0].serviceCount,
      all: categories.map((c) => ({ name: c.name, coverUri: c.coverUri })),
    });
  }, [categories]);

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
        seeAllLabel={seeAllLabel}
        seeAllIcon={seeAllIcon}
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

          return (
            <Animated.View
              style={{
                width: itemSize,
                opacity,
                transform: [{ scale }, { translateY }],
              }}
            >
              <CategoryCoverCard
                key={`${item.id}:${item.coverUri ?? "none"}`}
                item={item}
                width={cardWidth}
                height={CARD_HEIGHT}
                onPress={
                  onCategoryPress ? () => onCategoryPress(item) : undefined
                }
              />
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
  /** Dégradé sombre en bas pour lisibilité du titre (comme Maison). */
  cardScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
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
