import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { unauthorized } from "../utils/errors";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(unauthorized("Jeton d'accès manquant"));
    return;
  }

  try {
    const token = header.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      phone: payload.phone,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
