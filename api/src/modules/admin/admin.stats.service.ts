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

export async function getAdminStats(query?: { from?: string; to?: string }) {
  const rangeStart = query?.from ? new Date(query.from) : null;
  const rangeEnd = query?.to ? new Date(query.to) : null;
  const createdAtFilter =
    rangeStart || rangeEnd
      ? {
          ...(rangeStart ? { gte: rangeStart } : {}),
          ...(rangeEnd ? { lte: rangeEnd } : {}),
        }
      : undefined;

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
    propertiesByCommune,
    propertiesByCategory,
    requestsInRange,
    topRatedPartners,
    approveActions,
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
    prisma.property.groupBy({
      by: ["communeId"],
      _count: { _all: true },
      ...(createdAtFilter ? { where: { createdAt: createdAtFilter } } : {}),
    }),
    prisma.property.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
      ...(createdAtFilter ? { where: { createdAt: createdAtFilter } } : {}),
    }),
    prisma.request.groupBy({
      by: ["status"],
      _count: { _all: true },
      ...(createdAtFilter ? { where: { createdAt: createdAtFilter } } : {}),
    }),
    prisma.providerProfile.findMany({
      where: { reviewStatus: ReviewStatus.APPROVED },
      take: 5,
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        services: {
          select: {
            reviews: { where: { isHidden: false }, select: { rating: true } },
          },
        },
      },
    }),
    prisma.adminAction.findMany({
      where: {
        action: "APPROVE_PROPERTY",
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, targetId: true },
    }),
  ]);

  const communeIds = propertiesByCommune.map((r) => r.communeId);
  const categoryIds = propertiesByCategory.map((r) => r.categoryId);
  const [communes, categories] = await Promise.all([
    prisma.commune.findMany({
      where: { id: { in: communeIds } },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    }),
  ]);
  const communeNames = Object.fromEntries(communes.map((c) => [c.id, c.name]));
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const propertyIds = approveActions.map((a) => a.targetId);
  const properties = propertyIds.length
    ? await prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, createdAt: true },
      })
    : [];
  const propertyCreated = Object.fromEntries(
    properties.map((p) => [p.id, p.createdAt])
  );
  const delaysHours = approveActions
    .map((action) => {
      const created = propertyCreated[action.targetId];
      if (!created) return null;
      return (action.createdAt.getTime() - created.getTime()) / 3_600_000;
    })
    .filter((v): v is number => v != null && v >= 0);
  const avgValidationDelayHours =
    delaysHours.length === 0
      ? null
      : Math.round(
          (delaysHours.reduce((sum, h) => sum + h, 0) / delaysHours.length) * 10
        ) / 10;

  const approvedCount =
    propertiesByStatus.find((r) => r.status === ListingStatus.APPROVED)?._count._all ?? 0;
  const rejectedCount =
    propertiesByStatus.find((r) => r.status === ListingStatus.REJECTED)?._count._all ?? 0;
  const decided = approvedCount + rejectedCount;
  const approvalRate =
    decided === 0 ? null : Math.round((approvedCount / decided) * 1000) / 10;

  const partnersRanked = topRatedPartners
    .map((p) => {
      const ratings = p.services.flatMap((s) => s.reviews.map((r) => r.rating));
      const avg =
        ratings.length === 0
          ? null
          : Math.round(
              (ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10
            ) / 10;
      return {
        id: p.id,
        displayName: p.displayName,
        averageRating: avg,
        reviewsCount: ratings.length,
      };
    })
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, 5);

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
    period: {
      from: rangeStart?.toISOString() ?? null,
      to: rangeEnd?.toISOString() ?? null,
    },
    users: { total: usersTotal },
    providers: {
      approved: providersApproved,
      pending: providersPending,
      rejected: providersRejected,
    },
    properties: {
      byStatus: toStatusMap(propertiesByStatus),
      pending: pendingProperties,
      byCommune: propertiesByCommune.map((row) => ({
        communeId: row.communeId,
        communeName: communeNames[row.communeId] ?? row.communeId,
        count: row._count._all,
      })),
      byCategory: propertiesByCategory.map((row) => ({
        categoryId: row.categoryId,
        categoryName: categoryNames[row.categoryId] ?? row.categoryId,
        count: row._count._all,
      })),
    },
    services: {
      byStatus: toStatusMap(servicesByStatus),
      pending: pendingServices,
    },
    requests: {
      byStatus: toStatusMap(requestsByStatus) as Partial<
        Record<RequestStatus, number>
      >,
      byStatusInPeriod: toStatusMap(requestsInRange) as Partial<
        Record<RequestStatus, number>
      >,
    },
    moderation: {
      avgValidationDelayHours,
      approvalRatePercent: approvalRate,
      topRatedPartners: partnersRanked,
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
