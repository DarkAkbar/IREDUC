import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { validate } from "../../middlewares/validate";
import * as requestsController from "./requests.controller";
import {
  createRequestSchema,
  listRequestsQuerySchema,
  requestIdParamsSchema,
  reviewRequestSchema,
} from "./requests.schemas";

export const requestsRouter = Router();

requestsRouter.use(authenticate, requireVerifiedEmail);

requestsRouter.post("/", validate(createRequestSchema), requestsController.create);

requestsRouter.get(
  "/mine",
  validate(listRequestsQuerySchema, "query"),
  requestsController.listMine
);

requestsRouter.get(
  "/received",
  validate(listRequestsQuerySchema, "query"),
  requestsController.listReceived
);

requestsRouter.get(
  "/:id",
  validate(requestIdParamsSchema, "params"),
  requestsController.getById
);

requestsRouter.get(
  "/:id/similar",
  validate(requestIdParamsSchema, "params"),
  requestsController.similar
);

requestsRouter.patch(
  "/:id/review",
  validate(requestIdParamsSchema, "params"),
  validate(reviewRequestSchema),
  requestsController.review
);

requestsRouter.patch(
  "/:id/cancel",
  validate(requestIdParamsSchema, "params"),
  requestsController.cancel
);

requestsRouter.patch(
  "/:id/complete",
  validate(requestIdParamsSchema, "params"),
  requestsController.complete
);

requestsRouter.post(
  "/:id/pay",
  validate(requestIdParamsSchema, "params"),
  requestsController.pay
);
