import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import * as reportsController from "./reports.controller";
import { createReportSchema } from "./reports.schemas";

export const reportsRouter = Router();

reportsRouter.post(
  "/",
  authenticate,
  validate(createReportSchema),
  reportsController.create
);
