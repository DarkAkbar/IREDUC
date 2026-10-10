import { CategoryKind } from "@prisma/client";
import { z } from "zod";

export const categoriesQuerySchema = z.object({
  kind: z.nativeEnum(CategoryKind).optional(),
});

export const communeIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de commune invalide"),
});
