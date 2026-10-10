import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireApprovedProvider } from "../../middlewares/requireApprovedProvider";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { listingMediaUpload } from "../../middlewares/upload";
import { validate } from "../../middlewares/validate";
import * as propertiesController from "./properties.controller";
import {
  createMediaBodySchema,
  createPropertySchema,
  listPropertiesQuerySchema,
  mediaIdParamsSchema,
  minePropertiesQuerySchema,
  propertyIdParamsSchema,
  updateMediaSchema,
  updatePropertySchema,
} from "./properties.schemas";

export const propertiesRouter = Router();

propertiesRouter.get(
  "/",
  validate(listPropertiesQuerySchema, "query"),
  propertiesController.listPublic
);

propertiesRouter.get(
  "/mine",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(minePropertiesQuerySchema, "query"),
  propertiesController.listMine
);

propertiesRouter.post(
  "/",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(createPropertySchema),
  propertiesController.create
);

propertiesRouter.get(
  "/:id",
  validate(propertyIdParamsSchema, "params"),
  propertiesController.getPublic
);

propertiesRouter.patch(
  "/:id",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(propertyIdParamsSchema, "params"),
  validate(updatePropertySchema),
  propertiesController.update
);

propertiesRouter.post(
  "/:id/submit",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(propertyIdParamsSchema, "params"),
  propertiesController.submit
);

propertiesRouter.delete(
  "/:id",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(propertyIdParamsSchema, "params"),
  propertiesController.archive
);

propertiesRouter.post(
  "/:id/media",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(propertyIdParamsSchema, "params"),
  listingMediaUpload.single("file"),
  validate(createMediaBodySchema),
  propertiesController.addMedia
);

propertiesRouter.patch(
  "/:id/media/:mediaId",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(mediaIdParamsSchema, "params"),
  validate(updateMediaSchema),
  propertiesController.updateMedia
);

propertiesRouter.delete(
  "/:id/media/:mediaId",
  authenticate,
  requireVerifiedEmail,
  requireApprovedProvider,
  validate(mediaIdParamsSchema, "params"),
  propertiesController.deleteMedia
);
