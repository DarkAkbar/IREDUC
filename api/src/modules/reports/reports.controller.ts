import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../utils/errors";
import * as reportsService from "./reports.service";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthorized();
    const result = await reportsService.createReport(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
