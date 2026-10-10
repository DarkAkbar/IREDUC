import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createReviewSchema = z.object({
  requestId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const listServiceReviewsQuerySchema = paginationQuerySchema;
