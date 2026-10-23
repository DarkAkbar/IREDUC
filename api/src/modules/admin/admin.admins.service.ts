import { SystemRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, conflict, forbidden, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { hashPassword } from "../../utils/password";
import { logAdminAction } from "./admin.shared";

export async function listAdmins(query: { page: number; limit: number }) {
  const { page, limit, skip } = getPagination(query);
  const where = {
    systemRole: { in: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN] },
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
        systemRole: true,
        accountStatus: true,
        createdAt: true,
      },
    }),
  ]);

  return buildPaginatedResult(rows, total, page, limit);
}

export async function createAdmin(
  actorId: string,
  input: { fullName: string; email: string; temporaryPassword: string }
) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw conflict("Un compte existe déjà avec cet e-mail");
  }

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      passwordHash: await hashPassword(input.temporaryPassword),
      systemRole: SystemRole.ADMIN,
      emailVerified: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      systemRole: true,
      accountStatus: true,
      createdAt: true,
    },
  });

  await logAdminAction(actorId, "USER", user.id, "CREATE_ADMIN");

  return {
    ...user,
    temporaryPassword: input.temporaryPassword,
    message: "Compte administrateur créé avec un mot de passe temporaire.",
  };
}

export async function updateAdminRole(
  actor: { id: string; role: SystemRole },
  targetId: string,
  role: "ADMIN" | "USER"
) {
  if (actor.role !== SystemRole.SUPER_ADMIN) {
    throw forbidden("Réservé au super administrateur");
  }
  if (targetId === actor.id) {
    throw badRequest("Vous ne pouvez pas modifier votre propre rôle");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw notFound("Utilisateur introuvable");

  if (target.systemRole === SystemRole.SUPER_ADMIN) {
    throw forbidden("Le rôle SUPER_ADMIN ne peut pas être modifié ici");
  }

  const nextRole = role === "ADMIN" ? SystemRole.ADMIN : SystemRole.USER;
  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { systemRole: nextRole },
    select: {
      id: true,
      fullName: true,
      email: true,
      systemRole: true,
      accountStatus: true,
    },
  });

  await logAdminAction(
    actor.id,
    "USER",
    targetId,
    role === "ADMIN" ? "PROMOTE_ADMIN" : "DEMOTE_ADMIN"
  );

  return updated;
}
