import { NextFunction, Request, Response } from "express";
import * as configService from "./config.service";

export async function getConfig(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.status(200).json(configService.getPublicConfig());
  } catch (error) {
    next(error);
  }
}
