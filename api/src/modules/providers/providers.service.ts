import {
  DocType,
  ProviderEventType,
  ProviderType,
  ReviewStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createNotification } from "../../services/notification.service";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { getCachedSettingObject } from "../admin/admin.settings.service";

const PARTNER_SCREEN = { screen: "partner-status" } as const;

type ValidationSettings = {
  requiredDocuments?: Partial<Record<ProviderType, string[]>>;
};

async function requiredDocsFor(type: ProviderType): Promise<DocType[]> {
  try {
    const validation =
      await getCachedSettingObject<ValidationSettings>("validation");
    const list = validation.requiredDocuments?.[type] ?? [];
    return list.filter((d): d is DocType =>
      Object.values(DocType).includes(d as DocType)
    );
  } catch {
    if (type === ProviderType.AGENCY) return [DocType.ID, DocType.RCCM];
    if (type === ProviderType.SERVICE_PROVIDER)
      return [DocType.ID, DocType.PORTFOLIO];
    return [DocType.ID];
  }
}

async function addEvent(
  profileId: string,
  type: ProviderEventType,
  message?: string | null
) {
  return prisma.providerReviewEvent.create({
    data: {
      profileId,
      type,
      message: message?.trim() || null,
    },
  });
}

async function notifyPartner(
  userId: string,
  type: string,
  title: string,
  body: string,
  extra?: Record<string, unknown>
) {
  await createNotification({
    userId,
    type,
    title,
    body,
    data: { ...PARTNER_SCREEN, ...extra },
  });
}

function toProvider(profile: {
  id: string;
  userId: string;
  type: ProviderType;
  displayName: string;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  isRegistered: boolean;
  reviewStatus: ReviewStatus;
  rejectionReason: string | null;
  reviewNote: string | null;
  yearsOfExperience: number | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  documents?: Array<{
    id: string;
    docType: DocType;
    fileUrl: string;
    reviewStatus: ReviewStatus;
    createdAt: Date;
  }>;
  events?: Array<{
    id: string;
    type: ProviderEventType;
    message: string | null;
    createdAt: Date;
  }>;
}) {
  return {
    id: profile.id,
    userId: profile.userId,
    type: profile.type,
    displayName: profile.displayName,
    logoUrl: profile.logoUrl,
    description: profile.description,
    contactEmail: profile.contactEmail,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    website: profile.website,
    address: profile.address,
    isRegistered: profile.isRegistered,
    reviewStatus: profile.reviewStatus,
    rejectionReason: profile.rejectionReason,
    reviewNote: profile.reviewNote,
    yearsOfExperience: profile.yearsOfExperience,
    submittedAt: profile.submittedAt,
    decidedAt: profile.decidedAt,
    documents: profile.documents ?? [],
    history: (profile.events ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      createdAt: e.createdAt,
    })),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

const profileInclude = {
  documents: { orderBy: { createdAt: "desc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
};

export async function createProvider(
  userId: string,
  input: {
    type: ProviderType;
    displayName?: string;
    description?: string;
    contactEmail?: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
    address?: string;
    isRegistered?: boolean;
    yearsOfExperience?: number;
  }
) {
  const existing = await prisma.providerProfile.findUnique({ where: { userId } });
  if (existing) {
    throw conflict("Un profil partenaire existe déjà pour ce compte");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw notFound("Utilisateur introuvable");
  }

  const profile = await prisma.providerProfile.create({
    data: {
      userId,
      type: input.type,
      displayName: input.displayName?.trim() || user.fullName,
      description: input.description,
      contactEmail: input.contactEmail ?? user.email,
      phone: input.phone ?? user.phone,
      whatsapp: input.whatsapp ?? user.whatsapp ?? user.phone,
      website: input.website,
      address: input.address,
      isRegistered: input.isRegistered ?? false,
      yearsOfExperience: input.yearsOfExperience,
      reviewStatus: ReviewStatus.DRAFT,
    },
    include: profileInclude,
  });

  await addEvent(profile.id, ProviderEventType.CREATED, "Brouillon créé");

  const refreshed = await prisma.providerProfile.findUniqueOrThrow({
    where: { id: profile.id },
    include: profileInclude,
  });

  return toProvider(refreshed);
}

export async function getMyProvider(userId: string) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    include: profileInclude,
  });
  if (!profile) {
    throw notFound("Profil partenaire introuvable");
  }
  return toProvider(profile);
}

export async function updateMyProvider(
  userId: string,
  data: {
    type?: ProviderType;
    displayName?: string;
    description?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    address?: string | null;
    isRegistered?: boolean;
    yearsOfExperience?: number | null;
    logoUrl?: string | null;
  }
) {
  const existing = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!existing) {
    throw notFound("Profil partenaire introuvable");
  }

  const editable =
    existing.reviewStatus === ReviewStatus.DRAFT ||
    existing.reviewStatus === ReviewStatus.REJECTED ||
    (existing.reviewStatus === ReviewStatus.PENDING &&
      Boolean(existing.reviewNote));

  if (!editable) {
    throw conflict(
      "Ce dossier ne peut plus être modifié dans son état actuel",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const profile = await prisma.providerProfile.update({
    where: { userId },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.displayName !== undefined
        ? { displayName: data.displayName.trim() }
        : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.contactEmail !== undefined
        ? { contactEmail: data.contactEmail }
        : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
      ...(data.website !== undefined ? { website: data.website } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.isRegistered !== undefined
        ? { isRegistered: data.isRegistered }
        : {}),
      ...(data.yearsOfExperience !== undefined
        ? { yearsOfExperience: data.yearsOfExperience }
        : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
    },
    include: profileInclude,
  });

  return toProvider(profile);
}

export async function submitMyProvider(userId: string) {
  const existing = await prisma.providerProfile.findUnique({
    where: { userId },
    include: { documents: true },
  });
  if (!existing) {
    throw notFound("Profil partenaire introuvable");
  }

  const canSubmit =
    existing.reviewStatus === ReviewStatus.DRAFT ||
    existing.reviewStatus === ReviewStatus.REJECTED ||
    (existing.reviewStatus === ReviewStatus.PENDING &&
      Boolean(existing.reviewNote));

  if (!canSubmit) {
    throw conflict(
      "Ce dossier ne peut pas être soumis dans son état actuel",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const required = await requiredDocsFor(existing.type);
  const present = new Set(existing.documents.map((d) => d.docType));
  const missing = required.filter((d) => !present.has(d));
  if (missing.length > 0) {
    throw badRequest("Pièces obligatoires manquantes", {
      missingDocuments: missing,
    });
  }

  if (!existing.whatsapp?.trim()) {
    throw badRequest("Le numéro WhatsApp est obligatoire pour soumettre");
  }

  const now = new Date();
  const profile = await prisma.providerProfile.update({
    where: { userId },
    data: {
      reviewStatus: ReviewStatus.PENDING,
      rejectionReason: null,
      reviewNote: null,
      submittedAt: existing.submittedAt ?? now,
      decidedAt: null,
    },
    include: profileInclude,
  });

  await addEvent(profile.id, ProviderEventType.SUBMITTED, "Dossier soumis");
  await addEvent(
    profile.id,
    ProviderEventType.UNDER_REVIEW,
    "Dossier en cours d'examen"
  );

  await notifyPartner(
    userId,
    "PROVIDER_SUBMITTED",
    "Dossier envoyé",
    "Votre demande de partenariat a été soumise. Nous l'examinons.",
    { providerId: profile.id }
  );

  const refreshed = await prisma.providerProfile.findUniqueOrThrow({
    where: { id: profile.id },
    include: profileInclude,
  });

  return toProvider(refreshed);
}

export async function withdrawMyProvider(userId: string) {
  const existing = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!existing) {
    throw notFound("Profil partenaire introuvable");
  }
  if (existing.reviewStatus !== ReviewStatus.PENDING) {
    throw conflict(
      "Seule une demande en attente peut être retirée",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const profile = await prisma.providerProfile.update({
    where: { userId },
    data: {
      reviewStatus: ReviewStatus.DRAFT,
      reviewNote: null,
      submittedAt: null,
    },
    include: profileInclude,
  });

  await addEvent(profile.id, ProviderEventType.WITHDRAWN, "Demande retirée");

  const refreshed = await prisma.providerProfile.findUniqueOrThrow({
    where: { id: profile.id },
    include: profileInclude,
  });

  return toProvider(refreshed);
}

export async function updateLogo(userId: string, filename: string) {
  const existing = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!existing) {
    throw notFound("Profil partenaire introuvable");
  }

  const editable =
    existing.reviewStatus === ReviewStatus.DRAFT ||
    existing.reviewStatus === ReviewStatus.REJECTED ||
    (existing.reviewStatus === ReviewStatus.PENDING &&
      Boolean(existing.reviewNote));

  if (!editable) {
    throw conflict(
      "Ce dossier ne peut plus être modifié dans son état actuel",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const logoUrl = `/uploads/${filename}`;
  const profile = await prisma.providerProfile.update({
    where: { userId },
    data: { logoUrl },
    include: profileInclude,
  });

  return toProvider(profile);
}

export async function addDocument(
  userId: string,
  docType: DocType,
  fileUrl: string
) {
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw notFound("Profil partenaire introuvable. Créez-le avant d'envoyer des pièces.");
  }

  const editable =
    profile.reviewStatus === ReviewStatus.DRAFT ||
    profile.reviewStatus === ReviewStatus.REJECTED ||
    (profile.reviewStatus === ReviewStatus.PENDING &&
      Boolean(profile.reviewNote));

  if (!editable) {
    throw conflict(
      "Impossible d'ajouter une pièce dans l'état actuel du dossier",
      "INVALID_STATUS_TRANSITION"
    );
  }

  if (docType === DocType.AUTRE) {
    throw badRequest("Type de document non autorisé pour cet upload");
  }

  const document = await prisma.providerDocument.create({
    data: {
      profileId: profile.id,
      docType,
      fileUrl,
      reviewStatus: ReviewStatus.PENDING,
    },
  });

  return {
    id: document.id,
    docType: document.docType,
    fileUrl: document.fileUrl,
    reviewStatus: document.reviewStatus,
    createdAt: document.createdAt,
  };
}

/** Utilisé par la modération admin pour journaliser les événements partenaire. */
export { addEvent, notifyPartner, PARTNER_SCREEN };
