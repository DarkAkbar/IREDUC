import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { forbidden, notFound } from "../../utils/errors";

export async function createAlert(
  userId: string,
  input: { criteria: Prisma.InputJsonValue; isActive?: boolean }
) {
  return prisma.alert.create({
    data: {
      userId,
      criteria: input.criteria,
      isActive: input.isActive ?? true,
    },
  });
}

export async function listAlerts(userId: string) {
  const data = await prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return { data };
}

export async function updateAlert(
  userId: string,
  alertId: string,
  input: { criteria?: Prisma.InputJsonValue; isActive?: boolean }
) {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) throw notFound("Alerte introuvable");
  if (alert.userId !== userId) throw forbidden("Accès interdit à cette alerte");

  return prisma.alert.update({
    where: { id: alertId },
    data: {
      ...(input.criteria !== undefined ? { criteria: input.criteria } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deleteAlert(userId: string, alertId: string) {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) throw notFound("Alerte introuvable");
  if (alert.userId !== userId) throw forbidden("Accès interdit à cette alerte");

  await prisma.alert.delete({ where: { id: alertId } });
  return { message: "Alerte supprimée." };
}
