import { NextFunction, Request, Response } from "express";
import * as configService from "./config.service";

export async function getConfig(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const config = await configService.getPublicConfig();
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}
