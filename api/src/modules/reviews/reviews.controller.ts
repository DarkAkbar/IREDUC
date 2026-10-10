import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as reviewsService from "./reviews.service";

function requireUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewsService.createReview(requireUserId(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listForService(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewsService.listServiceReviews(
      getParam(req, "id"),
      req.query as never
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
