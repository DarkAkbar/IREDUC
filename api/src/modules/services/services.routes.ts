import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireApprovedProvider } from "../../middlewares/requireApprovedProvider";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { listingMediaUpload } from "../../middlewares/upload";
import { validate } from "../../middlewares/validate";
import * as reviewsController from "../reviews/reviews.controller";
import { listServiceReviewsQuerySchema } from "../reviews/reviews.schemas";
import * as servicesController from "./services.controller";
import {
  createServiceMediaBodySchema,
  createServiceSchema,
  listServicesQuerySchema,
  mineServicesQuerySchema,
  serviceIdParamsSchema,
  serviceMediaIdParamsSchema,
  updateServiceMediaSchema,
  updateServiceSchema,
} from "./services.schemas";

export const servicesRouter = Router();

servicesRouter.get(
  "/",
  validate(listServicesQuerySchema, "query"),
  servicesController.listPublic
);

servicesRouter.get(
  "/mine",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(mineServicesQuerySchema, "query"),
  servicesController.listMine
);

servicesRouter.post(
  "/",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(createServiceSchema),
  servicesController.create
);

servicesRouter.get(
  "/:id/reviews",
  authenticate,
  requireVerifiedEmail,
  validate(serviceIdParamsSchema, "params"),
  validate(listServiceReviewsQuerySchema, "query"),
  reviewsController.listForService
);

servicesRouter.get(
  "/:id",
  validate(serviceIdParamsSchema, "params"),
  servicesController.getPublic
);

servicesRouter.patch(
  "/:id",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(serviceIdParamsSchema, "params"),
  validate(updateServiceSchema),
  servicesController.update
);

servicesRouter.post(
  "/:id/submit",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(serviceIdParamsSchema, "params"),
  servicesController.submit
);

servicesRouter.delete(
  "/:id",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(serviceIdParamsSchema, "params"),
  servicesController.archive
);

servicesRouter.post(
  "/:id/media",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(serviceIdParamsSchema, "params"),
  listingMediaUpload.single("file"),
  validate(createServiceMediaBodySchema),
  servicesController.addMedia
);

servicesRouter.patch(
  "/:id/media/:mediaId",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(serviceMediaIdParamsSchema, "params"),
  validate(updateServiceMediaSchema),
  servicesController.updateMedia
);

servicesRouter.delete(
  "/:id/media/:mediaId",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(serviceMediaIdParamsSchema, "params"),
  servicesController.deleteMedia
);
