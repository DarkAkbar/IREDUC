import { api } from "./client";
import { NotificationItem, Paginated } from "./types";

export async function fetchNotifications(params?: {
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get<
    Paginated<NotificationItem> & { unreadCount: number }
  >("/notifications", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    },
  });
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch<NotificationItem>(
    `/notifications/${id}/read`
  );
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch<{ message: string; count: number }>(
    "/notifications/read-all"
  );
  return data;
}
