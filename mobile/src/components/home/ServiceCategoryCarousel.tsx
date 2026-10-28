import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
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

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
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
                <View style={styles.iconWrap}>
                  <Ionicons name={iconName} size={32} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.cardCount}>
                  {item.serviceCount} service
                  {item.serviceCount > 1 ? "s" : ""}
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
  section: { marginTop: spacing.xl },
  carouselScroll: { flexGrow: 0, flexShrink: 0 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
  },
  cardCount: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
});
