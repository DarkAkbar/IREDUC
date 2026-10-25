import { ReportTargetType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, notFound } from "../../utils/errors";

async function assertTargetExists(targetType: ReportTargetType, targetId: string) {
  switch (targetType) {
    case "PROPERTY": {
      const row = await prisma.property.findUnique({ where: { id: targetId } });
      if (!row) throw notFound("Annonce introuvable");
      return;
    }
    case "SERVICE": {
      const row = await prisma.service.findUnique({ where: { id: targetId } });
      if (!row) throw notFound("Service introuvable");
      return;
    }
    case "USER": {
      const row = await prisma.user.findUnique({ where: { id: targetId } });
      if (!row) throw notFound("Utilisateur introuvable");
      return;
    }
    case "MESSAGE": {
      const row = await prisma.message.findUnique({ where: { id: targetId } });
      if (!row) throw notFound("Message introuvable");
      return;
    }
    case "REVIEW": {
      const row = await prisma.review.findUnique({ where: { id: targetId } });
      if (!row) throw notFound("Avis introuvable");
      return;
    }
    default:
      throw badRequest("Type de cible invalide");
  }
}

export async function createReport(
  reporterId: string,
  input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    details?: string;
  }
) {
  if (input.targetType === "USER" && input.targetId === reporterId) {
    throw badRequest("Vous ne pouvez pas vous signaler vous-même");
  }

  await assertTargetExists(input.targetType, input.targetId);

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim(),
      details: input.details?.trim() || null,
    },
  });

  const { enqueueAdminInbox } = await import("../admin/admin.inbox.service");
  await enqueueAdminInbox({
    type: "NEW_REPORT",
    title: "Nouveau signalement",
    body: input.reason.trim(),
    data: {
      reportId: report.id,
      targetType: input.targetType,
      targetId: input.targetId,
    },
  });

  return report;
}
