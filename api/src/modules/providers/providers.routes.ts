import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { documentUpload } from "../../middlewares/upload";
import { validate } from "../../middlewares/validate";
import * as providersController from "./providers.controller";
import {
  createProviderSchema,
  updateProviderSchema,
  uploadDocumentSchema,
} from "./providers.schemas";

export const providersRouter = Router();

providersRouter.use(authenticate, requireVerifiedEmail);

providersRouter.post("/", validate(createProviderSchema), providersController.createProvider);
providersRouter.get("/me", providersController.getMyProvider);
providersRouter.patch(
  "/me",
  validate(updateProviderSchema),
  providersController.updateMyProvider
);
providersRouter.post(
  "/me/logo",
  documentUpload.single("file"),
  providersController.uploadLogo
);

providersRouter.post(
  "/me/documents",
  documentUpload.single("file"),
  validate(uploadDocumentSchema),
  providersController.uploadDocument
);
