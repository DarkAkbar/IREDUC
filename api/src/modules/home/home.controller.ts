import { NextFunction, Request, Response } from "express";
import * as homeService from "./home.service";

export async function getHome(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await homeService.getHomeFeed();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
