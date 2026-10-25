import { NextFunction, Request, Response } from "express";
import { badRequest, unauthorized } from "../../utils/errors";
import * as usersService from "./users.service";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw unauthorized();
  }
  return req.user.id;
}

function currentRefreshToken(req: Request): string | null {
  const header = req.headers["x-refresh-token"];
  if (typeof header === "string" && header.trim()) return header.trim();
  if (typeof req.body?.refreshToken === "string") return req.body.refreshToken;
  return null;
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.getMe(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.getSummary(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.updateMe(requireUserId(req), req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.changePassword(
      requireUserId(req),
      req.body.currentPassword,
      req.body.newPassword
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw badRequest("Fichier avatar requis");
    }
    const result = await usersService.updateAvatar(
      requireUserId(req),
      req.file.filename
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await usersService.deleteAccount(
      requireUserId(req),
      req.body.password
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await usersService.listSessions(
      requireUserId(req),
      currentRefreshToken(req)
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await usersService.revokeSession(
      requireUserId(req),
      req.params.id as string,
      currentRefreshToken(req)
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function revokeOtherSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await usersService.revokeOtherSessions(
      requireUserId(req),
      currentRefreshToken(req)
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
