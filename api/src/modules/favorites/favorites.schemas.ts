import { RequestTarget } from "@prisma/client";
import { z } from "zod";

export const createFavoriteSchema = z
  .object({
    targetType: z.nativeEnum(RequestTarget),
    propertyId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetType === RequestTarget.PROPERTY && !data.propertyId) {
      ctx.addIssue({
        code: "custom",
        path: ["propertyId"],
        message: "propertyId est requis",
      });
    }
    if (data.targetType === RequestTarget.SERVICE && !data.serviceId) {
      ctx.addIssue({
        code: "custom",
        path: ["serviceId"],
        message: "serviceId est requis",
      });
    }
  });

export const listFavoritesQuerySchema = z.object({
  type: z.nativeEnum(RequestTarget).optional(),
});

export const favoriteIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de favori invalide"),
});
