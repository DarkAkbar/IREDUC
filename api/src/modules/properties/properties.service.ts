import {
  ListingStatus,
  MediaType,
  OfferType,
  Prisma,
  PropertyKind,
} from "@prisma/client";
import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma";
import { uploadsRoot } from "../../middlewares/upload";
import { badRequest, forbidden, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { mapPropertyDetail, mapPropertyListItem } from "./properties.mapper";

const propertyListInclude = {
  commune: { select: { id: true, name: true } },
  neighborhood: { select: { id: true, name: true } },
  media: {
    where: { type: MediaType.PHOTO },
    orderBy: { sortOrder: "asc" as const },
    take: 5,
  },
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
} satisfies Prisma.PropertyInclude;

const propertyDetailInclude = {
  ...propertyListInclude,
  category: { select: { id: true, name: true, slug: true } },
  media: {
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.PropertyInclude;

function buildOrderBy(sort: "recent" | "price_asc" | "price_desc") {
  if (sort === "price_asc") return { price: "asc" as const };
  if (sort === "price_desc") return { price: "desc" as const };
  return { createdAt: "desc" as const };
}

function assertLandRules(kind: PropertyKind, bedrooms?: number | null, bathrooms?: number | null) {
  if (kind === PropertyKind.LAND) {
    if (bedrooms != null || bathrooms != null) {
      throw badRequest(
        "Un terrain ne peut pas avoir de chambres ni de salles de bain"
      );
    }
  }
}

async function getOwnedProperty(propertyId: string, ownerId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    throw notFound("Bien introuvable");
  }
  if (property.ownerId !== ownerId) {
    throw forbidden("Vous n'êtes pas autorisé à modifier ce bien");
  }
  return property;
}

export async function listPublicProperties(query: {
  page: number;
  limit: number;
  offerType?: OfferType;
  kind?: PropertyKind;
  communeId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  q?: string;
  sort: "recent" | "price_asc" | "price_desc";
}) {
  const { page, limit, skip } = getPagination(query);

  const where: Prisma.PropertyWhereInput = {
    status: ListingStatus.APPROVED,
    ...(query.offerType ? { offerType: query.offerType } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.communeId ? { communeId: query.communeId } : {}),
    ...(query.bedrooms != null ? { bedrooms: query.bedrooms } : {}),
    ...(query.bathrooms != null ? { bathrooms: query.bathrooms } : {}),
    ...(query.minArea != null ? { areaM2: { gte: query.minArea } } : {}),
    ...(query.minPrice != null || query.maxPrice != null
      ? {
          price: {
            ...(query.minPrice != null ? { gte: query.minPrice } : {}),
            ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            {
              neighborhood: {
                name: { contains: query.q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: propertyListInclude,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: limit,
    }),
  ]);

  return buildPaginatedResult(
    rows.map(mapPropertyListItem),
    total,
    page,
    limit
  );
}

export async function getPublicProperty(id: string) {
  const property = await prisma.property.findFirst({
    where: { id, status: ListingStatus.APPROVED },
    include: propertyDetailInclude,
  });
  if (!property) {
    throw notFound("Bien introuvable");
  }

  const updated = await prisma.property.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
    include: propertyDetailInclude,
  });

  return mapPropertyDetail(updated);
}

export async function listMine(
  ownerId: string,
  query: { page: number; limit: number; status?: ListingStatus }
) {
  const { page, limit, skip } = getPagination(query);
  const where: Prisma.PropertyWhereInput = {
    ownerId,
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: propertyDetailInclude,
      orderBy: { updatedAt: "desc" },
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

export async function createProperty(
  ownerId: string,
  providerProfileId: string,
  input: {
    categoryId: string;
    offerType: OfferType;
    kind: PropertyKind;
    title: string;
    description: string;
    price: number;
    currency?: string;
    communeId: string;
    neighborhoodId?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaM2?: number | null;
    parking?: boolean | null;
    hasPool?: boolean | null;
    hasTitleDeed?: boolean | null;
    tags?: string[];
  }
) {
  assertLandRules(input.kind, input.bedrooms, input.bathrooms);

  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, kind: "REAL_ESTATE" },
  });
  if (!category) {
    throw badRequest("Catégorie immobilière invalide");
  }

  const property = await prisma.property.create({
    data: {
      ownerId,
      providerProfileId,
      categoryId: input.categoryId,
      offerType: input.offerType,
      kind: input.kind,
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      currency: input.currency ?? "USD",
      communeId: input.communeId,
      neighborhoodId: input.neighborhoodId ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      bedrooms: input.kind === PropertyKind.LAND ? null : input.bedrooms ?? null,
      bathrooms: input.kind === PropertyKind.LAND ? null : input.bathrooms ?? null,
      areaM2: input.areaM2 ?? null,
      parking: input.parking ?? null,
      hasPool: input.hasPool ?? null,
      hasTitleDeed: input.hasTitleDeed ?? null,
      tags: input.tags ?? [],
      status: ListingStatus.DRAFT,
    },
    include: propertyDetailInclude,
  });

  return mapPropertyDetail(property);
}

export async function updateProperty(
  ownerId: string,
  propertyId: string,
  input: Record<string, unknown>
) {
  const existing = await getOwnedProperty(propertyId, ownerId);
  if (
    existing.status !== ListingStatus.DRAFT &&
    existing.status !== ListingStatus.REJECTED
  ) {
    throw forbidden(
      "Seuls les biens en brouillon ou rejetés peuvent être modifiés"
    );
  }

  const nextKind = (input.kind as PropertyKind | undefined) ?? existing.kind;
  const nextBedrooms =
    input.bedrooms !== undefined
      ? (input.bedrooms as number | null)
      : existing.bedrooms;
  const nextBathrooms =
    input.bathrooms !== undefined
      ? (input.bathrooms as number | null)
      : existing.bathrooms;
  assertLandRules(nextKind, nextBedrooms, nextBathrooms);

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...input,
      ...(nextKind === PropertyKind.LAND
        ? { bedrooms: null, bathrooms: null }
        : {}),
      ...(typeof input.title === "string" ? { title: input.title.trim() } : {}),
      ...(typeof input.description === "string"
        ? { description: input.description.trim() }
        : {}),
    },
    include: propertyDetailInclude,
  });

  return mapPropertyDetail(property);
}

export async function submitProperty(ownerId: string, propertyId: string) {
  const existing = await getOwnedProperty(propertyId, ownerId);
  if (
    existing.status !== ListingStatus.DRAFT &&
    existing.status !== ListingStatus.REJECTED
  ) {
    throw forbidden("Seuls les biens en brouillon ou rejetés peuvent être soumis");
  }

  const mediaCount = await prisma.propertyMedia.count({
    where: { propertyId, type: MediaType.PHOTO },
  });
  if (mediaCount < 1) {
    throw badRequest("Ajoutez au moins une photo avant de soumettre le bien");
  }

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status: ListingStatus.PENDING,
      rejectionReason: null,
    },
    include: propertyDetailInclude,
  });

  return mapPropertyDetail(property);
}

export async function archiveProperty(ownerId: string, propertyId: string) {
  await getOwnedProperty(propertyId, ownerId);
  const property = await prisma.property.update({
    where: { id: propertyId },
    data: { status: ListingStatus.ARCHIVED },
    include: propertyDetailInclude,
  });
  return mapPropertyDetail(property);
}

export async function addMedia(
  ownerId: string,
  propertyId: string,
  file: Express.Multer.File,
  caption?: string
) {
  await getOwnedProperty(propertyId, ownerId);

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
    prisma.propertyMedia.count({
      where: { propertyId, type: MediaType.PHOTO },
    }),
    prisma.propertyMedia.count({
      where: { propertyId, type: MediaType.VIDEO },
    }),
    prisma.propertyMedia.findFirst({
      where: { propertyId },
      orderBy: { sortOrder: "desc" },
    }),
  ]);

  if (isPhoto && photoCount >= 8) {
    fs.unlinkSync(file.path);
    throw badRequest("Maximum 8 photos par bien");
  }
  if (isVideo && videoCount >= 1) {
    fs.unlinkSync(file.path);
    throw badRequest("Une seule vidéo est autorisée par bien");
  }

  const media = await prisma.propertyMedia.create({
    data: {
      propertyId,
      url: `/uploads/${file.filename}`,
      type: isVideo ? MediaType.VIDEO : MediaType.PHOTO,
      caption: caption?.trim() || null,
      sortOrder: (lastMedia?.sortOrder ?? -1) + 1,
    },
  });

  return media;
}

export async function updateMedia(
  ownerId: string,
  propertyId: string,
  mediaId: string,
  data: { caption?: string; sortOrder?: number }
) {
  await getOwnedProperty(propertyId, ownerId);
  const media = await prisma.propertyMedia.findFirst({
    where: { id: mediaId, propertyId },
  });
  if (!media) {
    throw notFound("Média introuvable");
  }

  return prisma.propertyMedia.update({
    where: { id: mediaId },
    data: {
      ...(data.caption !== undefined ? { caption: data.caption.trim() } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
}

export async function deleteMedia(
  ownerId: string,
  propertyId: string,
  mediaId: string
) {
  await getOwnedProperty(propertyId, ownerId);
  const media = await prisma.propertyMedia.findFirst({
    where: { id: mediaId, propertyId },
  });
  if (!media) {
    throw notFound("Média introuvable");
  }

  await prisma.propertyMedia.delete({ where: { id: mediaId } });

  const filename = path.basename(media.url);
  const filePath = path.join(uploadsRoot, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { message: "Média supprimé." };
}
