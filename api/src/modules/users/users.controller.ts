import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import * as usersService from "./users.service";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw unauthorized();
  }
  return req.user.id;
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.getMe(requireUserId(req));
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
