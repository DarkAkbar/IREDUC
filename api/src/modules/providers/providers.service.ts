import { DocType, ProviderType, ReviewStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, conflict, notFound } from "../../utils/errors";

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
  yearsOfExperience: number | null;
  createdAt: Date;
  updatedAt: Date;
  documents?: Array<{
    id: string;
    docType: DocType;
    fileUrl: string;
    reviewStatus: ReviewStatus;
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
    yearsOfExperience: profile.yearsOfExperience,
    documents: profile.documents ?? [],
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function createProvider(
  userId: string,
  input: {
    type: ProviderType;
    displayName?: string;
    description?: string;
    contactEmail?: string;
    phone?: string;
    whatsapp: string;
    website?: string;
    address?: string;
    isRegistered: boolean;
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
      whatsapp: input.whatsapp,
      website: input.website,
      address: input.address,
      isRegistered: input.isRegistered,
      yearsOfExperience: input.yearsOfExperience,
      reviewStatus: ReviewStatus.PENDING,
    },
    include: { documents: true },
  });

  return toProvider(profile);
}

export async function getMyProvider(userId: string) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) {
    throw notFound("Profil partenaire introuvable");
  }
  return toProvider(profile);
}

export async function updateMyProvider(
  userId: string,
  data: {
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

  const profile = await prisma.providerProfile.update({
    where: { userId },
    data: {
      ...data,
      ...(data.displayName !== undefined
        ? { displayName: data.displayName.trim() }
        : {}),
    },
    include: { documents: { orderBy: { createdAt: "desc" } } },
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
