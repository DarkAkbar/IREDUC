import jwt from "jsonwebtoken";
import { SystemRole } from "@prisma/client";
import { AUTH_CONFIG, env } from "../config/env";
import { unauthorized } from "./errors";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: SystemRole;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: AUTH_CONFIG.accessTokenTtl,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || !decoded.sub || !decoded.email || !decoded.role) {
      throw unauthorized("Jeton d'accès invalide", "INVALID_ACCESS_TOKEN");
    }
    return {
      sub: String(decoded.sub),
      email: String(decoded.email),
      role: decoded.role as SystemRole,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") {
      throw error;
    }
    throw unauthorized("Jeton d'accès invalide ou expiré", "INVALID_ACCESS_TOKEN");
  }
}
