import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { forbidden, unauthorized } from "../utils/errors";

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

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      next(
        forbidden(
          "Veuillez vérifier votre adresse e-mail avant de continuer",
          "EMAIL_NOT_VERIFIED"
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
