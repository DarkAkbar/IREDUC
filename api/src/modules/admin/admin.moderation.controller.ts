import { NextFunction, Request, Response } from "express";
import { getParam } from "../../utils/params";
import { unauthorized } from "../../utils/errors";
import * as moderationService from "./admin.moderation.service";

function requireAdmin(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function listProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await moderationService.listPendingProperties(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listServices(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await moderationService.listPendingServices(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listProviders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await moderationService.listPendingProviders(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function reviewProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const result = await moderationService.reviewProperty(
      admin.id,
      getParam(req, "id"),
      req.body.decision,
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function reviewService(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const result = await moderationService.reviewService(
      admin.id,
      getParam(req, "id"),
      req.body.decision,
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function reviewProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const result = await moderationService.reviewProvider(
      admin.id,
      getParam(req, "id"),
      req.body.decision,
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
