import { AccountStatus, Prisma, SystemRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, forbidden, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { changePassword } from "../users/users.service";
import { logAdminAction } from "./admin.shared";

function escapeCsv(value: string | null | undefined) {
  const raw = value ?? "";
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export async function getMyAdminProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      systemRole: true,
      accountStatus: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  if (!user) throw notFound("Profil introuvable");
  if (
    user.systemRole !== SystemRole.ADMIN &&
    user.systemRole !== SystemRole.SUPER_ADMIN
  ) {
    throw forbidden("Accès réservé aux administrateurs");
  }
  return user;
}

export async function changeMyAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  return changePassword(userId, currentPassword, newPassword);
}

export async function listMySessions(userId: string) {
  return prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
    select: {
      id: true,
      deviceName: true,
      userAgent: true,
      ipAddress: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export async function revokeMySession(userId: string, sessionId: string) {
  const session = await prisma.refreshToken.findFirst({
    where: { id: sessionId, userId, revokedAt: null },
  });
  if (!session) throw notFound("Session introuvable");

  await prisma.refreshToken.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
  return { message: "Session révoquée." };
}

export async function listAuthEvents(query: {
  page: number;
  limit: number;
  success?: boolean;
  eventType?: string;
  from?: string;
  to?: string;
}) {
  const { page, limit, skip } = getPagination(query);
  const createdAt: Prisma.DateTimeFilter = {};
  if (query.from) createdAt.gte = new Date(query.from);
  if (query.to) createdAt.lte = new Date(query.to);

  const where: Prisma.AuthEventWhereInput = {
    ...(query.success !== undefined ? { success: query.success } : {}),
    ...(query.eventType
      ? { eventType: { contains: query.eventType, mode: "insensitive" } }
      : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.authEvent.count({ where }),
    prisma.authEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    }),
  ]);

  return buildPaginatedResult(rows, total, page, limit);
}

export async function exportAuditLogCsv(query: {
  adminId?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  const createdAt: Prisma.DateTimeFilter = {};
  if (query.from) createdAt.gte = new Date(query.from);
  if (query.to) createdAt.lte = new Date(query.to);

  const where: Prisma.AdminActionWhereInput = {
    ...(query.adminId ? { adminId: query.adminId } : {}),
    ...(query.action
      ? { action: { contains: query.action, mode: "insensitive" } }
      : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  };

  const rows = await prisma.adminAction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      admin: { select: { fullName: true, email: true } },
    },
  });

  const header = "id,admin,action,cible_type,cible_id,motif,date\n";
  const lines = rows.map((row) =>
    [
      row.id,
      escapeCsv(row.admin.fullName),
      row.action,
      row.targetType,
      row.targetId,
      escapeCsv(row.reason),
      row.createdAt.toISOString(),
    ].join(",")
  );
  return header + lines.join("\n");
}
