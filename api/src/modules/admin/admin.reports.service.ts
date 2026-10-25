import {
  AccountStatus,
  ListingStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  SystemRole,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { logAdminAction } from "./admin.shared";

export async function listReports(query: {
  page: number;
  limit: number;
  status?: ReportStatus;
  targetType?: ReportTargetType;
}) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.ReportWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.targetType ? { targetType: query.targetType } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        resolvedBy: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  return buildPaginatedResult(rows, total, page, limit);
}

export async function getReport(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          accountStatus: true,
        },
      },
      resolvedBy: { select: { id: true, fullName: true } },
    },
  });
  if (!report) throw notFound("Signalement introuvable");
  return report;
}

async function resolveTargetUserId(
  targetType: ReportTargetType,
  targetId: string
): Promise<string | null> {
  switch (targetType) {
    case "USER":
      return targetId;
    case "PROPERTY": {
      const p = await prisma.property.findUnique({
        where: { id: targetId },
        select: { ownerId: true },
      });
      return p?.ownerId ?? null;
    }
    case "SERVICE": {
      const s = await prisma.service.findUnique({
        where: { id: targetId },
        select: { provider: { select: { userId: true } } },
      });
      return s?.provider.userId ?? null;
    }
    case "REVIEW": {
      const r = await prisma.review.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      return r?.authorId ?? null;
    }
    case "MESSAGE": {
      const m = await prisma.message.findUnique({
        where: { id: targetId },
        select: { senderId: true },
      });
      return m?.senderId ?? null;
    }
    default:
      return null;
  }
}

async function applyHideContent(
  adminId: string,
  targetType: ReportTargetType,
  targetId: string
) {
  if (targetType === "REVIEW") {
    await setReviewVisibility(adminId, targetId, true);
    return;
  }
  if (targetType === "PROPERTY") {
    await prisma.property.update({
      where: { id: targetId },
      data: { status: ListingStatus.ARCHIVED },
    });
    await logAdminAction(adminId, "PROPERTY", targetId, "HIDE_CONTENT");
    return;
  }
  if (targetType === "SERVICE") {
    await prisma.service.update({
      where: { id: targetId },
      data: { status: ListingStatus.ARCHIVED },
    });
    await logAdminAction(adminId, "SERVICE", targetId, "HIDE_CONTENT");
  }
}

export async function updateReport(
  adminId: string,
  reportId: string,
  input: {
    status?: ReportStatus;
    adminNote?: string | null;
    action?: "hide_content" | "suspend_user" | "dismiss";
  }
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw notFound("Signalement introuvable");

  let nextStatus = input.status ?? report.status;
  if (input.action === "dismiss") {
    nextStatus = ReportStatus.DISMISSED;
  }

  if (input.action === "hide_content") {
    await applyHideContent(adminId, report.targetType, report.targetId);
  }

  if (input.action === "suspend_user") {
    const userId = await resolveTargetUserId(report.targetType, report.targetId);
    if (!userId) throw badRequest("Impossible d'identifier l'utilisateur cible");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("Utilisateur introuvable");
    if (user.systemRole !== SystemRole.USER) {
      throw badRequest("Impossible de suspendre un compte administrateur");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: AccountStatus.SUSPENDED },
    });
    await logAdminAction(
      adminId,
      "USER",
      userId,
      "SUSPEND_USER",
      input.adminNote ?? report.reason
    );
    nextStatus = ReportStatus.RESOLVED;
  }

  const resolved =
    nextStatus === ReportStatus.RESOLVED || nextStatus === ReportStatus.DISMISSED;

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: nextStatus,
      ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
      ...(resolved
        ? { resolvedById: adminId, resolvedAt: new Date() }
        : input.status === ReportStatus.IN_PROGRESS
          ? { resolvedById: null, resolvedAt: null }
          : {}),
    },
    include: {
      reporter: { select: { id: true, fullName: true } },
      resolvedBy: { select: { id: true, fullName: true } },
    },
  });

  await logAdminAction(adminId, "REPORT", reportId, "UPDATE_REPORT", input.adminNote);
  return updated;
}

export async function setReviewVisibility(
  adminId: string,
  reviewId: string,
  hidden: boolean
) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw notFound("Avis introuvable");

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: hidden },
  });

  await logAdminAction(
    adminId,
    "REVIEW",
    reviewId,
    hidden ? "HIDE_REVIEW" : "SHOW_REVIEW"
  );
  return updated;
}

export async function countOpenReports() {
  return prisma.report.count({
    where: { status: { in: [ReportStatus.OPEN, ReportStatus.IN_PROGRESS] } },
  });
}
