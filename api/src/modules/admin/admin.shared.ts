import { prisma } from "../../config/prisma";

export async function logAdminAction(
  adminId: string,
  targetType: string,
  targetId: string,
  action: string,
  reason?: string | null
) {
  await prisma.adminAction.create({
    data: {
      adminId,
      targetType,
      targetId,
      action,
      reason: reason?.trim() || null,
    },
  });
}
