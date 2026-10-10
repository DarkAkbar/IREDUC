import { Router } from "express";
import * as homeController from "./home.controller";

export const homeRouter = Router();

homeRouter.get("/", homeController.getHome);
