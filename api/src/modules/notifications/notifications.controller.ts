import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as notificationsService from "./notifications.service";

function requireUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.listNotifications(
      requireUserId(req),
      req.query as never
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.markAsRead(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.markAllAsRead(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
