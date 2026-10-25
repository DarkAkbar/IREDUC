import {
  AccountStatus,
  CategoryKind,
  ListingStatus,
  ReportStatus,
  ReportTargetType,
  RequestStatus,
  RequestTarget,
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

/** "" / espaces → undefined (évite de bloquer APPROVED avec un motif vide). */
const optionalReasonSchema = z.preprocess(
  (value) => {
    if (value == null) return undefined;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().min(3, "Le motif doit contenir au moins 3 caractères").optional()
);

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: optionalReasonSchema,
  })
  .superRefine((data, ctx) => {
    if (data.decision === "REJECTED" && !data.reason) {
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

export const adminRequestsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(RequestStatus).optional(),
  type: z.nativeEnum(RequestTarget).optional(),
  search: z.string().trim().min(1).optional(),
  dateFrom: z.string().min(4).optional(),
  dateTo: z.string().min(4).optional(),
});

export const cancelRequestSchema = z.object({
  reason: z.string().min(3, "Le motif est obligatoire (3 caractères minimum)"),
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

export const settingKeyParamsSchema = z.object({
  key: z.enum([
    "general",
    "mobile",
    "validation",
    "security",
    "home",
    "notifications",
  ]),
});

export const updateSettingSchema = z.object({
  value: z.record(z.string(), z.unknown()),
  reason: z.string().trim().min(3).optional(),
});

export const settingHistoryQuerySchema = paginationQuerySchema;

export const referentialsIncludeInactiveSchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const createCommuneSchema = z.object({
  name: z.string().min(2, "Le nom de la commune est requis"),
});

export const updateCommuneSchema = z
  .object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const createNeighborhoodSchema = z.object({
  name: z.string().min(2, "Le nom du quartier est requis"),
});

export const updateNeighborhoodSchema = z
  .object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const createRejectionReasonSchema = z.object({
  label: z.string().min(2, "Le libellé est requis"),
  code: z.string().min(2).nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateRejectionReasonSchema = z
  .object({
    label: z.string().min(2).optional(),
    code: z.string().min(2).nullable().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const adminReportsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ReportStatus).optional(),
  targetType: z.nativeEnum(ReportTargetType).optional(),
});

export const updateReportSchema = z
  .object({
    status: z.nativeEnum(ReportStatus).optional(),
    adminNote: z.string().max(2000).nullable().optional(),
    action: z.enum(["hide_content", "suspend_user", "dismiss"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const reviewVisibilitySchema = z.object({
  hidden: z.boolean(),
});

export const adminCategoriesQuerySchema = z.object({
  parentId: z
    .union([z.string().uuid(), z.literal("null")])
    .optional()
    .transform((v) => (v === "null" ? null : v)),
  kind: z.nativeEnum(CategoryKind).optional(),
});
