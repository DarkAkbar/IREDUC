import {
  AccountStatus,
  CategoryKind,
  ListingStatus,
  ReviewStatus,
  SystemRole,
} from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const adminListQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).default(ListingStatus.PENDING),
  q: z.string().trim().min(1).optional(),
});

export const adminProvidersQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ReviewStatus).default(ReviewStatus.PENDING),
  q: z.string().trim().min(1).optional(),
});

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().min(3, "Le motif est requis en cas de rejet").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "REJECTED" && !data.reason?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Le motif est obligatoire en cas de rejet",
      });
    }
  });

export const complementSchema = z.object({
  reason: z.string().min(3, "Le motif est obligatoire"),
});

export const featureSchema = z.object({
  isFeatured: z.boolean(),
});

export const adminIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
});

export const adminUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  role: z.nativeEnum(SystemRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
});

export const updateUserStatusSchema = z
  .object({
    status: z.nativeEnum(AccountStatus),
    reason: z.string().min(3).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === AccountStatus.SUSPENDED && !data.reason?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Le motif est obligatoire pour suspendre un compte",
      });
    }
  });

export const createAdminSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  phone: z.string().min(6, "Numéro de téléphone invalide"),
  email: z
    .union([z.string().email("Adresse e-mail invalide"), z.literal("")])
    .optional(),
  temporaryPassword: z
    .string()
    .refine((value) => value.length >= 8 && /\d/.test(value), {
      message:
        "Le mot de passe doit contenir au moins 8 caractères et un chiffre",
    }),
});

export const updateAdminRoleSchema = z.object({
  role: z.enum(["ADMIN", "USER"]),
});

export const auditLogQuerySchema = paginationQuerySchema.extend({
  adminId: z.string().uuid().optional(),
  action: z.string().trim().min(1).optional(),
  from: z.string().min(4).optional(),
  to: z.string().min(4).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  kind: z.nativeEnum(CategoryKind),
  icon: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
  slug: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(2).optional(),
    icon: z.string().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().optional(),
    slug: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });
