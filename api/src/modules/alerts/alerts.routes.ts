import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { validate } from "../../middlewares/validate";
import * as alertsController from "./alerts.controller";
import {
  alertIdParamsSchema,
  createAlertSchema,
  updateAlertSchema,
} from "./alerts.schemas";

export const alertsRouter = Router();

alertsRouter.use(authenticate, requireVerifiedEmail);

alertsRouter.post("/", validate(createAlertSchema), alertsController.create);
alertsRouter.get("/", alertsController.list);
alertsRouter.patch(
  "/:id",
  validate(alertIdParamsSchema, "params"),
  validate(updateAlertSchema),
  alertsController.update
);
alertsRouter.delete(
  "/:id",
  validate(alertIdParamsSchema, "params"),
  alertsController.remove
);
