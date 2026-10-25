import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { forbidden, unauthorized } from "../utils/errors";

/**
 * Si REQUIRE_ACCOUNT_VERIFICATION=true, exige phoneVerified.
 * Sinon (défaut) : laisse passer — le code de vérification reste disponible côté auth.
 */
export async function requireVerifiedEmail(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }

    if (!env.REQUIRE_ACCOUNT_VERIFICATION) {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { phoneVerified: true },
    });

    if (!user?.phoneVerified) {
      next(
        forbidden(
          "Veuillez vérifier votre numéro de téléphone avant de continuer",
          "PHONE_NOT_VERIFIED"
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
