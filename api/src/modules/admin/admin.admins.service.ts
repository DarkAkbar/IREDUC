import { AccountStatus, SystemRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, conflict, forbidden, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { hashPassword } from "../../utils/password";
import {
  normalizeOptionalEmail,
  normalizePhone,
} from "../../utils/phone";
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
  input: {
    fullName: string;
    phone: string;
    email?: string;
    temporaryPassword: string;
  }
) {
  const phone = normalizePhone(input.phone);
  const email = normalizeOptionalEmail(input.email ?? null);

  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    throw conflict("Ce numéro est déjà utilisé", "PHONE_TAKEN");
  }
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw conflict("Cette adresse e-mail est déjà utilisée", "EMAIL_TAKEN");
    }
  }

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      phone,
      email,
      passwordHash: await hashPassword(input.temporaryPassword),
      systemRole: SystemRole.ADMIN,
      emailVerified: Boolean(email),
      phoneVerified: true,
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
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

export async function updateAdminStatus(
  actor: { id: string; role: SystemRole },
  targetId: string,
  status: AccountStatus
) {
  if (actor.role !== SystemRole.SUPER_ADMIN) {
    throw forbidden("Réservé au super administrateur");
  }
  if (actor.id === targetId) {
    throw badRequest("Vous ne pouvez pas modifier votre propre statut");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw notFound("Administrateur introuvable");
  if (
    target.systemRole !== SystemRole.ADMIN &&
    target.systemRole !== SystemRole.SUPER_ADMIN
  ) {
    throw badRequest("La cible n'est pas un administrateur");
  }
  if (target.systemRole === SystemRole.SUPER_ADMIN) {
    throw forbidden("Impossible de suspendre un super administrateur");
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
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
      where: { userId: targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await logAdminAction(
    actor.id,
    "USER",
    targetId,
    status === AccountStatus.SUSPENDED ? "SUSPEND_ADMIN" : "REACTIVATE_ADMIN"
  );

  return updated;
}
