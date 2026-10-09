export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string, details?: unknown, code = "BAD_REQUEST") {
  return new AppError(message, 400, code, details);
}

export function unauthorized(message = "Authentification requise", code = "UNAUTHORIZED") {
  return new AppError(message, 401, code);
}

export function forbidden(message = "Accès refusé", code = "FORBIDDEN") {
  return new AppError(message, 403, code);
}

export function notFound(message = "Ressource introuvable", code = "NOT_FOUND") {
  return new AppError(message, 404, code);
}

export function conflict(message: string, code = "CONFLICT") {
  return new AppError(message, 409, code);
}
