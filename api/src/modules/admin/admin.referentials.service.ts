import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { logAdminAction } from "./admin.shared";

export async function listCommunes(includeInactive = false) {
  return prisma.commune.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { neighborhoods: true, properties: true } },
    },
  });
}

export async function createCommune(adminId: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw badRequest("Le nom de la commune est requis");
  }

  const existing = await prisma.commune.findUnique({ where: { name: trimmed } });
  if (existing) throw conflict("Une commune avec ce nom existe déjà");

  const commune = await prisma.commune.create({
    data: { name: trimmed },
  });

  await logAdminAction(adminId, "COMMUNE", commune.id, "CREATE_COMMUNE");
  return commune;
}

export async function updateCommune(
  adminId: string,
  communeId: string,
  input: { name?: string; isActive?: boolean }
) {
  const existing = await prisma.commune.findUnique({ where: { id: communeId } });
  if (!existing) throw notFound("Commune introuvable");

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 2) throw badRequest("Le nom de la commune est requis");
    if (trimmed !== existing.name) {
      const clash = await prisma.commune.findUnique({ where: { name: trimmed } });
      if (clash) throw conflict("Une commune avec ce nom existe déjà");
    }
  }

  const data: Prisma.CommuneUpdateInput = {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };

  const commune = await prisma.commune.update({
    where: { id: communeId },
    data,
  });

  await logAdminAction(adminId, "COMMUNE", communeId, "UPDATE_COMMUNE");
  return commune;
}

export async function listNeighborhoodsByCommune(
  communeId: string,
  includeInactive = false
) {
  const commune = await prisma.commune.findUnique({ where: { id: communeId } });
  if (!commune) throw notFound("Commune introuvable");

  const neighborhoods = await prisma.neighborhood.findMany({
    where: {
      communeId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { properties: true } } },
  });

  return { commune, neighborhoods };
}

export async function createNeighborhood(
  adminId: string,
  communeId: string,
  name: string
) {
  const commune = await prisma.commune.findUnique({ where: { id: communeId } });
  if (!commune) throw notFound("Commune introuvable");

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw badRequest("Le nom du quartier est requis");
  }

  const existing = await prisma.neighborhood.findUnique({
    where: { communeId_name: { communeId, name: trimmed } },
  });
  if (existing) throw conflict("Ce quartier existe déjà dans cette commune");

  const neighborhood = await prisma.neighborhood.create({
    data: { communeId, name: trimmed },
  });

  await logAdminAction(
    adminId,
    "NEIGHBORHOOD",
    neighborhood.id,
    "CREATE_NEIGHBORHOOD"
  );
  return neighborhood;
}

export async function updateNeighborhood(
  adminId: string,
  neighborhoodId: string,
  input: { name?: string; isActive?: boolean }
) {
  const existing = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
  });
  if (!existing) throw notFound("Quartier introuvable");

  if (input.isActive === false) {
    const used = await prisma.property.count({
      where: { neighborhoodId, status: { not: "ARCHIVED" } },
    });
    if (used > 0) {
      throw badRequest(
        "Impossible de désactiver un quartier utilisé par des annonces actives"
      );
    }
  }

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 2) throw badRequest("Le nom du quartier est requis");
    if (trimmed !== existing.name) {
      const clash = await prisma.neighborhood.findUnique({
        where: {
          communeId_name: { communeId: existing.communeId, name: trimmed },
        },
      });
      if (clash) throw conflict("Ce quartier existe déjà dans cette commune");
    }
  }

  const data: Prisma.NeighborhoodUpdateInput = {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };

  const neighborhood = await prisma.neighborhood.update({
    where: { id: neighborhoodId },
    data,
  });

  await logAdminAction(
    adminId,
    "NEIGHBORHOOD",
    neighborhoodId,
    "UPDATE_NEIGHBORHOOD"
  );
  return neighborhood;
}

export async function listRejectionReasons(includeInactive = false) {
  return prisma.rejectionReason.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export async function createRejectionReason(
  adminId: string,
  input: {
    label: string;
    code?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const label = input.label.trim();
  if (label.length < 2) throw badRequest("Le libellé est requis");

  const code = input.code?.trim() || null;
  if (code) {
    const clash = await prisma.rejectionReason.findUnique({ where: { code } });
    if (clash) throw conflict("Ce code existe déjà");
  }

  const reason = await prisma.rejectionReason.create({
    data: {
      label,
      code,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });

  await logAdminAction(
    adminId,
    "REJECTION_REASON",
    reason.id,
    "CREATE_REJECTION_REASON"
  );
  return reason;
}

export async function updateRejectionReason(
  adminId: string,
  reasonId: string,
  input: {
    label?: string;
    code?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const existing = await prisma.rejectionReason.findUnique({
    where: { id: reasonId },
  });
  if (!existing) throw notFound("Motif de rejet introuvable");

  if (input.code !== undefined && input.code) {
    const code = input.code.trim();
    if (code !== existing.code) {
      const clash = await prisma.rejectionReason.findUnique({ where: { code } });
      if (clash) throw conflict("Ce code existe déjà");
    }
  }

  const data: Prisma.RejectionReasonUpdateInput = {
    ...(input.label !== undefined ? { label: input.label.trim() } : {}),
    ...(input.code !== undefined ? { code: input.code?.trim() || null } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };

  const reason = await prisma.rejectionReason.update({
    where: { id: reasonId },
    data,
  });

  await logAdminAction(
    adminId,
    "REJECTION_REASON",
    reasonId,
    "UPDATE_REJECTION_REASON"
  );
  return reason;
}
