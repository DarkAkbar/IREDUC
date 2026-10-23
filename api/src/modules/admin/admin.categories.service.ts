import { CategoryKind, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { logAdminAction } from "./admin.shared";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(
  adminId: string,
  input: {
    name: string;
    kind: CategoryKind;
    icon?: string;
    parentId?: string | null;
    sortOrder?: number;
    slug?: string;
    isActive?: boolean;
  }
) {
  const slug = input.slug?.trim() || slugify(input.name);
  if (!slug) throw badRequest("Slug de catégorie invalide");

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw conflict("Une catégorie avec ce slug existe déjà");

  if (input.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) throw notFound("Catégorie parente introuvable");
  }

  const category = await prisma.category.create({
    data: {
      name: input.name.trim(),
      slug,
      kind: input.kind,
      icon: input.icon ?? null,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });

  await logAdminAction(adminId, "CATEGORY", category.id, "CREATE_CATEGORY");
  return category;
}

export async function updateCategory(
  adminId: string,
  categoryId: string,
  input: {
    name?: string;
    icon?: string | null;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    slug?: string;
  }
) {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) throw notFound("Catégorie introuvable");

  if (input.slug && input.slug !== existing.slug) {
    const clash = await prisma.category.findUnique({
      where: { slug: input.slug },
    });
    if (clash) throw conflict("Une catégorie avec ce slug existe déjà");
  }

  if (input.parentId) {
    if (input.parentId === categoryId) {
      throw badRequest("Une catégorie ne peut pas être sa propre parente");
    }
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) throw notFound("Catégorie parente introuvable");
  }

  const data: Prisma.CategoryUpdateInput = {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.icon !== undefined ? { icon: input.icon } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
    ...(input.parentId !== undefined
      ? input.parentId
        ? { parent: { connect: { id: input.parentId } } }
        : { parent: { disconnect: true } }
      : {}),
  };

  const category = await prisma.category.update({
    where: { id: categoryId },
    data,
  });

  await logAdminAction(adminId, "CATEGORY", categoryId, "UPDATE_CATEGORY");
  return category;
}
