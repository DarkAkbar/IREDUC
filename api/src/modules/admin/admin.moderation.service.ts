import { ListingStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { mapPropertyDetail } from "../properties/properties.mapper";
import { mapServiceDetail } from "../services/services.mapper";

async function logAdminAction(
  adminId: string,
  targetType: string,
  targetId: string,
  action: string,
  reason?: string
) {
  await prisma.adminAction.create({
    data: {
      adminId,
      targetType,
      targetId,
      action,
      reason: reason ?? null,
    },
  });
}

export async function listPendingProperties(query: {
  page: number;
  limit: number;
  status: ListingStatus;
}) {
  const { page, limit, skip } = getPagination(query);
  const where = { status: query.status };
  const [total, rows] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: {
        commune: { select: { id: true, name: true } },
        neighborhood: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { sortOrder: "asc" } },
        owner: {
          select: {
            id: true,
            fullName: true,
            emailVerified: true,
            phone: true,
            whatsapp: true,
            providerProfile: {
              select: {
                id: true,
                displayName: true,
                type: true,
                logoUrl: true,
                reviewStatus: true,
                phone: true,
                whatsapp: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
  ]);

  return buildPaginatedResult(
    rows.map(mapPropertyDetail),
    total,
    page,
    limit
  );
}

export async function listPendingServices(query: {
  page: number;
  limit: number;
  status: ListingStatus;
}) {
  const { page, limit, skip } = getPagination(query);
  const where = { status: query.status };
  const [total, rows] = await prisma.$transaction([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        providerProfile: {
          select: {
            id: true,
            displayName: true,
            logoUrl: true,
            reviewStatus: true,
            type: true,
            yearsOfExperience: true,
            phone: true,
            whatsapp: true,
            contactEmail: true,
          },
        },
        media: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: { author: { select: { id: true, fullName: true } } },
        },
        coverageCommunes: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
  ]);

  return buildPaginatedResult(
    rows.map(mapServiceDetail),
    total,
    page,
    limit
  );
}

export async function listPendingProviders(query: {
  page: number;
  limit: number;
  status: ReviewStatus;
}) {
  const { page, limit, skip } = getPagination(query);
  const where = { reviewStatus: query.status };
  const [total, rows] = await prisma.$transaction([
    prisma.providerProfile.count({ where }),
    prisma.providerProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        documents: true,
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
  ]);

  return buildPaginatedResult(rows, total, page, limit);
}

export async function reviewProperty(
  adminId: string,
  propertyId: string,
  decision: "APPROVED" | "REJECTED",
  reason?: string
) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    throw notFound("Bien introuvable");
  }
  if (property.status !== ListingStatus.PENDING) {
    throw badRequest("Seuls les biens en attente peuvent être modérés");
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status:
        decision === "APPROVED" ? ListingStatus.APPROVED : ListingStatus.REJECTED,
      rejectionReason: decision === "REJECTED" ? reason!.trim() : null,
    },
  });

  await logAdminAction(
    adminId,
    "PROPERTY",
    propertyId,
    decision === "APPROVED" ? "APPROVE_PROPERTY" : "REJECT_PROPERTY",
    reason
  );

  return updated;
}

export async function reviewService(
  adminId: string,
  serviceId: string,
  decision: "APPROVED" | "REJECTED",
  reason?: string
) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw notFound("Service introuvable");
  }
  if (service.status !== ListingStatus.PENDING) {
    throw badRequest("Seuls les services en attente peuvent être modérés");
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      status:
        decision === "APPROVED" ? ListingStatus.APPROVED : ListingStatus.REJECTED,
      rejectionReason: decision === "REJECTED" ? reason!.trim() : null,
    },
  });

  await logAdminAction(
    adminId,
    "SERVICE",
    serviceId,
    decision === "APPROVED" ? "APPROVE_SERVICE" : "REJECT_SERVICE",
    reason
  );

  return updated;
}

export async function reviewProvider(
  adminId: string,
  providerId: string,
  decision: "APPROVED" | "REJECTED",
  reason?: string
) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
  });
  if (!provider) {
    throw notFound("Profil partenaire introuvable");
  }
  if (provider.reviewStatus !== ReviewStatus.PENDING) {
    throw badRequest("Seuls les profils en attente peuvent être modérés");
  }

  const updated = await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      reviewStatus:
        decision === "APPROVED" ? ReviewStatus.APPROVED : ReviewStatus.REJECTED,
      rejectionReason: decision === "REJECTED" ? reason!.trim() : null,
    },
  });

  await logAdminAction(
    adminId,
    "PROVIDER",
    providerId,
    decision === "APPROVED" ? "APPROVE_PROVIDER" : "REJECT_PROVIDER",
    reason
  );

  return updated;
}
