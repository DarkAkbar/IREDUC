import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as favoritesService from "./favorites.service";

function requireUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await favoritesService.addFavorite(requireUserId(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await favoritesService.listFavorites(
      requireUserId(req),
      (req.query as { type?: never }).type
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await favoritesService.removeFavorite(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
