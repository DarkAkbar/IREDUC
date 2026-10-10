import { SystemRole } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import * as moderationController from "./admin.moderation.controller";
import {
  adminIdParamsSchema,
  adminListQuerySchema,
  adminProvidersQuerySchema,
  reviewDecisionSchema,
} from "./admin.schemas";

export const adminRouter = Router();

adminRouter.use(
  authenticate,
  requireRole(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
);

adminRouter.get("/ping", (_req, res) => {
  res.status(200).json({ message: "ok" });
});

adminRouter.get(
  "/properties",
  validate(adminListQuerySchema, "query"),
  moderationController.listProperties
);

adminRouter.get(
  "/services",
  validate(adminListQuerySchema, "query"),
  moderationController.listServices
);

adminRouter.get(
  "/providers",
  validate(adminProvidersQuerySchema, "query"),
  moderationController.listProviders
);

adminRouter.patch(
  "/properties/:id/review",
  validate(adminIdParamsSchema, "params"),
  validate(reviewDecisionSchema),
  moderationController.reviewProperty
);

adminRouter.patch(
  "/services/:id/review",
  validate(adminIdParamsSchema, "params"),
  validate(reviewDecisionSchema),
  moderationController.reviewService
);

adminRouter.patch(
  "/providers/:id/review",
  validate(adminIdParamsSchema, "params"),
  validate(reviewDecisionSchema),
  moderationController.reviewProvider
);
