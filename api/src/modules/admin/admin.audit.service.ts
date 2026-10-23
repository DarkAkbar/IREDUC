import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";

export async function listAuditLog(query: {
  page: number;
  limit: number;
  adminId?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  const { page, limit, skip } = getPagination(query);

  const createdAt: Prisma.DateTimeFilter = {};
  if (query.from) createdAt.gte = new Date(query.from);
  if (query.to) createdAt.lte = new Date(query.to);

  const where: Prisma.AdminActionWhereInput = {
    ...(query.adminId ? { adminId: query.adminId } : {}),
    ...(query.action
      ? { action: { contains: query.action, mode: "insensitive" } }
      : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.adminAction.count({ where }),
    prisma.adminAction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: { id: true, fullName: true, email: true, systemRole: true },
        },
      },
    }),
  ]);

  return buildPaginatedResult(rows, total, page, limit);
}
