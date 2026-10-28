import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../api/client";
import { fetchConversations } from "../api/conversations";
import { ConversationListItem } from "../api/types";
import { GuestPrompt } from "../components/GuestPrompt";
import { EmptyState } from "../components/list/EmptyState";
import { ErrorState } from "../components/list/ErrorState";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { ListSkeleton } from "../components/ui/SkeletonLoader";
import { useAuthStore } from "../store/authStore";
import { colors, radii, spacing, typography } from "../theme";

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function targetLabel(item: ConversationListItem) {
  if (item.property) return item.property.title;
  if (item.service) return item.service.title;
  if (item.request) return `Demande ${item.request.number}`;
  return "Conversation";
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const query = useQuery({
    queryKey: ["conversations"],
    enabled: isAuthenticated,
    queryFn: fetchConversations,
    refetchInterval: 15_000,
  });

  if (isHydrated && !isAuthenticated) {
    return (
      <GuestPrompt
        icon="chatbubble-ellipses-outline"
        title="Vos conversations"
        message="Connectez-vous pour échanger avec les propriétaires et prestataires."
        returnTo="/messages"
        showBack
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.padded}>
        <Text style={[typography.title, styles.title]}>Messages</Text>
        <Text style={styles.subtitle}>
          Vos conversations avec les propriétaires et prestataires.
        </Text>
      </View>

      {query.isLoading ? <ListSkeleton /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            {
              paddingBottom: spacing.xxl,
              paddingHorizontal: spacing.lg,
            },
            !(query.data?.length) && { flexGrow: 1 },
          ]}
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              fill
              title="Aucune conversation"
              message="Discutez depuis une fiche bien, un service ou une demande approuvée."
              actionLabel="Découvrir les biens"
              onAction={() => router.push("/properties" as never)}
            />
          }
          renderItem={({ item }) => {
            const avatar = mediaUrl(item.otherParticipant?.avatarUrl);
            const time = item.lastMessage?.createdAt ?? item.updatedAt;
            return (
              <Pressable
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: "/conversation/[id]",
                    params: { id: item.id },
                  } as never)
                }
              >
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={22} color={colors.navy} />
                  </View>
                )}
                <View style={styles.body}>
                  <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.otherParticipant?.fullName ?? "Interlocuteur"}
                    </Text>
                    <Text style={styles.time}>{formatMessageTime(time)}</Text>
                  </View>
                  <Text style={styles.target} numberOfLines={1}>
                    {targetLabel(item)}
                  </Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage?.content ?? "Aucun message pour le moment"}
                  </Text>
                </View>
                {item.unreadCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: { paddingHorizontal: 20 },
  title: { marginTop: spacing.sm },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: { flex: 1, color: colors.navy, fontWeight: "800", fontSize: 15 },
  time: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  target: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  preview: { color: colors.textMuted, fontSize: 13 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
});
