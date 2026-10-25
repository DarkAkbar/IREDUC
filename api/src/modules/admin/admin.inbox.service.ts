import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";

export async function enqueueAdminInbox(input: {
  type: string;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}) {
  await prisma.adminInboxItem.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? undefined,
    },
  });
}

export async function listInbox(query: { page: number; limit: number }) {
  const { page, limit, skip } = getPagination(query);
  const [total, rows] = await prisma.$transaction([
    prisma.adminInboxItem.count(),
    prisma.adminInboxItem.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return buildPaginatedResult(rows, total, page, limit);
}

export async function markInboxRead(itemId: string) {
  const item = await prisma.adminInboxItem.findUnique({ where: { id: itemId } });
  if (!item) throw notFound("Élément introuvable");
  return prisma.adminInboxItem.update({
    where: { id: itemId },
    data: { readAt: new Date() },
  });
}

export async function unreadInboxCount() {
  return prisma.adminInboxItem.count({ where: { readAt: null } });
}
