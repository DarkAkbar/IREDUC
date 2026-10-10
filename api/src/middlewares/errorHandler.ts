import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Le fichier dépasse la taille maximale de 5 Mo"
        : "Erreur lors du téléversement du fichier";
    res.status(400).json({
      message,
      code: "UPLOAD_ERROR",
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Données de requête invalides",
      code: "VALIDATION_ERROR",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    message: "Erreur interne du serveur",
    code: "INTERNAL_ERROR",
  });
}
