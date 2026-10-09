import { DocType, ProviderType } from "@prisma/client";
import { z } from "zod";

export const createProviderSchema = z.object({
  type: z.nativeEnum(ProviderType),
  displayName: z.string().min(2, "Le nom d'affichage est requis").optional(),
  description: z.string().max(2000).optional(),
  contactEmail: z.string().email("E-mail de contact invalide").optional(),
  phone: z.string().min(6).optional(),
  whatsapp: z.string().min(6, "Le numéro WhatsApp est requis"),
  website: z.string().url("URL invalide").optional(),
  address: z.string().optional(),
  isRegistered: z.boolean(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
});

export const updateProviderSchema = z
  .object({
    displayName: z.string().min(2).optional(),
    description: z.string().max(2000).nullable().optional(),
    contactEmail: z.string().email().nullable().optional(),
    phone: z.string().min(6).nullable().optional(),
    whatsapp: z.string().min(6).nullable().optional(),
    website: z.string().url().nullable().optional(),
    address: z.string().nullable().optional(),
    isRegistered: z.boolean().optional(),
    yearsOfExperience: z.number().int().min(0).max(80).nullable().optional(),
    logoUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const uploadDocumentSchema = z.object({
  docType: z.enum([
    DocType.ID,
    DocType.RCCM,
    DocType.PATENTE,
    DocType.PORTFOLIO,
    DocType.REFERENCE,
  ]),
});
