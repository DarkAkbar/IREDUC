import { NextFunction, Request, Response } from "express";
import { badRequest, unauthorized } from "../../utils/errors";
import * as providersService from "./providers.service";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw unauthorized();
  }
  return req.user.id;
}

export async function createProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await providersService.createProvider(requireUserId(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMyProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await providersService.getMyProvider(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateMyProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await providersService.updateMyProvider(requireUserId(req), req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function submitMyProvider(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await providersService.submitMyProvider(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function withdrawMyProvider(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await providersService.withdrawMyProvider(requireUserId(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw badRequest("Un fichier est requis");
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await providersService.addDocument(
      requireUserId(req),
      req.body.docType,
      fileUrl
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function uploadLogo(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw badRequest("Un fichier logo est requis");
    }
    if (req.file.mimetype === "application/pdf") {
      throw badRequest("Le logo doit être une image (jpg ou png)");
    }
    const result = await providersService.updateLogo(
      requireUserId(req),
      req.file.filename
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
