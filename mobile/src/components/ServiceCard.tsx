import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mediaUrl } from "../api/client";
import { ServiceListItem } from "../api/types";
import { colors, radii, spacing } from "../theme";

type Props = {
  item: ServiceListItem;
  onPress?: () => void;
};

export function ServiceCard({ item, onPress }: Props) {
  const image = mediaUrl(item.coverPhoto?.url);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="construct-outline" size={28} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.description}
        </Text>
        {item.provider.verified ? (
          <View style={styles.verified}>
            <Ionicons name="shield-checkmark" size={12} color={colors.success} />
            <Text style={styles.verifiedText}>{item.provider.displayName}</Text>
          </View>
        ) : (
          <Text style={styles.provider}>{item.provider.displayName}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginRight: spacing.md,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  image: { width: "100%", height: 120 },
  placeholder: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing.md, gap: 4 },
  title: { color: colors.navy, fontWeight: "700", fontSize: 14 },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  provider: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  verifiedText: { color: colors.navy, fontSize: 11, fontWeight: "600" },
});
