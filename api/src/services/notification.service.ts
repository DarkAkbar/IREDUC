import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? Prisma.JsonNull,
    },
  });
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) {
    return;
  }
  await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? undefined,
    })),
  });
}
