import { SystemRole } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireRole } from "../../middlewares/requireRole";

export const adminRouter = Router();

adminRouter.get(
  "/ping",
  authenticate,
  requireRole(SystemRole.ADMIN, SystemRole.SUPER_ADMIN),
  (_req, res) => {
    res.status(200).json({ message: "ok" });
  }
);
