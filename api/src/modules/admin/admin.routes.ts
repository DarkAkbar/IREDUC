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
  updateCommuneSchema,
  updateNeighborhoodSchema,
  updateRejectionReasonSchema,
  updateReportSchema,
  updateSettingSchema,
  updateUserStatusSchema,
  adminReportsQuerySchema,
  reviewVisibilitySchema,
  adminCategoriesQuerySchema,
  authEventsQuerySchema,
  changeAdminPasswordSchema,
  createAnnouncementSchema,
  adminSearchQuerySchema,
  adminStatsQuerySchema,
  updateAdminStatusSchema,
  createCommuneSchema,
  createNeighborhoodSchema,
  createRejectionReasonSchema,
  referentialsIncludeInactiveSchema,
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

adminRouter.get("/me/profile", adminController.getMyAdminProfile);
adminRouter.patch(
  "/me/profile/password",
  validate(changeAdminPasswordSchema),
  adminController.changeMyAdminPassword
);
adminRouter.get("/me/sessions", adminController.listMyAdminSessions);
adminRouter.delete(
  "/me/sessions/:id",
  validate(adminIdParamsSchema, "params"),
  adminController.revokeMyAdminSession
);

adminRouter.get(
  "/stats",
  validate(adminStatsQuerySchema, "query"),
  adminController.stats
);
adminRouter.get(
  "/search",
  validate(adminSearchQuerySchema, "query"),
  adminController.adminSearch
);
adminRouter.get("/system-health", adminController.systemHealth);
adminRouter.get("/exports/partners.csv", adminController.exportPartnersCsv);
adminRouter.get("/exports/properties.csv", adminController.exportPropertiesCsv);
adminRouter.get("/exports/requests.csv", adminController.exportRequestsCsv);

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
  "/users/export.csv",
  validate(adminUsersQuerySchema, "query"),
  adminController.exportUsersCsv
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
adminRouter.post(
  "/users/:id/force-logout",
  validate(adminIdParamsSchema, "params"),
  adminController.forceLogoutUser
);
adminRouter.post(
  "/users/:id/reset-password",
  validate(adminIdParamsSchema, "params"),
  adminController.resetUserPassword
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
adminRouter.patch(
  "/admins/:id/status",
  validate(adminIdParamsSchema, "params"),
  validate(updateAdminStatusSchema),
  adminController.updateAdminStatus
);

adminRouter.get(
  "/audit-log",
  validate(auditLogQuerySchema, "query"),
  adminController.listAuditLog
);
adminRouter.get(
  "/audit-log/export.csv",
  validate(auditLogQuerySchema, "query"),
  adminController.exportAuditLogCsv
);
adminRouter.get(
  "/auth-events",
  validate(authEventsQuerySchema, "query"),
  adminController.listAuthEvents
);

adminRouter.get("/inbox/unread-count", adminController.inboxUnreadCount);
adminRouter.get("/inbox", adminController.listInbox);
adminRouter.patch(
  "/inbox/:id/read",
  validate(adminIdParamsSchema, "params"),
  adminController.markInboxRead
);
adminRouter.get("/announcements", adminController.listAnnouncements);
adminRouter.post(
  "/announcements",
  validate(createAnnouncementSchema),
  adminController.createAnnouncement
);

adminRouter.get("/reports/open-count", adminController.openReportsCount);
adminRouter.get(
  "/reports",
  validate(adminReportsQuerySchema, "query"),
  adminController.listReports
);
adminRouter.get(
  "/reports/:id",
  validate(adminIdParamsSchema, "params"),
  adminController.getReport
);
adminRouter.patch(
  "/reports/:id",
  validate(adminIdParamsSchema, "params"),
  validate(updateReportSchema),
  adminController.updateReport
);
adminRouter.patch(
  "/reviews/:id/visibility",
  validate(adminIdParamsSchema, "params"),
  validate(reviewVisibilitySchema),
  adminController.setReviewVisibility
);

adminRouter.get(
  "/communes",
  validate(referentialsIncludeInactiveSchema, "query"),
  adminController.listCommunes
);
adminRouter.post(
  "/communes",
  validate(createCommuneSchema),
  adminController.createCommune
);
adminRouter.patch(
  "/communes/:id",
  validate(adminIdParamsSchema, "params"),
  validate(updateCommuneSchema),
  adminController.updateCommune
);
adminRouter.get(
  "/communes/:id/neighborhoods",
  validate(adminIdParamsSchema, "params"),
  validate(referentialsIncludeInactiveSchema, "query"),
  adminController.listCommuneNeighborhoods
);
adminRouter.post(
  "/communes/:id/neighborhoods",
  validate(adminIdParamsSchema, "params"),
  validate(createNeighborhoodSchema),
  adminController.createNeighborhood
);
adminRouter.patch(
  "/neighborhoods/:id",
  validate(adminIdParamsSchema, "params"),
  validate(updateNeighborhoodSchema),
  adminController.updateNeighborhood
);

adminRouter.get(
  "/rejection-reasons",
  validate(referentialsIncludeInactiveSchema, "query"),
  adminController.listRejectionReasons
);
adminRouter.post(
  "/rejection-reasons",
  validate(createRejectionReasonSchema),
  adminController.createRejectionReason
);
adminRouter.patch(
  "/rejection-reasons/:id",
  validate(adminIdParamsSchema, "params"),
  validate(updateRejectionReasonSchema),
  adminController.updateRejectionReason
);

adminRouter.get(
  "/categories",
  validate(adminCategoriesQuerySchema, "query"),
  adminController.listCategories
);
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
