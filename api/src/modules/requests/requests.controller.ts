import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as requestsService from "./requests.service";

function requireUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.createRequest(requireUserId(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.listMine(
      requireUserId(req),
      req.query as never
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listReceived(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.listReceived(
      requireUserId(req),
      req.query as never
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.getById(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function review(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.reviewRequest(
      requireUserId(req),
      getParam(req, "id"),
      req.body.decision,
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.cancelRequest(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.completeRequest(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function pay(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.payRequest(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function similar(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestsService.listSimilar(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
