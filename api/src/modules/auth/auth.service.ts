import { AccountStatus, TokenPurpose } from "@prisma/client";
import { AUTH_CONFIG } from "../../config/env";
import { prisma } from "../../config/prisma";
import { getMailService } from "../../mail";
import {
  generateEmailCode,
  generateOpaqueToken,
  hashToken,
} from "../../utils/crypto";
import {
  badRequest,
  conflict,
  forbidden,
  unauthorized,
} from "../../utils/errors";
import { signAccessToken } from "../../utils/jwt";
import { logger } from "../../utils/logger";
import { hashPassword, verifyPassword } from "../../utils/password";
import {
  looksLikeEmail,
  normalizeOptionalEmail,
  normalizePhone,
} from "../../utils/phone";
import { toPublicUser } from "./auth.mapper";

const INVALID_CREDENTIALS_MESSAGE = "Identifiant ou mot de passe incorrect";

function refreshExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + AUTH_CONFIG.refreshTokenTtlDays);
  return date;
}

function userTokenExpiryDate(): Date {
  const date = new Date();
  date.setHours(date.getHours() + AUTH_CONFIG.userTokenTtlHours);
  return date;
}

async function createUserToken(userId: string, purpose: TokenPurpose) {
  const token = generateOpaqueToken();
  const code =
    purpose === TokenPurpose.VERIFY_EMAIL ? generateEmailCode() : null;

  await prisma.userToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(token),
      codeHash: code ? hashToken(code) : null,
      expiresAt: userTokenExpiryDate(),
    },
  });

  return { token, code };
}

async function issueTokenPair(
  userId: string,
  phone: string,
  email: string | null,
  role: Parameters<typeof signAccessToken>[0]["role"]
) {
  const accessToken = signAccessToken({ sub: userId, phone, email, role });
  const refreshToken = generateOpaqueToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  fullName: string;
  phone: string;
  password: string;
  email?: string | null;
}) {
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
      passwordHash: await hashPassword(input.password),
      whatsapp: phone,
    },
    include: { providerProfile: true },
  });

  const tokens = await issueTokenPair(
    user.id,
    user.phone,
    user.email,
    user.systemRole
  );

  return {
    message: "Inscription réussie.",
    ...tokens,
    user: toPublicUser(user),
  };
}

/** Vérification e-mail conservée (désactivée côté parcours si REQUIRE_ACCOUNT_VERIFICATION=false). */
export async function verifyEmail(input: {
  token?: string;
  email?: string;
  code?: string;
}) {
  let record =
    input.token != null
      ? await prisma.userToken.findFirst({
          where: {
            tokenHash: hashToken(input.token),
            purpose: TokenPurpose.VERIFY_EMAIL,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
        })
      : null;

  if (!record && input.email && input.code) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });
    if (user) {
      record = await prisma.userToken.findFirst({
        where: {
          userId: user.id,
          purpose: TokenPurpose.VERIFY_EMAIL,
          codeHash: hashToken(input.code),
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
    }
  }

  if (!record) {
    throw badRequest(
      "Code ou jeton de vérification invalide ou expiré",
      undefined,
      "INVALID_TOKEN"
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
    prisma.userToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { message: "Adresse e-mail vérifiée avec succès." };
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || user.emailVerified || !user.email) {
    return {
      message: "Si un compte non vérifié existe, un e-mail a été envoyé.",
      emailSent: false,
    };
  }

  await prisma.userToken.updateMany({
    where: {
      userId: user.id,
      purpose: TokenPurpose.VERIFY_EMAIL,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  const { token, code } = await createUserToken(
    user.id,
    TokenPurpose.VERIFY_EMAIL
  );

  let emailSent = true;
  try {
    await getMailService().sendVerificationEmail(
      user.email,
      token,
      code ?? undefined
    );
  } catch (error) {
    emailSent = false;
    logger.error("Échec renvoi e-mail de vérification", error);
  }

  return {
    message: emailSent
      ? "Si un compte non vérifié existe, un e-mail a été envoyé."
      : "Impossible d'envoyer l'e-mail de vérification pour le moment.",
    emailSent,
  };
}

export async function resolveLoginIdentifier(identifier: string): Promise<{
  normalizedKey: string;
  user: Awaited<ReturnType<typeof prisma.user.findFirst>>;
}> {
  const raw = identifier.trim();
  if (looksLikeEmail(raw)) {
    const email = raw.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { providerProfile: true },
    });
    return { normalizedKey: `email:${email}`, user };
  }

  const phone = normalizePhone(raw);
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { providerProfile: true },
  });
  return { normalizedKey: `phone:${phone}`, user };
}

export async function login(input: { identifier: string; password: string }) {
  let normalizedKey = input.identifier.trim().toLowerCase();
  let user = null as Awaited<ReturnType<typeof prisma.user.findFirst>>;

  try {
    const resolved = await resolveLoginIdentifier(input.identifier);
    normalizedKey = resolved.normalizedKey;
    user = resolved.user;
  } catch {
    // Numéro invalide → même message que mauvais mot de passe
    throw unauthorized(INVALID_CREDENTIALS_MESSAGE, "INVALID_CREDENTIALS");
  }

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized(INVALID_CREDENTIALS_MESSAGE, "INVALID_CREDENTIALS");
  }

  if (user.accountStatus === AccountStatus.SUSPENDED) {
    throw forbidden("Ce compte est suspendu", "ACCOUNT_SUSPENDED");
  }

  const tokens = await issueTokenPair(
    user.id,
    user.phone,
    user.email,
    user.systemRole
  );

  return {
    ...tokens,
    user: toPublicUser(user),
    _loginKey: normalizedKey,
  };
}

export async function refresh(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { include: { providerProfile: true } },
    },
  });

  if (!stored) {
    throw unauthorized("Jeton de rafraîchissement invalide", "INVALID_REFRESH_TOKEN");
  }

  if (stored.user.accountStatus === AccountStatus.SUSPENDED) {
    throw forbidden("Ce compte est suspendu", "ACCOUNT_SUSPENDED");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair(
    stored.user.id,
    stored.user.phone,
    stored.user.email,
    stored.user.systemRole
  );

  return {
    ...tokens,
    user: toPublicUser(stored.user),
  };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return { message: "Déconnexion réussie." };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (user?.email) {
    await prisma.userToken.updateMany({
      where: {
        userId: user.id,
        purpose: TokenPurpose.RESET_PASSWORD,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const { token } = await createUserToken(
      user.id,
      TokenPurpose.RESET_PASSWORD
    );
    await getMailService().sendPasswordResetEmail(user.email, token);
  }

  return {
    message: "Si un compte existe, un e-mail de réinitialisation a été envoyé.",
  };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.userToken.findFirst({
    where: {
      tokenHash,
      purpose: TokenPurpose.RESET_PASSWORD,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw badRequest(
      "Jeton de réinitialisation invalide ou expiré",
      undefined,
      "INVALID_TOKEN"
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.userToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { message: "Mot de passe mis à jour avec succès." };
}
