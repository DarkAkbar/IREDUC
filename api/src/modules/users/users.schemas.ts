import { z } from "zod";

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2, "Le nom complet est requis").optional(),
    phone: z.string().min(6, "Numéro de téléphone invalide").nullable().optional(),
    whatsapp: z.string().min(6, "Numéro WhatsApp invalide").nullable().optional(),
    avatarUrl: z.string().url("URL d'avatar invalide").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre"),
});
