import { ListingStatus, MediaType, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma";
import { uploadsRoot } from "../../middlewares/upload";
import { badRequest, forbidden, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { mapServiceDetail, mapServiceListItem } from "./services.mapper";

const serviceListInclude = {
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
  media: {
    where: { type: MediaType.PHOTO },
    orderBy: { sortOrder: "asc" as const },
    take: 5,
  },
  reviews: { select: { rating: true } },
  coverageCommunes: { select: { id: true, name: true } },
} satisfies Prisma.ServiceInclude;

const serviceDetailInclude = {
  ...serviceListInclude,
  media: { orderBy: { sortOrder: "asc" as const } },
  reviews: {
    orderBy: { createdAt: "desc" as const },
    include: {
      author: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.ServiceInclude;

async function getOwnedService(serviceId: string, providerProfileId: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw notFound("Service introuvable");
  }
  if (service.providerProfileId !== providerProfileId) {
    throw forbidden("Vous n'êtes pas autorisé à modifier ce service");
  }
  return service;
}

export async function listPublicServices(query: {
  page: number;
  limit: number;
  categoryId?: string;
  communeId?: string;
  q?: string;
  sort: "recent" | "title_asc";
}) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.ServiceWhereInput = {
    status: ListingStatus.APPROVED,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.communeId
      ? { coverageCommunes: { some: { id: query.communeId } } }
      : {}),
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
      include: serviceListInclude,
      orderBy:
        query.sort === "title_asc"
          ? { title: "asc" }
          : { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return buildPaginatedResult(
    rows.map(mapServiceListItem),
    total,
    page,
    limit
  );
}

export async function getPublicService(id: string) {
  const service = await prisma.service.findFirst({
    where: { id, status: ListingStatus.APPROVED },
    include: serviceDetailInclude,
  });
  if (!service) {
    throw notFound("Service introuvable");
  }

  const updated = await prisma.service.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
    include: serviceDetailInclude,
  });

  return mapServiceDetail(updated);
}

export async function listMine(
  providerProfileId: string,
  query: { page: number; limit: number; status?: ListingStatus }
) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.ServiceWhereInput = {
    providerProfileId,
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      include: serviceDetailInclude,
      orderBy: { updatedAt: "desc" },
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

export async function createService(
  providerProfileId: string,
  input: {
    categoryId: string;
    title: string;
    description: string;
    subServices: string[];
    coverageCommuneIds: string[];
  }
) {
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, kind: "SERVICE" },
  });
  if (!category) {
    throw badRequest("Catégorie de service invalide");
  }

  const communes = await prisma.commune.findMany({
    where: { id: { in: input.coverageCommuneIds } },
  });
  if (communes.length !== input.coverageCommuneIds.length) {
    throw badRequest("Une ou plusieurs communes sont invalides");
  }

  const service = await prisma.service.create({
    data: {
      providerProfileId,
      categoryId: input.categoryId,
      title: input.title.trim(),
      description: input.description.trim(),
      subServices: input.subServices,
      status: ListingStatus.DRAFT,
      coverageCommunes: {
        connect: input.coverageCommuneIds.map((id) => ({ id })),
      },
    },
    include: serviceDetailInclude,
  });

  return mapServiceDetail(service);
}

export async function updateService(
  providerProfileId: string,
  serviceId: string,
  input: {
    categoryId?: string;
    title?: string;
    description?: string;
    subServices?: string[];
    coverageCommuneIds?: string[];
  }
) {
  const existing = await getOwnedService(serviceId, providerProfileId);
  if (
    existing.status !== ListingStatus.DRAFT &&
    existing.status !== ListingStatus.REJECTED
  ) {
    throw forbidden(
      "Seuls les services en brouillon ou rejetés peuvent être modifiés"
    );
  }

  if (input.coverageCommuneIds) {
    const communes = await prisma.commune.findMany({
      where: { id: { in: input.coverageCommuneIds } },
    });
    if (communes.length !== input.coverageCommuneIds.length) {
      throw badRequest("Une ou plusieurs communes sont invalides");
    }
  }

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.description ? { description: input.description.trim() } : {}),
      ...(input.subServices ? { subServices: input.subServices } : {}),
      ...(input.coverageCommuneIds
        ? {
            coverageCommunes: {
              set: input.coverageCommuneIds.map((id) => ({ id })),
            },
          }
        : {}),
    },
    include: serviceDetailInclude,
  });

  return mapServiceDetail(service);
}

export async function submitService(providerProfileId: string, serviceId: string) {
  const existing = await getOwnedService(serviceId, providerProfileId);
  if (
    existing.status !== ListingStatus.DRAFT &&
    existing.status !== ListingStatus.REJECTED
  ) {
    throw forbidden(
      "Seuls les services en brouillon ou rejetés peuvent être soumis"
    );
  }

  const mediaCount = await prisma.serviceMedia.count({
    where: { serviceId, type: MediaType.PHOTO },
  });
  if (mediaCount < 1) {
    throw badRequest("Ajoutez au moins une photo avant de soumettre le service");
  }

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { status: ListingStatus.PENDING, rejectionReason: null },
    include: serviceDetailInclude,
  });

  return mapServiceDetail(service);
}

export async function archiveService(
  providerProfileId: string,
  serviceId: string
) {
  await getOwnedService(serviceId, providerProfileId);
  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { status: ListingStatus.ARCHIVED },
    include: serviceDetailInclude,
  });
  return mapServiceDetail(service);
}

export async function addMedia(
  providerProfileId: string,
  serviceId: string,
  file: Express.Multer.File,
  caption?: string
) {
  await getOwnedService(serviceId, providerProfileId);

  const isVideo = file.mimetype === "video/mp4";
  const isPhoto = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);

  if (!isVideo && !isPhoto) {
    fs.unlinkSync(file.path);
    throw badRequest("Format de média non supporté");
  }
  if (isPhoto && file.size > 5 * 1024 * 1024) {
    fs.unlinkSync(file.path);
    throw badRequest("Chaque photo ne doit pas dépasser 5 Mo");
  }
  if (isVideo && file.size > 50 * 1024 * 1024) {
    fs.unlinkSync(file.path);
    throw badRequest("La vidéo ne doit pas dépasser 50 Mo");
  }

  const [photoCount, videoCount, lastMedia] = await Promise.all([
    prisma.serviceMedia.count({
      where: { serviceId, type: MediaType.PHOTO },
    }),
    prisma.serviceMedia.count({
      where: { serviceId, type: MediaType.VIDEO },
    }),
    prisma.serviceMedia.findFirst({
      where: { serviceId },
      orderBy: { sortOrder: "desc" },
    }),
  ]);

  if (isPhoto && photoCount >= 8) {
    fs.unlinkSync(file.path);
    throw badRequest("Maximum 8 photos par service");
  }
  if (isVideo && videoCount >= 1) {
    fs.unlinkSync(file.path);
    throw badRequest("Une seule vidéo est autorisée par service");
  }

  let filename = file.filename;
  if (isPhoto) {
    const { optimizeUploadedImage } = await import("../../utils/imageProcessing");
    const optimizedPath = await optimizeUploadedImage(file.path);
    filename = path.basename(optimizedPath);
  }

  return prisma.serviceMedia.create({
    data: {
      serviceId,
      url: `/uploads/${filename}`,
      type: isVideo ? MediaType.VIDEO : MediaType.PHOTO,
      caption: caption?.trim() || null,
      sortOrder: (lastMedia?.sortOrder ?? -1) + 1,
    },
  });
}

export async function updateMedia(
  providerProfileId: string,
  serviceId: string,
  mediaId: string,
  data: { caption?: string; sortOrder?: number }
) {
  await getOwnedService(serviceId, providerProfileId);
  const media = await prisma.serviceMedia.findFirst({
    where: { id: mediaId, serviceId },
  });
  if (!media) {
    throw notFound("Média introuvable");
  }

  return prisma.serviceMedia.update({
    where: { id: mediaId },
    data: {
      ...(data.caption !== undefined ? { caption: data.caption.trim() } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
}

export async function deleteMedia(
  providerProfileId: string,
  serviceId: string,
  mediaId: string
) {
  await getOwnedService(serviceId, providerProfileId);
  const media = await prisma.serviceMedia.findFirst({
    where: { id: mediaId, serviceId },
  });
  if (!media) {
    throw notFound("Média introuvable");
  }

  await prisma.serviceMedia.delete({ where: { id: mediaId } });
  const filePath = path.join(uploadsRoot, path.basename(media.url));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { message: "Média supprimé." };
}
