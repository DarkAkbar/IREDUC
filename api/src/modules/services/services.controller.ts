import { NextFunction, Request, Response } from "express";
import { getParam } from "../../utils/params";
import { badRequest, unauthorized } from "../../utils/errors";
import * as servicesService from "./services.service";

function requireUser(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

function requireProvider(req: Request) {
  if (!req.providerProfile) {
    throw unauthorized("Profil partenaire requis");
  }
  return req.providerProfile;
}

export async function listPublic(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await servicesService.listPublicServices(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPublic(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await servicesService.getPublicService(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = requireProvider(req);
    const result = await servicesService.listMine(provider.id, req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    requireUser(req);
    const provider = requireProvider(req);
    const result = await servicesService.createService(provider.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = requireProvider(req);
    const result = await servicesService.updateService(
      provider.id,
      getParam(req, "id"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = requireProvider(req);
    const result = await servicesService.submitService(provider.id, getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function archive(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = requireProvider(req);
    const result = await servicesService.archiveService(
      provider.id,
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function addMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = requireProvider(req);
    if (!req.file) {
      throw badRequest("Un fichier est requis");
    }
    const result = await servicesService.addMedia(
      provider.id,
      getParam(req, "id"),
      req.file,
      req.body.caption
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = requireProvider(req);
    const result = await servicesService.updateMedia(
      provider.id,
      getParam(req, "id"),
      getParam(req, "mediaId"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = requireProvider(req);
    const result = await servicesService.deleteMedia(
      provider.id,
      getParam(req, "id"),
      getParam(req, "mediaId")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
