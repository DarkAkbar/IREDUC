import { Decimal } from "@prisma/client/runtime/library";

function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === "number" ? value : Number(value);
}

export function mapTargetSummary(request: {
  targetType: string;
  property: {
    id: string;
    title: string;
    price: Decimal | number;
    currency: string;
    commune: { name: string };
    neighborhood: { name: string } | null;
    media: { url: string }[];
  } | null;
  service: {
    id: string;
    title: string;
    category: { name: string };
    media: { url: string }[];
    coverageCommunes: { name: string }[];
  } | null;
}) {
  if (request.targetType === "PROPERTY" && request.property) {
    const p = request.property;
    return {
      type: "PROPERTY" as const,
      id: p.id,
      title: p.title,
      photo: p.media[0]?.url ?? null,
      location: p.neighborhood
        ? `${p.neighborhood.name}, ${p.commune.name}`
        : p.commune.name,
      price: toNumber(p.price),
      currency: p.currency,
    };
  }

  if (request.targetType === "SERVICE" && request.service) {
    const s = request.service;
    return {
      type: "SERVICE" as const,
      id: s.id,
      title: s.title,
      photo: s.media[0]?.url ?? null,
      location: s.coverageCommunes.map((c) => c.name).join(", ") || null,
      price: null,
      currency: null,
      category: s.category.name,
    };
  }

  return null;
}

export function mapRequestListItem(request: {
  id: string;
  number: string;
  targetType: string;
  projectType: string;
  status: string;
  paymentStatus: string;
  visitDate: Date | null;
  visitSlot: string | null;
  createdAt: Date;
  property: {
    id: string;
    title: string;
    price: Decimal | number;
    currency: string;
    commune: { name: string };
    neighborhood: { name: string } | null;
    media: { url: string }[];
  } | null;
  service: {
    id: string;
    title: string;
    category: { name: string };
    media: { url: string }[];
    coverageCommunes: { name: string }[];
  } | null;
}) {
  return {
    id: request.id,
    number: request.number,
    targetType: request.targetType,
    projectType: request.projectType,
    status: request.status,
    paymentStatus: request.paymentStatus,
    visitDate: request.visitDate,
    visitSlot: request.visitSlot,
    target: mapTargetSummary(request),
    createdAt: request.createdAt,
  };
}
