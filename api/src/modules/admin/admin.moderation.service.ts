import { ListingStatus, Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createNotification } from "../../services/notification.service";
import { badRequest, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { mapPropertyDetail } from "../properties/properties.mapper";
import { mapServiceDetail } from "../services/services.mapper";
import { logAdminAction } from "./admin.shared";

export async function listPendingProperties(query: {
  page: number;
  limit: number;
  status: ListingStatus;
  q?: string;
}) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.PropertyWhereInput = {
    status: query.status,
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
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
  q?: string;
}) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.ServiceWhereInput = {
    status: query.status,
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
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
  q?: string;
}) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.ProviderProfileWhereInput = {
    reviewStatus: query.status,
    ...(query.q
      ? {
          OR: [
            { displayName: { contains: query.q, mode: "insensitive" } },
            { user: { email: { contains: query.q, mode: "insensitive" } } },
            { user: { phone: { contains: query.q, mode: "insensitive" } } },
            { user: { fullName: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
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

export async function requestProviderComplement(
  adminId: string,
  providerId: string,
  reason: string
) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
  });
  if (!provider) {
    throw notFound("Profil partenaire introuvable");
  }
  if (provider.reviewStatus !== ReviewStatus.PENDING) {
    throw badRequest(
      "Un complément ne peut être demandé que pour un dossier en attente"
    );
  }

  await createNotification({
    userId: provider.userId,
    type: "PROVIDER_COMPLEMENT_REQUESTED",
    title: "Complément de dossier demandé",
    body: reason.trim(),
    data: { providerId },
  });

  await logAdminAction(
    adminId,
    "PROVIDER",
    providerId,
    "REQUEST_PROVIDER_COMPLEMENT",
    reason
  );

  return {
    message: "Demande de complément enregistrée.",
    providerId,
  };
}

export async function setPropertyFeatured(
  adminId: string,
  propertyId: string,
  isFeatured: boolean
) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw notFound("Bien introuvable");

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: { isFeatured },
  });

  await logAdminAction(
    adminId,
    "PROPERTY",
    propertyId,
    isFeatured ? "FEATURE_PROPERTY" : "UNFEATURE_PROPERTY"
  );

  return updated;
}

export async function setServiceFeatured(
  adminId: string,
  serviceId: string,
  isFeatured: boolean
) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw notFound("Service introuvable");

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { isFeatured },
  });

  await logAdminAction(
    adminId,
    "SERVICE",
    serviceId,
    isFeatured ? "FEATURE_SERVICE" : "UNFEATURE_SERVICE"
  );

  return updated;
}

const propertyDetailInclude = {
  commune: { select: { id: true, name: true } },
  neighborhood: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  media: { orderBy: { sortOrder: "asc" as const } },
  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      whatsapp: true,
      emailVerified: true,
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
} satisfies Prisma.PropertyInclude;

export async function getPropertyAdmin(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: propertyDetailInclude,
  });
  if (!property) throw notFound("Bien introuvable");
  return mapPropertyDetail(property);
}

export async function getServiceAdmin(serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
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
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
      media: { orderBy: { sortOrder: "asc" as const } },
      reviews: {
        include: { author: { select: { id: true, fullName: true } } },
      },
      coverageCommunes: { select: { id: true, name: true } },
    },
  });
  if (!service) throw notFound("Service introuvable");
  return mapServiceDetail(service);
}

export async function getProviderAdmin(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          whatsapp: true,
          accountStatus: true,
          createdAt: true,
        },
      },
      documents: { orderBy: { createdAt: "desc" } },
      properties: {
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      services: {
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!provider) throw notFound("Profil partenaire introuvable");

  const history = await prisma.adminAction.findMany({
    where: { targetType: "PROVIDER", targetId: providerId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      admin: { select: { id: true, fullName: true, email: true } },
    },
  });

  return { ...provider, history };
}

export async function getNextPendingProperty(excludeId?: string) {
  return prisma.property.findFirst({
    where: {
      status: ListingStatus.PENDING,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
}

export async function getNextPendingService(excludeId?: string) {
  return prisma.service.findFirst({
    where: {
      status: ListingStatus.PENDING,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
}
