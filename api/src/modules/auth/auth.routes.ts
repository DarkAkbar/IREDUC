import { Router } from "express";
import { authRateLimiter } from "../../middlewares/rateLimit";
import { validate } from "../../middlewares/validate";
import * as authController from "./auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schemas";

export const authRouter = Router();

authRouter.use(authRateLimiter);

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
authRouter.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  authController.resendVerification
);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/logout", validate(logoutSchema), authController.logout);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);
