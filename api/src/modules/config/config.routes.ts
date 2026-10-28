import { Router } from "express";
import * as configController from "./config.controller";

export const configRouter = Router();

configRouter.get("/", configController.getConfig);
