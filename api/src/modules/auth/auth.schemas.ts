import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre");

export const registerSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Adresse e-mail invalide"),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Le jeton est requis"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Le jeton de rafraîchissement est requis"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Le jeton de rafraîchissement est requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Le jeton est requis"),
  password: passwordSchema,
});
