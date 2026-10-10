import { ListingStatus, MediaType, RequestTarget } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, conflict, forbidden, notFound } from "../../utils/errors";

export async function addFavorite(
  userId: string,
  input: {
    targetType: RequestTarget;
    propertyId?: string;
    serviceId?: string;
  }
) {
  if (input.targetType === RequestTarget.PROPERTY && input.propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: input.propertyId, status: ListingStatus.APPROVED },
    });
    if (!property) throw notFound("Bien introuvable");

    const existing = await prisma.favorite.findFirst({
      where: { userId, propertyId: input.propertyId },
    });
    if (existing) throw conflict("Ce bien est déjà dans vos favoris");

    return prisma.favorite.create({
      data: {
        userId,
        targetType: RequestTarget.PROPERTY,
        propertyId: input.propertyId,
      },
      include: {
        property: {
          include: {
            commune: true,
            media: {
              where: { type: MediaType.PHOTO },
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  }

  if (input.targetType === RequestTarget.SERVICE && input.serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: input.serviceId, status: ListingStatus.APPROVED },
    });
    if (!service) throw notFound("Service introuvable");

    const existing = await prisma.favorite.findFirst({
      where: { userId, serviceId: input.serviceId },
    });
    if (existing) throw conflict("Ce service est déjà dans vos favoris");

    return prisma.favorite.create({
      data: {
        userId,
        targetType: RequestTarget.SERVICE,
        serviceId: input.serviceId,
      },
      include: {
        service: {
          include: {
            category: true,
            media: {
              where: { type: MediaType.PHOTO },
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  }

  throw badRequest("Cible de favori invalide");
}

export async function listFavorites(
  userId: string,
  type?: RequestTarget
) {
  const data = await prisma.favorite.findMany({
    where: {
      userId,
      ...(type ? { targetType: type } : {}),
    },
    include: {
      property: {
        include: {
          commune: true,
          media: {
            where: { type: MediaType.PHOTO },
            take: 1,
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      service: {
        include: {
          category: true,
          media: {
            where: { type: MediaType.PHOTO },
            take: 1,
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data };
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const favorite = await prisma.favorite.findUnique({ where: { id: favoriteId } });
  if (!favorite) throw notFound("Favori introuvable");
  if (favorite.userId !== userId) {
    throw forbidden("Accès interdit à ce favori");
  }

  await prisma.favorite.delete({ where: { id: favoriteId } });
  return { message: "Favori supprimé." };
}
