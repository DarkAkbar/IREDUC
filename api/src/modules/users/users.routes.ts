import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import * as usersController from "./users.controller";
import { changePasswordSchema, updateProfileSchema } from "./users.schemas";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get("/me", usersController.getMe);
usersRouter.patch("/me", validate(updateProfileSchema), usersController.updateMe);
usersRouter.patch(
  "/me/password",
  validate(changePasswordSchema),
  usersController.changePassword
);
