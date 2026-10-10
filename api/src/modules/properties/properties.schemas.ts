import { ListingStatus, OfferType, PropertyKind } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const propertySortSchema = z.enum(["recent", "price_asc", "price_desc"]).default("recent");

export const listPropertiesQuerySchema = paginationQuerySchema.extend({
  offerType: z.nativeEnum(OfferType).optional(),
  kind: z.nativeEnum(PropertyKind).optional(),
  communeId: z.string().uuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  minArea: z.coerce.number().positive().optional(),
  q: z.string().trim().min(1).optional(),
  sort: propertySortSchema,
});

export const minePropertiesQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).optional(),
});

export const propertyIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de bien invalide"),
});

export const mediaIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de bien invalide"),
  mediaId: z.string().uuid("Identifiant de média invalide"),
});

const basePropertyBody = {
  categoryId: z.string().uuid(),
  offerType: z.nativeEnum(OfferType),
  kind: z.nativeEnum(PropertyKind),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères"),
  price: z.coerce.number().positive("Le prix doit être positif"),
  currency: z.string().default("USD"),
  communeId: z.string().uuid(),
  neighborhoodId: z.string().uuid().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  areaM2: z.coerce.number().positive().optional().nullable(),
  parking: z.boolean().optional().nullable(),
  hasPool: z.boolean().optional().nullable(),
  hasTitleDeed: z.boolean().optional().nullable(),
  tags: z.array(z.string()).optional(),
};

function refineLand(data: {
  kind: PropertyKind;
  bedrooms?: number | null;
  bathrooms?: number | null;
}, ctx: z.RefinementCtx) {
  if (data.kind === PropertyKind.LAND) {
    if (data.bedrooms != null) {
      ctx.addIssue({
        code: "custom",
        path: ["bedrooms"],
        message: "Un terrain ne peut pas avoir de chambres",
      });
    }
    if (data.bathrooms != null) {
      ctx.addIssue({
        code: "custom",
        path: ["bathrooms"],
        message: "Un terrain ne peut pas avoir de salles de bain",
      });
    }
  }
}

export const createPropertySchema = z
  .object(basePropertyBody)
  .superRefine(refineLand);

export const updatePropertySchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    offerType: z.nativeEnum(OfferType).optional(),
    kind: z.nativeEnum(PropertyKind).optional(),
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    price: z.coerce.number().positive().optional(),
    currency: z.string().optional(),
    communeId: z.string().uuid().optional(),
    neighborhoodId: z.string().uuid().nullable().optional(),
    address: z.string().nullable().optional(),
    latitude: z.coerce.number().nullable().optional(),
    longitude: z.coerce.number().nullable().optional(),
    bedrooms: z.coerce.number().int().nonnegative().nullable().optional(),
    bathrooms: z.coerce.number().int().nonnegative().nullable().optional(),
    areaM2: z.coerce.number().positive().nullable().optional(),
    parking: z.boolean().nullable().optional(),
    hasPool: z.boolean().nullable().optional(),
    hasTitleDeed: z.boolean().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  })
  .superRefine((data, ctx) => {
    if (data.kind === PropertyKind.LAND || data.kind === undefined) {
      // validated in service against final kind
    }
    if (data.kind === PropertyKind.LAND) {
      refineLand(
        { kind: PropertyKind.LAND, bedrooms: data.bedrooms, bathrooms: data.bathrooms },
        ctx
      );
    }
  });

export const updateMediaSchema = z
  .object({
    caption: z.string().min(1).max(120).optional(),
    sortOrder: z.coerce.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const createMediaBodySchema = z.object({
  caption: z.string().min(1).max(120).optional(),
});
