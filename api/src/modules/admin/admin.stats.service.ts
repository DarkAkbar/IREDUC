import { ListingStatus, RequestStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

export async function getAdminStats() {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [
    usersTotal,
    providersApproved,
    providersPending,
    providersRejected,
    propertiesByStatus,
    servicesByStatus,
    requestsByStatus,
    newUsers,
    newRequests,
    pendingProperties,
    pendingServices,
    pendingProviders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.providerProfile.count({ where: { reviewStatus: ReviewStatus.APPROVED } }),
    prisma.providerProfile.count({ where: { reviewStatus: ReviewStatus.PENDING } }),
    prisma.providerProfile.count({ where: { reviewStatus: ReviewStatus.REJECTED } }),
    prisma.property.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.service.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.request.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.request.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.property.count({ where: { status: ListingStatus.PENDING } }),
    prisma.service.count({ where: { status: ListingStatus.PENDING } }),
    prisma.providerProfile.count({ where: { reviewStatus: ReviewStatus.PENDING } }),
  ]);

  const days = lastNDays(30);
  const registrationsByDay = Object.fromEntries(days.map((d) => [d, 0]));
  const requestsByDay = Object.fromEntries(days.map((d) => [d, 0]));

  for (const user of newUsers) {
    const key = dayKey(user.createdAt);
    if (key in registrationsByDay) registrationsByDay[key] += 1;
  }
  for (const req of newRequests) {
    const key = dayKey(req.createdAt);
    if (key in requestsByDay) requestsByDay[key] += 1;
  }

  const toStatusMap = <T extends string>(
    rows: Array<{ status: T; _count: { _all: number } }>
  ) =>
    Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<
      T,
      number
    >;

  return {
    users: { total: usersTotal },
    providers: {
      approved: providersApproved,
      pending: providersPending,
      rejected: providersRejected,
    },
    properties: {
      byStatus: toStatusMap(propertiesByStatus),
      pending: pendingProperties,
    },
    services: {
      byStatus: toStatusMap(servicesByStatus),
      pending: pendingServices,
    },
    requests: {
      byStatus: toStatusMap(requestsByStatus) as Partial<
        Record<RequestStatus, number>
      >,
    },
    pendingQueue: {
      providers: pendingProviders,
      properties: pendingProperties,
      services: pendingServices,
      total: pendingProviders + pendingProperties + pendingServices,
    },
    series: {
      registrationsLast30Days: days.map((date) => ({
        date,
        count: registrationsByDay[date],
      })),
      requestsLast30Days: days.map((date) => ({
        date,
        count: requestsByDay[date],
      })),
    },
  };
}
