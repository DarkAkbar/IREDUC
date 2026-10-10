import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail";
import { validate } from "../../middlewares/validate";
import * as favoritesController from "./favorites.controller";
import {
  createFavoriteSchema,
  favoriteIdParamsSchema,
  listFavoritesQuerySchema,
} from "./favorites.schemas";

export const favoritesRouter = Router();

favoritesRouter.use(authenticate, requireVerifiedEmail);

favoritesRouter.post("/", validate(createFavoriteSchema), favoritesController.create);
favoritesRouter.get(
  "/",
  validate(listFavoritesQuerySchema, "query"),
  favoritesController.list
);
favoritesRouter.delete(
  "/:id",
  validate(favoriteIdParamsSchema, "params"),
  favoritesController.remove
);
