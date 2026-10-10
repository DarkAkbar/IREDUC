import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { validate } from "../../middlewares/validate";
import * as conversationsController from "./conversations.controller";
import {
  conversationIdParamsSchema,
  createConversationSchema,
  listMessagesQuerySchema,
  sendMessageSchema,
} from "./conversations.schemas";

export const conversationsRouter = Router();

conversationsRouter.use(authenticate, requireVerifiedEmail);

conversationsRouter.post(
  "/",
  validate(createConversationSchema),
  conversationsController.create
);

conversationsRouter.get("/", conversationsController.list);

conversationsRouter.get(
  "/:id/messages",
  validate(conversationIdParamsSchema, "params"),
  validate(listMessagesQuerySchema, "query"),
  conversationsController.listMessages
);

conversationsRouter.post(
  "/:id/messages",
  validate(conversationIdParamsSchema, "params"),
  validate(sendMessageSchema),
  conversationsController.sendMessage
);

conversationsRouter.patch(
  "/:id/read",
  validate(conversationIdParamsSchema, "params"),
  conversationsController.markRead
);

conversationsRouter.get(
  "/:id/whatsapp-link",
  validate(conversationIdParamsSchema, "params"),
  conversationsController.whatsappLink
);
