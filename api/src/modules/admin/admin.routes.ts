import { SystemRole } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import * as adminController from "./admin.controller";
import * as moderationController from "./admin.moderation.controller";
import {
  adminIdParamsSchema,
  adminListQuerySchema,
  adminProvidersQuerySchema,
  adminRequestsQuerySchema,
  adminUsersQuerySchema,
  auditLogQuerySchema,
  cancelRequestSchema,
  complementSchema,
  createAdminSchema,
  createCategorySchema,
  featureSchema,
  reviewDecisionSchema,
  settingHistoryQuerySchema,
  settingKeyParamsSchema,
  updateAdminRoleSchema,
  updateCategorySchema,
  updateSettingSchema,
  updateUserStatusSchema,
} from "./admin.schemas";
import { paginationQuerySchema } from "../../utils/pagination";

export const adminRouter = Router();

adminRouter.use(
  authenticate,
  requireRole(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
);

adminRouter.get("/ping", (_req, res) => {
  res.status(200).json({ message: "ok" });
});

adminRouter.get("/stats", adminController.stats);

adminRouter.get(
  "/properties",
  validate(adminListQuerySchema, "query"),
  moderationController.listProperties
);
adminRouter.get(
  "/properties/:id",
  validate(adminIdParamsSchema, "params"),
  adminController.getProperty
);
adminRouter.patch(
  "/properties/:id/review",
  validate(adminIdParamsSchema, "params"),
  validate(reviewDecisionSchema),
  adminController.reviewProperty
);
adminRouter.patch(
  "/properties/:id/feature",
  validate(adminIdParamsSchema, "params"),
  validate(featureSchema),
  adminController.featureProperty
);

adminRouter.get(
  "/services",
  validate(adminListQuerySchema, "query"),
  moderationController.listServices
);
adminRouter.get(
  "/services/:id",
  validate(adminIdParamsSchema, "params"),
  adminController.getService
);
adminRouter.patch(
  "/services/:id/review",
  validate(adminIdParamsSchema, "params"),
  validate(reviewDecisionSchema),
  adminController.reviewService
);
adminRouter.patch(
  "/services/:id/feature",
  validate(adminIdParamsSchema, "params"),
  validate(featureSchema),
  adminController.featureService
);

adminRouter.get(
  "/providers",
  validate(adminProvidersQuerySchema, "query"),
  moderationController.listProviders
);
adminRouter.get(
  "/providers/:id",
  validate(adminIdParamsSchema, "params"),
  adminController.getProvider
);
adminRouter.patch(
  "/providers/:id/review",
  validate(adminIdParamsSchema, "params"),
  validate(reviewDecisionSchema),
  moderationController.reviewProvider
);
adminRouter.patch(
  "/providers/:id/request-complement",
  validate(adminIdParamsSchema, "params"),
  validate(complementSchema),
  adminController.requestComplement
);

adminRouter.get(
  "/requests",
  validate(adminRequestsQuerySchema, "query"),
  adminController.listRequests
);
adminRouter.get(
  "/requests/:id",
  validate(adminIdParamsSchema, "params"),
  adminController.getRequest
);
adminRouter.patch(
  "/requests/:id/cancel",
  validate(adminIdParamsSchema, "params"),
  validate(cancelRequestSchema),
  adminController.cancelRequest
);

adminRouter.get(
  "/users",
  validate(adminUsersQuerySchema, "query"),
  adminController.listUsers
);
adminRouter.get(
  "/users/:id",
  validate(adminIdParamsSchema, "params"),
  adminController.getUser
);
adminRouter.patch(
  "/users/:id/status",
  validate(adminIdParamsSchema, "params"),
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

adminRouter.get(
  "/admins",
  validate(paginationQuerySchema, "query"),
  adminController.listAdmins
);
adminRouter.post(
  "/admins",
  validate(createAdminSchema),
  adminController.createAdmin
);
adminRouter.patch(
  "/admins/:id/role",
  validate(adminIdParamsSchema, "params"),
  validate(updateAdminRoleSchema),
  adminController.updateAdminRole
);

adminRouter.get(
  "/audit-log",
  validate(auditLogQuerySchema, "query"),
  adminController.listAuditLog
);

adminRouter.get("/categories", adminController.listCategories);
adminRouter.post(
  "/categories",
  validate(createCategorySchema),
  adminController.createCategory
);
adminRouter.patch(
  "/categories/:id",
  validate(adminIdParamsSchema, "params"),
  validate(updateCategorySchema),
  adminController.updateCategory
);

adminRouter.get("/settings", adminController.listSettings);
adminRouter.get(
  "/settings/:key",
  validate(settingKeyParamsSchema, "params"),
  adminController.getSetting
);
adminRouter.patch(
  "/settings/:key",
  validate(settingKeyParamsSchema, "params"),
  validate(updateSettingSchema),
  adminController.updateSetting
);
adminRouter.get(
  "/settings/:key/history",
  validate(settingKeyParamsSchema, "params"),
  validate(settingHistoryQuerySchema, "query"),
  adminController.getSettingHistory
);
