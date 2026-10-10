import { ReviewStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { forbidden, unauthorized } from "../utils/errors";

export async function requireApprovedProvider(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      next(
        forbidden(
          "Un profil partenaire approuvé est requis pour publier",
          "PROVIDER_REQUIRED"
        )
      );
      return;
    }

    if (profile.reviewStatus !== ReviewStatus.APPROVED) {
      next(
        forbidden(
          "Votre profil partenaire doit être approuvé avant de publier",
          "PROVIDER_NOT_APPROVED"
        )
      );
      return;
    }

    req.providerProfile = {
      id: profile.id,
      type: profile.type,
      displayName: profile.displayName,
      reviewStatus: profile.reviewStatus,
    };
    next();
  } catch (error) {
    next(error);
  }
}
