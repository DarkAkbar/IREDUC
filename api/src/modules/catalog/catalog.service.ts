import { CategoryKind } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../utils/errors";

export async function listCategories(kind?: CategoryKind) {
  return prisma.category.findMany({
    where: kind ? { kind } : undefined,
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      kind: true,
      icon: true,
      parentId: true,
      sortOrder: true,
    },
  });
}

export async function listCommunes() {
  return prisma.commune.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function listNeighborhoods(communeId: string) {
  const commune = await prisma.commune.findUnique({ where: { id: communeId } });
  if (!commune) {
    throw notFound("Commune introuvable");
  }

  const neighborhoods = await prisma.neighborhood.findMany({
    where: { communeId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      communeId: true,
    },
  });

  return {
    commune: { id: commune.id, name: commune.name },
    neighborhoods,
  };
}
