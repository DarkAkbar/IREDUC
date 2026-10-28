import { RequestStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";

export async function createReview(
  authorId: string,
  input: { requestId: string; rating: number; comment?: string }
) {
  const request = await prisma.request.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw notFound("Demande introuvable");
  if (request.requesterId !== authorId) {
    throw forbidden("Seul le demandeur peut laisser un avis");
  }
  if (request.status !== RequestStatus.COMPLETED) {
    throw badRequest(
      "Un avis n'est possible que pour une demande terminée",
      undefined,
      "REQUEST_NOT_COMPLETED"
    );
  }

  const existing = await prisma.review.findUnique({
    where: { requestId: input.requestId },
  });
  if (existing) {
    throw conflict("Un avis existe déjà pour cette demande");
  }

  return prisma.review.create({
    data: {
      requestId: input.requestId,
      authorId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
      propertyId: request.propertyId,
      serviceId: request.serviceId,
    },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });
}

export async function listServiceReviews(
  serviceId: string,
  query: { page: number; limit: number }
) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw notFound("Service introuvable");

  const { page, limit, skip } = getPagination(query);
  const where = { serviceId, isHidden: false };

  const [total, rows, allRatings] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.findMany({
      where,
      select: { rating: true },
    }),
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const row of allRatings) {
    distribution[row.rating as 1 | 2 | 3 | 4 | 5] += 1;
  }

  const totalRatings = allRatings.length;
  const averageRating =
    totalRatings === 0
      ? null
      : Math.round(
          (allRatings.reduce((sum, row) => sum + row.rating, 0) / totalRatings) *
            10
        ) / 10;

  const percentage = {
    5: totalRatings ? Math.round((distribution[5] / totalRatings) * 100) : 0,
    4: totalRatings ? Math.round((distribution[4] / totalRatings) * 100) : 0,
    3: totalRatings ? Math.round((distribution[3] / totalRatings) * 100) : 0,
    2: totalRatings ? Math.round((distribution[2] / totalRatings) * 100) : 0,
    1: totalRatings ? Math.round((distribution[1] / totalRatings) * 100) : 0,
  };

  return {
    ...buildPaginatedResult(rows, total, page, limit),
    summary: {
      averageRating,
      totalRatings,
      distribution,
      percentage,
    },
  };
}
