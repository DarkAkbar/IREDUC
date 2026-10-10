import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const listNotificationsQuerySchema = paginationQuerySchema;

export const notificationIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de notification invalide"),
});
