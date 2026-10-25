import { z } from "zod";

const PASSWORD_RULE_MESSAGE =
  "Le mot de passe doit contenir au moins 8 caractères et un chiffre";

const passwordSchema = z
  .string()
  .refine((value) => value.length >= 8 && /\d/.test(value), {
    message: PASSWORD_RULE_MESSAGE,
  });

export const registerSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  phone: z.string().min(6, "Numéro de téléphone invalide"),
  password: passwordSchema,
  email: z
    .union([z.string().email("Adresse e-mail invalide"), z.literal("")])
    .optional(),
});

export const verifyEmailSchema = z
  .object({
    token: z.string().min(1).optional(),
    email: z.string().email("Adresse e-mail invalide").optional(),
    code: z
      .string()
      .regex(/^\d{6}$/, "Le code doit contenir 6 chiffres")
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasToken = Boolean(value.token);
    const hasCode = Boolean(value.email && value.code);
    if (!hasToken && !hasCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fournissez un jeton ou un e-mail avec un code à 6 chiffres",
        path: ["code"],
      });
    }
  });

export const resendVerificationSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "L'identifiant est requis"),
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
