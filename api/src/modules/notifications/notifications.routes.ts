import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { validate } from "../../middlewares/validate";
import * as notificationsController from "./notifications.controller";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "./notifications.schemas";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate, requireVerifiedEmail);

notificationsRouter.get(
  "/",
  validate(listNotificationsQuerySchema, "query"),
  notificationsController.list
);

notificationsRouter.patch(
  "/read-all",
  notificationsController.markAllRead
);

notificationsRouter.patch(
  "/:id/read",
  validate(notificationIdParamsSchema, "params"),
  notificationsController.markRead
);
