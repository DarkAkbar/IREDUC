import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mediaUrl } from "../../api/client";
import { MediaItem } from "../../api/types";
import { colors, radii, spacing } from "../../theme";

type Props = {
  photos: MediaItem[];
  videos?: MediaItem[];
  tab: "photos" | "video" | "about";
  onTabChange: (tab: "photos" | "video" | "about") => void;
  index: number;
  onIndexChange: (index: number) => void;
  showAboutTab?: boolean;
};

export function DetailGallery({
  photos,
  videos = [],
  tab,
  onTabChange,
  index,
  onIndexChange,
  showAboutTab = false,
}: Props) {
  const gallery = tab === "video" ? videos : photos;
  const current = gallery[index] ?? gallery[0];
  const thumbs = gallery.slice(0, 3);
  const remaining = Math.max(0, gallery.length - 3);

  return (
    <View>
      <View style={styles.tabs}>
        <Tab
          active={tab === "photos"}
          icon="images-outline"
          label={`Photos (${photos.length})`}
          onPress={() => {
            onTabChange("photos");
            onIndexChange(0);
          }}
        />
        <Tab
          active={tab === "video"}
          icon="play-circle-outline"
          label={`Vidéo (${videos.length})`}
          onPress={() => {
            onTabChange("video");
            onIndexChange(0);
          }}
        />
        {showAboutTab ? (
          <Tab
            active={tab === "about"}
            icon="information-circle-outline"
            label="À propos"
            onPress={() => onTabChange("about")}
          />
        ) : null}
      </View>

      {tab !== "about" ? (
        <View style={styles.galleryRow}>
          <View style={styles.mainWrap}>
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
              <Ionicons name="camera-outline" size={12} color={colors.white} />
              <Text style={styles.counterText}>
                {gallery.length ? `${index + 1}/${gallery.length}` : "0/0"}
              </Text>
            </View>
            {gallery.length > 1 ? (
              <>
                <Pressable
                  style={[styles.nav, styles.navLeft]}
                  onPress={() =>
                    onIndexChange((index - 1 + gallery.length) % gallery.length)
                  }
                >
                  <Ionicons name="chevron-back" size={18} color={colors.navy} />
                </Pressable>
                <Pressable
                  style={[styles.nav, styles.navRight]}
                  onPress={() => onIndexChange((index + 1) % gallery.length)}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.navy} />
                </Pressable>
              </>
            ) : null}
            {current?.caption ? (
              <Text style={styles.caption} numberOfLines={1}>
                {current.caption}
              </Text>
            ) : null}
          </View>

          <View style={styles.thumbsCol}>
            {thumbs.map((m, i) => {
              const isLast = i === 2 && remaining > 0;
              return (
                <Pressable key={m.id} onPress={() => onIndexChange(i)} style={styles.thumbWrap}>
                  <Image
                    source={{ uri: mediaUrl(m.url) ?? undefined }}
                    style={[styles.thumb, index === i && styles.thumbActive]}
                    contentFit="cover"
                  />
                  {m.caption && !isLast ? (
                    <Text style={styles.thumbCaption} numberOfLines={1}>
                      {m.caption}
                    </Text>
                  ) : null}
                  {isLast ? (
                    <View style={styles.moreOverlay}>
                      <Text style={styles.moreText}>
                        +{remaining} Voir toutes les photos
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Tab({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <Ionicons name={icon} size={16} color={active ? colors.primary : colors.textMuted} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {active ? <View style={styles.tabUnderline} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: { paddingBottom: spacing.sm, alignItems: "center", gap: 4 },
  tabLabel: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
  tabLabelActive: { color: colors.primary },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
  },
  galleryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 220,
  },
  mainWrap: {
    flex: 1.6,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.skeleton,
  },
  mainImage: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  counter: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  counterText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  nav: {
    position: "absolute",
    top: "42%",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: { left: spacing.sm },
  navRight: { right: spacing.sm },
  caption: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "600",
  },
  thumbsCol: { flex: 1, gap: spacing.sm },
  thumbWrap: {
    flex: 1,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.skeleton,
  },
  thumb: { width: "100%", height: "100%" },
  thumbActive: { borderWidth: 2, borderColor: colors.primary },
  thumbCaption: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.45)",
    fontSize: 9,
    fontWeight: "600",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  moreText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
});
