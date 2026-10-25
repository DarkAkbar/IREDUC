import { AnnouncementAudience, Prisma, SystemRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { logAdminAction } from "./admin.shared";

async function resolveAudienceUserIds(audience: AnnouncementAudience) {
  if (audience === AnnouncementAudience.ALL) {
    const users = await prisma.user.findMany({
      where: { accountStatus: "ACTIVE", systemRole: SystemRole.USER },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
  if (audience === AnnouncementAudience.PARTNERS) {
    const users = await prisma.user.findMany({
      where: {
        accountStatus: "ACTIVE",
        providerProfile: { isNot: null },
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
  const users = await prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      systemRole: SystemRole.USER,
      providerProfile: null,
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function createAnnouncement(
  adminId: string,
  input: { title: string; body: string; audience: AnnouncementAudience }
) {
  const announcement = await prisma.announcement.create({
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      audience: input.audience,
      createdById: adminId,
      sentAt: new Date(),
    },
  });

  const userIds = await resolveAudienceUserIds(input.audience);
  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "ANNOUNCEMENT",
        title: announcement.title,
        body: announcement.body,
        data: { announcementId: announcement.id } as Prisma.InputJsonValue,
      })),
    });
  }

  await logAdminAction(
    adminId,
    "ANNOUNCEMENT",
    announcement.id,
    "CREATE_ANNOUNCEMENT"
  );
  return { ...announcement, recipients: userIds.length };
}

export async function listAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      createdBy: { select: { id: true, fullName: true } },
    },
  });
}
