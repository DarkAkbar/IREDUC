import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { documentUpload } from "../../middlewares/upload";
import { validate } from "../../middlewares/validate";
import * as usersController from "./users.controller";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "./users.schemas";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get("/me", usersController.getMe);
usersRouter.get("/me/summary", usersController.getSummary);
usersRouter.patch("/me", validate(updateProfileSchema), usersController.updateMe);
usersRouter.post(
  "/me/avatar",
  documentUpload.single("file"),
  usersController.uploadAvatar
);
usersRouter.patch(
  "/me/password",
  validate(changePasswordSchema),
  usersController.changePassword
);
usersRouter.delete(
  "/me",
  validate(deleteAccountSchema),
  usersController.deleteAccount
);

usersRouter.get("/me/sessions", usersController.listSessions);
usersRouter.delete(
  "/me/sessions/others",
  usersController.revokeOtherSessions
);
usersRouter.delete("/me/sessions/:id", usersController.revokeSession);
