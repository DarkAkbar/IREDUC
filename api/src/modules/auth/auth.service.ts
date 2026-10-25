import { AccountStatus, TokenPurpose } from "@prisma/client";
import { AUTH_CONFIG, env } from "../../config/env";
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
import { toPublicUser } from "./auth.mapper";

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
  email: string,
  role: Parameters<typeof signAccessToken>[0]["role"]
) {
  const accessToken = signAccessToken({ sub: userId, email, role });
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
  email: string;
  password: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw conflict("Cette adresse e-mail est déjà utilisée", "EMAIL_TAKEN");
  }

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      passwordHash: await hashPassword(input.password),
      emailVerified: Boolean(env.DEV_AUTO_VERIFY_EMAIL),
    },
    include: { providerProfile: true },
  });

  if (env.DEV_AUTO_VERIFY_EMAIL) {
    logger.info(
      `[DEV_AUTO_VERIFY_EMAIL] Compte ${user.email} marqué comme vérifié automatiquement`
    );
    return {
      message: "Inscription réussie. Compte vérifié automatiquement (dev).",
      emailSent: false,
      autoVerified: true,
      user: toPublicUser(user),
    };
  }

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
    logger.error("Échec envoi e-mail de vérification après inscription", error);
  }

  return {
    message: emailSent
      ? "Inscription réussie. Vérifiez votre e-mail pour activer le compte."
      : "Compte créé, mais l'e-mail n'a pas pu être envoyé",
    emailSent,
    autoVerified: false,
    user: toPublicUser(user),
  };
}

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

  // Réponse neutre pour éviter l'énumération d'e-mails
  if (!user || user.emailVerified) {
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

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
    include: { providerProfile: true },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized("E-mail ou mot de passe incorrect", "INVALID_CREDENTIALS");
  }

  if (user.accountStatus === AccountStatus.SUSPENDED) {
    throw forbidden("Ce compte est suspendu", "ACCOUNT_SUSPENDED");
  }

  const tokens = await issueTokenPair(user.id, user.email, user.systemRole);

  return {
    ...tokens,
    user: toPublicUser(user),
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

  if (user) {
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
