import { ReportTargetType } from "@prisma/client";
import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().uuid("Identifiant cible invalide"),
  reason: z.string().min(3, "Le motif doit contenir au moins 3 caractères"),
  details: z.string().max(2000).optional(),
});
