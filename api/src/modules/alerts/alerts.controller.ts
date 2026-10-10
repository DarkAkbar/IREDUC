import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as alertsService from "./alerts.service";

function requireUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alertsService.createAlert(requireUserId(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alertsService.listAlerts(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alertsService.updateAlert(
      requireUserId(req),
      getParam(req, "id"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alertsService.deleteAlert(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
