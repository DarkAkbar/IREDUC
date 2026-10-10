import {
  AccountStatus,
  ListingStatus,
  MediaType,
  OfferType,
  PropertyKind,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { pickRandomFeaturedFirst } from "../../utils/random";
import { mapPropertyListItem } from "../properties/properties.mapper";
import { mapServiceListItem } from "../services/services.mapper";

const SECTION_LIMIT = 6;
const POOL_SIZE = 40;

const propertyInclude = {
  commune: { select: { id: true, name: true } },
  neighborhood: { select: { id: true, name: true } },
  media: {
    where: { type: MediaType.PHOTO },
    orderBy: { sortOrder: "asc" as const },
    take: 1,
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
};

const serviceInclude = {
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
    take: 1,
  },
  reviews: { select: { rating: true } },
  coverageCommunes: { select: { id: true, name: true } },
};

async function pickProperties(where: Record<string, unknown>) {
  const pool = await prisma.property.findMany({
    where: { status: ListingStatus.APPROVED, ...where },
    include: propertyInclude,
    take: POOL_SIZE,
  });
  return pickRandomFeaturedFirst(pool, SECTION_LIMIT).map(mapPropertyListItem);
}

async function pickServices(categoryId: string) {
  const pool = await prisma.service.findMany({
    where: { status: ListingStatus.APPROVED, categoryId },
    include: serviceInclude,
    take: POOL_SIZE,
  });
  return pickRandomFeaturedFirst(pool, SECTION_LIMIT).map(mapServiceListItem);
}

export async function getHomeFeed() {
  const serviceCategories = await prisma.category.findMany({
    where: { kind: "SERVICE" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const [
    featuredProperties,
    housesForRent,
    propertiesForSale,
    lands,
    activeUsers,
    verifiedProperties,
    serviceSections,
  ] = await Promise.all([
    pickProperties({ isFeatured: true }),
    pickProperties({ offerType: OfferType.RENT, kind: PropertyKind.HOUSE }),
    pickProperties({ offerType: OfferType.SALE }),
    pickProperties({ kind: PropertyKind.LAND }),
    prisma.user.count({ where: { accountStatus: AccountStatus.ACTIVE } }),
    prisma.property.count({ where: { status: ListingStatus.APPROVED } }),
    Promise.all(
      serviceCategories.map(async (category) => ({
        category,
        items: await pickServices(category.id),
      }))
    ),
  ]);

  // Si pas assez de featured, compléter avec d'autres approuvés aléatoires
  let featured = featuredProperties;
  if (featured.length < SECTION_LIMIT) {
    const extra = await pickProperties({});
    const ids = new Set(featured.map((item) => item.id));
    featured = [
      ...featured,
      ...extra.filter((item) => !ids.has(item.id)),
    ].slice(0, SECTION_LIMIT);
  }

  return {
    counters: {
      activeUsers,
      verifiedProperties,
    },
    sections: {
      featuredProperties: {
        title: "Biens à la une",
        items: featured,
      },
      housesForRent: {
        title: "Maisons à louer",
        items: housesForRent,
      },
      propertiesForSale: {
        title: "Biens à vendre",
        items: propertiesForSale,
      },
      lands: {
        title: "Terrains",
        items: lands,
      },
      servicesByCategory: serviceSections.map((section) => ({
        title: section.category.name,
        category: section.category,
        items: section.items,
      })),
    },
  };
}
