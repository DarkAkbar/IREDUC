import {
  AccountStatus,
  ListingStatus,
  RequestStatus,
  SystemRole,
} from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { prisma } from "../../config/prisma";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from "../../utils/errors";
import { hashToken } from "../../utils/crypto";
import { hashPassword, verifyPassword } from "../../utils/password";
import {
  normalizeOptionalEmail,
  normalizePhone,
} from "../../utils/phone";
import { toPublicUser } from "../auth/auth.mapper";

function countsByStatus<T extends string>(
  rows: { status: T; _count: { _all: number } }[],
  statuses: readonly T[]
): Record<T, number> {
  const result = Object.fromEntries(statuses.map((s) => [s, 0])) as Record<
    T,
    number
  >;
  for (const row of rows) {
    result[row.status] = row._count._all;
  }
  return result;
}

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

const REQUEST_STATUSES = [
  RequestStatus.PENDING,
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
  RequestStatus.CANCELLED,
  RequestStatus.COMPLETED,
] as const;

const LISTING_STATUSES = [
  ListingStatus.DRAFT,
  ListingStatus.PENDING,
  ListingStatus.APPROVED,
  ListingStatus.REJECTED,
  ListingStatus.ARCHIVED,
] as const;

export async function getSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { providerProfile: true },
  });
  if (!user) {
    throw notFound("Utilisateur introuvable");
  }

  const [requestGroups, favoritesCount, alertsCount, unreadNotifications] =
    await Promise.all([
      prisma.request.groupBy({
        by: ["status"],
        where: { requesterId: userId },
        _count: { _all: true },
      }),
      prisma.favorite.count({ where: { userId } }),
      prisma.alert.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

  const participantConversationIds = (
    await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    })
  ).map((p) => p.conversationId);

  const unreadMessages =
    participantConversationIds.length === 0
      ? 0
      : await prisma.message.count({
          where: {
            conversationId: { in: participantConversationIds },
            senderId: { not: userId },
            readAt: null,
          },
        });

  const base = {
    requests: countsByStatus(requestGroups, REQUEST_STATUSES),
    requestsTotal: requestGroups.reduce((sum, r) => sum + r._count._all, 0),
    favorites: favoritesCount,
    alerts: alertsCount,
    unreadMessages,
    unreadNotifications,
    partner: null as null | {
      reviewStatus: string;
      rejectionReason: string | null;
      listings: Record<(typeof LISTING_STATUSES)[number], number>;
      listingsTotal: number;
      pendingReceivedRequests: number;
    },
  };

  if (!user.providerProfile) {
    return base;
  }

  const providerId = user.providerProfile.id;
  const [propertyGroups, serviceGroups, ownedPropertyIds, ownedServiceIds] =
    await Promise.all([
      prisma.property.groupBy({
        by: ["status"],
        where: { ownerId: userId },
        _count: { _all: true },
      }),
      prisma.service.groupBy({
        by: ["status"],
        where: { providerProfileId: providerId },
        _count: { _all: true },
      }),
      prisma.property.findMany({
        where: { ownerId: userId },
        select: { id: true },
      }),
      prisma.service.findMany({
        where: { providerProfileId: providerId },
        select: { id: true },
      }),
    ]);

  const listings = countsByStatus(
    [...propertyGroups, ...serviceGroups].reduce(
      (acc, row) => {
        const existing = acc.find((a) => a.status === row.status);
        if (existing) {
          existing._count._all += row._count._all;
        } else {
          acc.push({ status: row.status, _count: { _all: row._count._all } });
        }
        return acc;
      },
      [] as { status: ListingStatus; _count: { _all: number } }[]
    ),
    LISTING_STATUSES
  );

  const propertyIds = ownedPropertyIds.map((p) => p.id);
  const serviceIds = ownedServiceIds.map((s) => s.id);
  const pendingReceivedRequests = await prisma.request.count({
    where: {
      status: RequestStatus.PENDING,
      OR: [
        ...(propertyIds.length > 0
          ? [{ propertyId: { in: propertyIds } }]
          : []),
        ...(serviceIds.length > 0 ? [{ serviceId: { in: serviceIds } }] : []),
      ],
    },
  });

  return {
    ...base,
    partner: {
      reviewStatus: user.providerProfile.reviewStatus,
      rejectionReason: user.providerProfile.rejectionReason,
      listings,
      listingsTotal: Object.values(listings).reduce((a, b) => a + b, 0),
      pendingReceivedRequests,
    },
  };
}

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { providerProfile: true },
  });
  if (!user) {
    throw notFound("Utilisateur introuvable");
  }

  if (user.systemRole === SystemRole.SUPER_ADMIN) {
    throw forbidden(
      "Un compte super administrateur ne peut pas être supprimé",
      "SUPER_ADMIN_DELETE_FORBIDDEN"
    );
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized("Mot de passe incorrect", "INVALID_PASSWORD");
  }

  const suffix = createHash("sha256")
    .update(userId + randomBytes(8).toString("hex"))
    .digest("hex")
    .slice(0, 10);
  const freedPhone = `+243000${suffix.slice(0, 7)}`;
  const randomHash = await hashPassword(randomBytes(32).toString("hex"));

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.userToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await tx.request.updateMany({
      where: {
        requesterId: userId,
        status: {
          in: [RequestStatus.PENDING, RequestStatus.APPROVED],
        },
      },
      data: { status: RequestStatus.CANCELLED },
    });

    await tx.property.updateMany({
      where: {
        ownerId: userId,
        status: { not: ListingStatus.ARCHIVED },
      },
      data: { status: ListingStatus.ARCHIVED },
    });

    if (user.providerProfile) {
      await tx.service.updateMany({
        where: {
          providerProfileId: user.providerProfile.id,
          status: { not: ListingStatus.ARCHIVED },
        },
        data: { status: ListingStatus.ARCHIVED },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        fullName: "Compte supprimé",
        phone: freedPhone,
        email: null,
        whatsapp: null,
        avatarUrl: null,
        passwordHash: randomHash,
        accountStatus: AccountStatus.SUSPENDED,
        emailVerified: false,
        phoneVerified: false,
      },
    });
  });

  return { message: "Votre compte a été supprimé." };
}

export async function listSessions(
  userId: string,
  currentRefreshToken?: string | null
) {
  const currentHash = currentRefreshToken
    ? hashToken(currentRefreshToken)
    : null;

  const rows = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      deviceName: true,
      userAgent: true,
      ipAddress: true,
      lastUsedAt: true,
      createdAt: true,
      tokenHash: true,
    },
  });

  return {
    data: rows.map((row) => ({
      id: row.id,
      deviceName: row.deviceName ?? "Appareil inconnu",
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      lastUsedAt: row.lastUsedAt ?? row.createdAt,
      createdAt: row.createdAt,
      isCurrent: currentHash != null && row.tokenHash === currentHash,
    })),
  };
}

export async function revokeSession(
  userId: string,
  sessionId: string,
  currentRefreshToken?: string | null
) {
  const session = await prisma.refreshToken.findFirst({
    where: { id: sessionId, userId, revokedAt: null },
  });
  if (!session) {
    throw notFound("Session introuvable");
  }

  if (
    currentRefreshToken &&
    session.tokenHash === hashToken(currentRefreshToken)
  ) {
    throw badRequest(
      "Impossible de déconnecter la session actuelle depuis cet écran. Utilisez « Se déconnecter ».",
      undefined,
      "CURRENT_SESSION"
    );
  }

  await prisma.refreshToken.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  return { message: "Appareil déconnecté." };
}

export async function revokeOtherSessions(
  userId: string,
  currentRefreshToken?: string | null
) {
  if (!currentRefreshToken) {
    throw badRequest(
      "Jeton de session requis pour conserver l'appareil actuel",
      undefined,
      "REFRESH_TOKEN_REQUIRED"
    );
  }

  const currentHash = hashToken(currentRefreshToken);
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
      tokenHash: { not: currentHash },
    },
    data: { revokedAt: new Date() },
  });

  return {
    message: "Les autres appareils ont été déconnectés.",
    revokedCount: result.count,
  };
}
