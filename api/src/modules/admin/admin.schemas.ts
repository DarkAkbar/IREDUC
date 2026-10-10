import { ListingStatus, ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const adminListQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).default(ListingStatus.PENDING),
});

export const adminProvidersQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ReviewStatus).default(ReviewStatus.PENDING),
});

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().min(3, "Le motif est requis en cas de rejet").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "REJECTED" && !data.reason?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Le motif est obligatoire en cas de rejet",
      });
    }
  });

export const adminIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
});
