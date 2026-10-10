import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { validate } from "../../middlewares/validate";
import * as reviewsController from "./reviews.controller";
import { createReviewSchema } from "./reviews.schemas";

export const reviewsRouter = Router();

reviewsRouter.use(authenticate, requireVerifiedEmail);

reviewsRouter.post("/", validate(createReviewSchema), reviewsController.create);
