import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as conversationsService from "./conversations.service";

function requireUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationsService.createOrReuse(
      requireUserId(req),
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationsService.listConversations(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationsService.listMessages(
      requireUserId(req),
      getParam(req, "id"),
      req.query as never
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationsService.sendMessage(
      requireUserId(req),
      getParam(req, "id"),
      req.body.content
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationsService.markRead(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function whatsappLink(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationsService.getWhatsappLink(
      requireUserId(req),
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
