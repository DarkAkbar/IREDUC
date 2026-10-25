import { CategoryKind, SystemRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as adminsService from "./admin.admins.service";
import * as auditService from "./admin.audit.service";
import * as categoriesService from "./admin.categories.service";
import * as referentialsService from "./admin.referentials.service";
import * as reportsService from "./admin.reports.service";
import * as securityService from "./admin.security.service";
import * as communicationService from "./admin.communication.service";
import * as inboxService from "./admin.inbox.service";
import * as toolsService from "./admin.tools.service";
import * as moderationService from "./admin.moderation.service";
import * as requestsService from "./admin.requests.service";
import * as settingsService from "./admin.settings.service";
import * as statsService from "./admin.stats.service";
import * as usersService from "./admin.users.service";

function requireAdmin(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

function requireSuperAdmin(req: Request) {
  const user = requireAdmin(req);
  if (user.role !== SystemRole.SUPER_ADMIN) {
    throw forbidden("Réservé au super administrateur");
  }
  return user;
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await statsService.getAdminStats({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await usersService.listUsers(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await usersService.getUser(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await usersService.updateUserStatus(
      admin,
      getParam(req, "id"),
      req.body.status,
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function forceLogoutUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await usersService.forceLogoutUser(admin.id, getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireSuperAdmin(req);
    const result = await usersService.resetUserPassword(admin.id, getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportUsersCsv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const csv = await usersService.exportUsersCsv(req.query as never);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="utilisateurs.csv"'
    );
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function listAdmins(req: Request, res: Response, next: NextFunction) {
  try {
    requireSuperAdmin(req);
    const result = await adminsService.listAdmins(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireSuperAdmin(req);
    const result = await adminsService.createAdmin(admin.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateAdminRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireSuperAdmin(req);
    const result = await adminsService.updateAdminRole(
      admin,
      getParam(req, "id"),
      req.body.role
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateAdminStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireSuperAdmin(req);
    const result = await adminsService.updateAdminStatus(
      admin,
      getParam(req, "id"),
      req.body.status
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMyAdminProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await securityService.getMyAdminProfile(admin.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function changeMyAdminPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await securityService.changeMyAdminPassword(
      admin.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listMyAdminSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await securityService.listMySessions(admin.id);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function revokeMyAdminSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await securityService.revokeMySession(
      admin.id,
      getParam(req, "id")
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listAuthEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireSuperAdmin(req);
    const result = await securityService.listAuthEvents(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportAuditLogCsv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireSuperAdmin(req);
    const csv = await securityService.exportAuditLogCsv(req.query as never);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="journal-audit.csv"'
    );
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function listAuditLog(req: Request, res: Response, next: NextFunction) {
  try {
    requireSuperAdmin(req);
    const result = await auditService.listAuditLog(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireSuperAdmin(req);
    const query = req.query as {
      parentId?: string | null;
      kind?: CategoryKind;
    };
    const result = await categoriesService.listAdminCategories({
      ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
    });
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function listCommunes(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const includeInactive = req.query.includeInactive === "true";
    const data = await referentialsService.listCommunes(includeInactive);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createCommune(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const result = await referentialsService.createCommune(admin.id, req.body.name);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateCommune(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const result = await referentialsService.updateCommune(
      admin.id,
      getParam(req, "id"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listCommuneNeighborhoods(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const includeInactive = req.query.includeInactive === "true";
    const result = await referentialsService.listNeighborhoodsByCommune(
      getParam(req, "id"),
      includeInactive
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createNeighborhood(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await referentialsService.createNeighborhood(
      admin.id,
      getParam(req, "id"),
      req.body.name
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateNeighborhood(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await referentialsService.updateNeighborhood(
      admin.id,
      getParam(req, "id"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listRejectionReasons(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const includeInactive = req.query.includeInactive === "true";
    const data = await referentialsService.listRejectionReasons(includeInactive);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createRejectionReason(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await referentialsService.createRejectionReason(admin.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateRejectionReason(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await referentialsService.updateRejectionReason(
      admin.id,
      getParam(req, "id"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function adminSearch(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const q = String(req.query.q ?? "");
    const result = await toolsService.globalAdminSearch(q);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function systemHealth(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await toolsService.getSystemHealth();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportPartnersCsv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const csv = await toolsService.exportPartnersCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="partenaires.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportPropertiesCsv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const csv = await toolsService.exportPropertiesCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="annonces.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportRequestsCsv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const csv = await toolsService.exportRequestsCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="demandes.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await communicationService.createAnnouncement(admin.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listAnnouncements(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const result = await communicationService.listAnnouncements();
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function listInbox(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await inboxService.listInbox({ page, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markInboxRead(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await inboxService.markInboxRead(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function inboxUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const count = await inboxService.unreadInboxCount();
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await reportsService.listReports(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await reportsService.getReport(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const result = await reportsService.updateReport(
      admin.id,
      getParam(req, "id"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function openReportsCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const count = await reportsService.countOpenReports();
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
}

export async function setReviewVisibility(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await reportsService.setReviewVisibility(
      admin.id,
      getParam(req, "id"),
      req.body.hidden
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireSuperAdmin(req);
    const result = await categoriesService.createCategory(admin.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireSuperAdmin(req);
    const result = await categoriesService.updateCategory(
      admin.id,
      getParam(req, "id"),
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProperty(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await moderationService.getPropertyAdmin(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getService(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await moderationService.getServiceAdmin(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProvider(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await moderationService.getProviderAdmin(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function featureProperty(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await moderationService.setPropertyFeatured(
      admin.id,
      getParam(req, "id"),
      req.body.isFeatured
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function featureService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await moderationService.setServiceFeatured(
      admin.id,
      getParam(req, "id"),
      req.body.isFeatured
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function requestComplement(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await moderationService.requestProviderComplement(
      admin.id,
      getParam(req, "id"),
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listRequests(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const result = await requestsService.listRequests(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const result = await requestsService.getRequest(getParam(req, "id"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancelRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const result = await requestsService.cancelRequestAsAdmin(
      admin.id,
      getParam(req, "id"),
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function reviewProperty(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const id = getParam(req, "id");
    const result = await moderationService.reviewProperty(
      admin.id,
      id,
      req.body.decision,
      req.body.reason
    );
    const nextPending = await moderationService.getNextPendingProperty(id);
    res.status(200).json({ ...result, nextPendingId: nextPending?.id ?? null });
  } catch (error) {
    next(error);
  }
}

export async function reviewService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireAdmin(req);
    const id = getParam(req, "id");
    const result = await moderationService.reviewService(
      admin.id,
      id,
      req.body.decision,
      req.body.reason
    );
    const nextPending = await moderationService.getNextPendingService(id);
    res.status(200).json({ ...result, nextPendingId: nextPending?.id ?? null });
  } catch (error) {
    next(error);
  }
}

export async function listSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const result = await settingsService.listSettings();
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSetting(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireAdmin(req);
    const result = await settingsService.getSetting(getParam(req, "key"));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateSetting(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = requireSuperAdmin(req);
    const result = await settingsService.updateSetting(
      admin.id,
      getParam(req, "key"),
      req.body.value,
      req.body.reason
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSettingHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireSuperAdmin(req);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await settingsService.getSettingHistory(
      getParam(req, "key"),
      page,
      limit
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
