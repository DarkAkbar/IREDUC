import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createConversationSchema = z
  .object({
    requestId: z.string().uuid().optional(),
    propertyId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    const count = [data.requestId, data.propertyId, data.serviceId].filter(Boolean).length;
    if (count !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Fournissez exactement une cible : requestId, propertyId ou serviceId",
      });
    }
  });

export const conversationIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de conversation invalide"),
});

export const listMessagesQuerySchema = paginationQuerySchema;

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Le message ne peut pas être vide").max(2000),
});
