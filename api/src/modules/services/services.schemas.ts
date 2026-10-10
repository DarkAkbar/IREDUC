import { ListingStatus } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const serviceSortSchema = z.enum(["recent", "title_asc"]).default("recent");

export const listServicesQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().uuid().optional(),
  communeId: z.string().uuid().optional(),
  q: z.string().trim().min(1).optional(),
  sort: serviceSortSchema,
});

export const mineServicesQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).optional(),
});

export const serviceIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de service invalide"),
});

export const serviceMediaIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de service invalide"),
  mediaId: z.string().uuid("Identifiant de média invalide"),
});

export const createServiceSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères"),
  subServices: z.array(z.string().min(1)).default([]),
  coverageCommuneIds: z
    .array(z.string().uuid())
    .min(1, "Indiquez au moins une commune de couverture"),
});

export const updateServiceSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    subServices: z.array(z.string().min(1)).optional(),
    coverageCommuneIds: z.array(z.string().uuid()).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const updateServiceMediaSchema = z
  .object({
    caption: z.string().min(1).max(120).optional(),
    sortOrder: z.coerce.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const createServiceMediaBodySchema = z.object({
  caption: z.string().min(1).max(120).optional(),
});
