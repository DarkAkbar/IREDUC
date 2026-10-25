import {
  ProjectType,
  RequestStatus,
  RequestTarget,
  VisitMode,
} from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createRequestSchema = z
  .object({
    targetType: z.nativeEnum(RequestTarget),
    propertyId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
    projectType: z.nativeEnum(ProjectType),
    desiredDate: z.coerce.date().optional(),
    durationMonths: z.coerce.number().int().positive().optional(),
    occupants: z.coerce.number().int().positive().optional(),
    visitMode: z.nativeEnum(VisitMode).optional(),
    visitDate: z.coerce.date().optional(),
    visitSlot: z.string().min(1).max(50).optional(),
    fullName: z.string().min(2, "Le nom complet est requis"),
    phone: z.string().min(6, "Numéro de téléphone invalide"),
    email: z
      .union([z.string().email("Adresse e-mail invalide"), z.literal("")])
      .optional(),
    whatsapp: z.string().min(6).optional(),
    message: z.string().max(500, "Le message ne peut pas dépasser 500 caractères").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetType === RequestTarget.PROPERTY) {
      if (!data.propertyId) {
        ctx.addIssue({
          code: "custom",
          path: ["propertyId"],
          message: "propertyId est requis pour une demande de bien",
        });
      }
      if (data.serviceId) {
        ctx.addIssue({
          code: "custom",
          path: ["serviceId"],
          message: "serviceId ne doit pas être fourni pour une demande de bien",
        });
      }
    }
    if (data.targetType === RequestTarget.SERVICE) {
      if (!data.serviceId) {
        ctx.addIssue({
          code: "custom",
          path: ["serviceId"],
          message: "serviceId est requis pour une demande de service",
        });
      }
      if (data.propertyId) {
        ctx.addIssue({
          code: "custom",
          path: ["propertyId"],
          message: "propertyId ne doit pas être fourni pour une demande de service",
        });
      }
    }
  });

export const listRequestsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(RequestStatus).optional(),
});

export const requestIdParamsSchema = z.object({
  id: z.string().uuid("Identifiant de demande invalide"),
});

export const reviewRequestSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().min(3).optional(),
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
