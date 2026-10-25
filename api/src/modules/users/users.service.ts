import { prisma } from "../../config/prisma";
import {
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from "../../utils/errors";
import { hashPassword, verifyPassword } from "../../utils/password";
import {
  normalizeOptionalEmail,
  normalizePhone,
} from "../../utils/phone";
import { toPublicUser } from "../auth/auth.mapper";

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { providerProfile: true },
  });
  if (!user) {
    throw notFound("Utilisateur introuvable");
  }
  return toPublicUser(user);
}

export async function updateMe(
  userId: string,
  data: {
    fullName?: string;
    phone?: string;
    email?: string | null;
    whatsapp?: string | null;
    avatarUrl?: string | null;
    currentPassword?: string;
  }
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw notFound("Utilisateur introuvable");
  }

  let phone = existing.phone;
  let phoneVerified = existing.phoneVerified;
  let email =
    data.email !== undefined
      ? normalizeOptionalEmail(data.email)
      : existing.email;

  if (data.phone !== undefined) {
    if (!data.currentPassword) {
      throw badRequest(
        "Le mot de passe actuel est requis pour changer de numéro",
        undefined,
        "PASSWORD_REQUIRED"
      );
    }
    if (!(await verifyPassword(data.currentPassword, existing.passwordHash))) {
      throw unauthorized("Mot de passe actuel incorrect", "INVALID_PASSWORD");
    }
    phone = normalizePhone(data.phone);
    if (phone !== existing.phone) {
      const taken = await prisma.user.findUnique({ where: { phone } });
      if (taken && taken.id !== userId) {
        throw conflict("Ce numéro est déjà utilisé", "PHONE_TAKEN");
      }
      phoneVerified = false;
    }
  }

  if (email && email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken && taken.id !== userId) {
      throw conflict("Cette adresse e-mail est déjà utilisée", "EMAIL_TAKEN");
    }
  }

  let whatsapp = data.whatsapp;
  if (whatsapp !== undefined && whatsapp !== null && whatsapp.trim()) {
    whatsapp = normalizePhone(whatsapp);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
      phone,
      phoneVerified,
      email,
      ...(data.whatsapp !== undefined ? { whatsapp } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
    },
    include: { providerProfile: true },
  });

  return toPublicUser(user);
}

export async function updateAvatar(userId: string, filename: string) {
  const avatarUrl = `/uploads/${filename}`;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    include: { providerProfile: true },
  });
  return toPublicUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw notFound("Utilisateur introuvable");
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw unauthorized("Mot de passe actuel incorrect", "INVALID_PASSWORD");
  }

  if (currentPassword === newPassword) {
    throw badRequest("Le nouveau mot de passe doit être différent de l'actuel");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return { message: "Mot de passe modifié avec succès." };
}
