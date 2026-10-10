import { Request } from "express";
import { badRequest } from "./errors";

export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw badRequest(`Paramètre ${name} invalide`);
  }
  return value;
}
