import { OfferType } from "@prisma/client";
import { z } from "zod";

export const alertCriteriaSchema = z.object({
  offerType: z.nativeEnum(OfferType).optional(),
  communeId: z.string().uuid().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
});

export const createAlertSchema = z.object({
  criteria: alertCriteriaSchema,
  isActive: z.boolean().optional(),
});

export const updateAlertSchema = z
  .object({
    criteria: alertCriteriaSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const alertIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant d'alerte invalide"),
});
