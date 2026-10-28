import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ReactNode, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mediaUrl } from "../api/client";
import { MediaItem } from "../api/types";
import { colors, radii, spacing } from "../theme";

type Props = {
  photos: MediaItem[];
  height?: number;
  onPress?: () => void;
  topRight?: ReactNode;
};

const WIDTH = Dimensions.get("window").width - spacing.lg * 2;

export function MediaCarousel({ photos, height = 200, onPress, topRight }: Props) {
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);
  const items = photos.length > 0 ? photos : [];

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / WIDTH);
    if (next !== index) setIndex(next);
  }

  function go(delta: number) {
    const next = Math.max(0, Math.min(items.length - 1, index + delta));
    ref.current?.scrollTo({ x: next * WIDTH, animated: true });
    setIndex(next);
  }

  if (items.length === 0) {
    return (
      <Pressable onPress={onPress} style={[styles.wrap, { height }]}>
        <View style={[styles.slide, styles.placeholder]}>
          <Ionicons name="image-outline" size={36} color={colors.textMuted} />
        </View>
        {topRight}
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {items.map((photo) => {
          const uri = mediaUrl(photo.url);
          return (
            <Pressable key={photo.id} onPress={onPress} style={{ width: WIDTH, height }}>
              {uri ? (
                <Image source={{ uri }} style={styles.slide} contentFit="cover" />
              ) : (
                <View style={[styles.slide, styles.placeholder]} />
              )}
              {photo.caption ? (
                <View style={styles.caption}>
                  <Text style={styles.captionText} numberOfLines={1}>
                    {photo.caption}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {items.length > 1 ? (
        <>
          <Pressable style={[styles.arrow, styles.arrowLeft]} onPress={() => go(-1)}>
            <Ionicons name="chevron-back" size={18} color={colors.navy} />
          </Pressable>
          <Pressable style={[styles.arrow, styles.arrowRight]} onPress={() => go(1)}>
            <Ionicons name="chevron-forward" size={18} color={colors.navy} />
          </Pressable>
          <View style={styles.dots}>
            {items.map((photo, i) => (
              <View
                key={photo.id}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
        </>
      ) : null}

      {topRight}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: WIDTH,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.skeleton,
    alignSelf: "center",
  },
  slide: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  caption: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    maxWidth: "70%",
  },
  captionText: { color: colors.white, fontSize: 11, fontWeight: "600" },
  arrow: {
    position: "absolute",
    top: "45%",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: { left: spacing.sm },
  arrowRight: { right: spacing.sm },
  dots: {
    position: "absolute",
    bottom: spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    left: 0,
    right: 0,
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  dotActive: { backgroundColor: colors.primary },
});
