import { NextFunction, Request, Response } from "express";
import { getParam } from "../../utils/params";
import { badRequest, unauthorized } from "../../utils/errors";
import * as propertiesService from "./properties.service";

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
    const result = await propertiesService.listPublicProperties(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPublic(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await propertiesService.getPublicProperty(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const result = await propertiesService.listMine(user.id, req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const provider = requireProvider(req);
    const result = await propertiesService.createProperty(
      user.id,
      provider.id,
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const result = await propertiesService.updateProperty(
      user.id,
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
    const user = requireUser(req);
    const result = await propertiesService.submitProperty(user.id, getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function archive(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const result = await propertiesService.archiveProperty(user.id, getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function addMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    if (!req.file) {
      throw badRequest("Un fichier est requis");
    }
    const result = await propertiesService.addMedia(
      user.id,
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
    const user = requireUser(req);
    const result = await propertiesService.updateMedia(
      user.id,
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
    const user = requireUser(req);
    const result = await propertiesService.deleteMedia(
      user.id,
      getParam(req, "id"),
      getParam(req, "mediaId")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
