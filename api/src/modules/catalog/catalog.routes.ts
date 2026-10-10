import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as catalogController from "./catalog.controller";
import { categoriesQuerySchema, communeIdParamsSchema } from "./catalog.schemas";

export const categoriesRouter = Router();
export const communesRouter = Router();

categoriesRouter.get(
  "/",
  validate(categoriesQuerySchema, "query"),
  catalogController.listCategories
);

communesRouter.get("/", catalogController.listCommunes);
communesRouter.get(
  "/:id/neighborhoods",
  validate(communeIdParamsSchema, "params"),
  catalogController.listNeighborhoods
);
