import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export async function logAuthEvent(input: {
  userId?: string | null;
  emailOrPhone?: string | null;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  meta?: Prisma.InputJsonValue;
}) {
  await prisma.authEvent.create({
    data: {
      userId: input.userId ?? null,
      emailOrPhone: input.emailOrPhone?.trim() || null,
      eventType: input.eventType,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      success: input.success,
      meta: input.meta ?? undefined,
    },
  });
}
