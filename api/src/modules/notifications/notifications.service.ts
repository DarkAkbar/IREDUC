import { prisma } from "../../config/prisma";
import { forbidden, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";

export async function listNotifications(
  userId: string,
  query: { page: number; limit: number }
) {
  const { page, limit, skip } = getPagination(query);
  const where = { userId };

  const [total, unreadCount, data] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    ...buildPaginatedResult(data, total, page, limit),
    unreadCount,
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) {
    throw notFound("Notification introuvable");
  }
  if (notification.userId !== userId) {
    throw forbidden("Accès interdit à cette notification");
  }

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { message: "Toutes les notifications ont été marquées comme lues.", count: result.count };
}
