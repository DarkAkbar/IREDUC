import { SystemRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../../utils/errors";
import { getParam } from "../../utils/params";
import * as adminsService from "./admin.admins.service";
import * as auditService from "./admin.audit.service";
import * as categoriesService from "./admin.categories.service";
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
    const result = await statsService.getAdminStats();
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
    const result = await categoriesService.listAdminCategories();
    res.status(200).json({ data: result });
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
