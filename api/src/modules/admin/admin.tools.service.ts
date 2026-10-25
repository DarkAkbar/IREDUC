import fs from "fs";
import path from "path";
import { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest } from "../../utils/errors";
const packageVersion = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
) as { version: string };

function escapeCsv(value: string | null | undefined) {
  const raw = value ?? "";
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export async function globalAdminSearch(q: string) {
  const term = q.trim();
  if (term.length < 2) throw badRequest("Saisissez au moins 2 caractères");

  const [users, providers, properties, services, requests] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { phone: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { id: true, fullName: true, phone: true, systemRole: true },
    }),
    prisma.providerProfile.findMany({
      where: {
        OR: [
          { displayName: { contains: term, mode: "insensitive" } },
          { user: { phone: { contains: term, mode: "insensitive" } } },
        ],
      },
      take: 8,
      select: { id: true, displayName: true, reviewStatus: true },
    }),
    prisma.property.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      take: 8,
      select: { id: true, title: true, status: true },
    }),
    prisma.service.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      take: 8,
      select: { id: true, title: true, status: true },
    }),
    prisma.request.findMany({
      where: { number: { contains: term, mode: "insensitive" } },
      take: 8,
      select: { id: true, number: true, status: true, fullName: true },
    }),
  ]);

  return { users, providers, properties, services, requests };
}

export async function exportPartnersCsv() {
  const rows = await prisma.providerProfile.findMany({
    include: { user: { select: { phone: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  const header = "id,nom,type,statut,telephone,email\n";
  const lines = rows.map((r) =>
    [
      r.id,
      escapeCsv(r.displayName),
      r.type,
      r.reviewStatus,
      escapeCsv(r.user.phone),
      escapeCsv(r.user.email),
    ].join(",")
  );
  return header + lines.join("\n");
}

export async function exportPropertiesCsv() {
  const rows = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      commune: { select: { name: true } },
    },
  });
  const header = "id,titre,statut,prix,commune\n";
  const lines = rows.map((r) =>
    [
      r.id,
      escapeCsv(r.title),
      r.status,
      r.price,
      escapeCsv(r.commune.name),
    ].join(",")
  );
  return header + lines.join("\n");
}

export async function exportRequestsCsv() {
  const rows = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      status: true,
      targetType: true,
      fullName: true,
    },
  });
  const header = "id,numero,demandeur,statut,type\n";
  const lines = rows.map((r) =>
    [r.id, r.number, escapeCsv(r.fullName), r.status, r.targetType].join(",")
  );
  return header + lines.join("\n");
}

export async function getSystemHealth() {
  const started = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatencyMs = Date.now() - started;

  const uploadsDir = path.resolve(process.cwd(), "uploads");
  let uploadsBytes = 0;
  if (fs.existsSync(uploadsDir)) {
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else uploadsBytes += fs.statSync(full).size;
      }
    };
    walk(uploadsDir);
  }

  return {
    api: "ok",
    database: "ok",
    dbLatencyMs,
    uploadsDirBytes: uploadsBytes,
    version: packageVersion.version,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}
