import { prisma } from "../../config/prisma";
import { badRequest, notFound, unauthorized } from "../../utils/errors";
import { hashPassword, verifyPassword } from "../../utils/password";
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
    phone?: string | null;
    whatsapp?: string | null;
    avatarUrl?: string | null;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
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
