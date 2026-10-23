import rateLimit from "express-rate-limit";

/** Limite stricte sur l'authentification (bruteforce). */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives. Réessayez dans quelques minutes.",
    code: "RATE_LIMITED",
  },
});

/** Limite générale API. */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de requêtes. Réessayez plus tard.",
    code: "RATE_LIMITED",
  },
});
