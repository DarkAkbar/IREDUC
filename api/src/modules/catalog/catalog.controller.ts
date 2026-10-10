import { NextFunction, Request, Response } from "express";
import { getParam } from "../../utils/params";
import * as catalogService from "./catalog.service";

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await catalogService.listCategories(req.query.kind as never);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listCommunes(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await catalogService.listCommunes();
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listNeighborhoods(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await catalogService.listNeighborhoods(getParam(req, "id"));
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
