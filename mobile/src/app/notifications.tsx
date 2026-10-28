import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { NotificationItem } from "../api/types";
import { EmptyState } from "../components/list/EmptyState";
import { ErrorState } from "../components/list/ErrorState";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { Button } from "../components/ui/Button";
import { ListSkeleton } from "../components/ui/SkeletonLoader";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { colors, radii, spacing, typography } from "../theme";
import { formatRequestDate } from "../utils/dates";

function openNotification(item: NotificationItem, router: ReturnType<typeof useRouter>) {
  const data = item.data as
    | {
        conversationId?: string;
        requestId?: string;
        screen?: string;
      }
    | null
    | undefined;
  if (data?.screen === "partner-status") {
    router.push("/partner/status" as never);
    return;
  }
  if (data?.conversationId) {
    router.push({
      pathname: "/conversation/[id]",
      params: { id: data.conversationId },
    } as never);
    return;
  }
  if (data?.requestId) {
    router.push({
      pathname: "/request/[id]",
      params: { id: data.requestId },
    } as never);
    return;
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, requireAuth } = useRequireAuth();

  const query = useInfiniteQuery({
    queryKey: ["notifications"],
    enabled: isAuthenticated,
    queryFn: ({ pageParam }) =>
      fetchNotifications({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0;

  async function onPressItem(item: NotificationItem) {
    if (!item.readAt) {
      try {
        await markNotificationRead(item.id);
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        /* navigation still allowed */
      }
    }
    openNotification(item, router);
  }

  async function onMarkAll() {
    await markAllNotificationsRead();
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.headerRow}>
        <Text style={typography.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={() => void onMarkAll()}>
            <Text style={styles.markAll}>Tout marquer comme lu</Text>
          </Pressable>
        ) : null}
      </View>

      {!isAuthenticated ? (
        <EmptyState
          title="Connexion requise"
          message="Connectez-vous pour voir vos notifications."
          actionLabel="Se connecter"
          onAction={() => requireAuth("/notifications")}
        />
      ) : null}

      {isAuthenticated && query.isLoading ? <ListSkeleton /> : null}
      {isAuthenticated && query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : null}

      {isAuthenticated && !query.isLoading && !query.isError ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            <EmptyState
              title="Aucune notification"
              message="Vous serez informé des messages et des réponses à vos demandes."
            />
          }
          renderItem={({ item }) => {
            const unread = !item.readAt;
            return (
              <Pressable
                style={[styles.card, unread && styles.cardUnread]}
                onPress={() => void onPressItem(item)}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={
                      item.type.includes("MESSAGE")
                        ? "chatbubble-ellipses"
                        : "notifications"
                    }
                    size={20}
                    color={unread ? colors.primary : colors.navy}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, unread && styles.bold]}>
                    {item.title}
                  </Text>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.date}>
                    {formatRequestDate(item.createdAt)}
                  </Text>
                </View>
                {unread ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          }}
        />
      ) : null}

      {isAuthenticated && unreadCount > 0 ? (
        <View style={styles.footer}>
          <Button label="Tout marquer comme lu" variant="outline" onPress={() => void onMarkAll()} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  markAll: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: { backgroundColor: "#EEF3FF", borderColor: "#C5D4F5" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: colors.navy, fontWeight: "700", fontSize: 14 },
  bold: { fontWeight: "800" },
  body: { color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  footer: { padding: spacing.lg },
});
