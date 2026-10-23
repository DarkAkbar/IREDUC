import { AccountStatus, Prisma, SystemRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, forbidden, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { logAdminAction } from "./admin.shared";

export async function listUsers(
  query: {
    page: number;
    limit: number;
    search?: string;
    role?: SystemRole;
    status?: AccountStatus;
  }
) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { systemRole: query.role } : {}),
    ...(query.status ? { accountStatus: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        systemRole: true,
        accountStatus: true,
        emailVerified: true,
        createdAt: true,
        providerProfile: {
          select: { id: true, displayName: true, reviewStatus: true },
        },
      },
    }),
  ]);

  return buildPaginatedResult(rows, total, page, limit);
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      whatsapp: true,
      systemRole: true,
      accountStatus: true,
      emailVerified: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      providerProfile: true,
      ownedProperties: {
        select: { id: true, title: true, status: true },
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      requests: {
        select: { id: true, number: true, status: true },
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) throw notFound("Utilisateur introuvable");
  return user;
}

export async function updateUserStatus(
  actor: { id: string; role: SystemRole },
  userId: string,
  status: AccountStatus,
  reason?: string
) {
  if (status === AccountStatus.SUSPENDED && !reason?.trim()) {
    throw badRequest("Le motif est obligatoire pour suspendre un compte");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw notFound("Utilisateur introuvable");

  if (target.id === actor.id) {
    throw badRequest("Vous ne pouvez pas modifier le statut de votre propre compte");
  }

  if (
    actor.role === SystemRole.ADMIN &&
    (target.systemRole === SystemRole.ADMIN ||
      target.systemRole === SystemRole.SUPER_ADMIN)
  ) {
    throw forbidden(
      "Un administrateur ne peut pas suspendre un ADMIN ou un SUPER_ADMIN"
    );
  }

  if (
    actor.role !== SystemRole.SUPER_ADMIN &&
    target.systemRole === SystemRole.SUPER_ADMIN
  ) {
    throw forbidden("Action réservée au super administrateur");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: status },
    select: {
      id: true,
      fullName: true,
      email: true,
      systemRole: true,
      accountStatus: true,
    },
  });

  if (status === AccountStatus.SUSPENDED) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await logAdminAction(
    actor.id,
    "USER",
    userId,
    status === AccountStatus.SUSPENDED ? "SUSPEND_USER" : "REACTIVATE_USER",
    reason
  );

  return updated;
}
