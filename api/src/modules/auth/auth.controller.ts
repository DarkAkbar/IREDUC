import { NextFunction, Request, Response } from "express";
import {
  clearLoginFailures,
  isLoginBlocked,
  recordLoginFailure,
} from "../../utils/loginAttempts";
import { looksLikeEmail, normalizePhone } from "../../utils/phone";
import { AppError } from "../../utils/errors";
import * as authService from "./auth.service";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip ?? "unknown";
}

function normalizeIdentifierKey(identifier: string): string {
  const raw = identifier.trim();
  if (looksLikeEmail(raw)) {
    return `email:${raw.toLowerCase()}`;
  }
  try {
    return `phone:${normalizePhone(raw)}`;
  } catch {
    return `raw:${raw.toLowerCase()}`;
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyEmail(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendVerification(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const ip = clientIp(req);
  const identifier = String(req.body.identifier ?? "");
  const key = normalizeIdentifierKey(identifier);

  try {
    if (isLoginBlocked(ip, key)) {
      res.status(429).json({
        message: "Trop de tentatives. Réessayez dans quelques minutes.",
        code: "RATE_LIMITED",
      });
      return;
    }

    const result = await authService.login({
      identifier,
      password: req.body.password,
    });
    clearLoginFailures(ip, result._loginKey);
    const { _loginKey: _, ...body } = result;
    res.status(200).json(body);
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === "INVALID_CREDENTIALS"
    ) {
      recordLoginFailure(ip, key);
    }
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.logout(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
