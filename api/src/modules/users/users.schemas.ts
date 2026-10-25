import { z } from "zod";

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2, "Le nom complet est requis").optional(),
    phone: z.string().min(6, "Numéro de téléphone invalide").optional(),
    email: z
      .union([z.string().email("Adresse e-mail invalide"), z.literal("")])
      .nullable()
      .optional(),
    whatsapp: z.string().min(6, "Numéro WhatsApp invalide").nullable().optional(),
    avatarUrl: z.string().url("URL d'avatar invalide").nullable().optional(),
    currentPassword: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).some((k) => k !== "currentPassword" && data[k as keyof typeof data] !== undefined), {
    message: "Aucun champ à mettre à jour",
  })
  .superRefine((data, ctx) => {
    if (data.phone !== undefined && !data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Le mot de passe actuel est requis pour changer de numéro",
      });
    }
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z
    .string()
    .refine((value) => value.length >= 8 && /\d/.test(value), {
      message:
        "Le mot de passe doit contenir au moins 8 caractères et un chiffre",
    }),
});
