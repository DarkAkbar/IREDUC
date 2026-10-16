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
    offerType?: string;
    kind?: string;
    price: Decimal | number;
    currency: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaM2?: number | null;
    commune: { name: string };
    neighborhood: { name: string } | null;
    media: { url: string }[];
    owner?: {
      fullName: string;
      providerProfile?: {
        displayName: string;
        logoUrl: string | null;
        reviewStatus: string;
      } | null;
    } | null;
  } | null;
  service: {
    id: string;
    title: string;
    category: { name: string };
    media: { url: string }[];
    coverageCommunes: { name: string }[];
    providerProfile?: {
      displayName: string;
      logoUrl: string | null;
      reviewStatus: string;
    } | null;
  } | null;
}) {
  if (request.targetType === "PROPERTY" && request.property) {
    const p = request.property;
    const agency = p.owner?.providerProfile;
    return {
      type: "PROPERTY" as const,
      id: p.id,
      title: p.title,
      offerType: p.offerType ?? null,
      kind: p.kind ?? null,
      photo: p.media[0]?.url ?? null,
      location: p.neighborhood
        ? `${p.neighborhood.name}, ${p.commune.name}`
        : p.commune.name,
      price: toNumber(p.price),
      currency: p.currency,
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      areaM2: p.areaM2 ?? null,
      owner: p.owner
        ? {
            fullName: agency?.displayName ?? p.owner.fullName,
            logoUrl: agency?.logoUrl ?? null,
            verified: agency?.reviewStatus === "APPROVED",
            isAgency: Boolean(agency),
          }
        : null,
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
      owner: s.providerProfile
        ? {
            fullName: s.providerProfile.displayName,
            logoUrl: s.providerProfile.logoUrl,
            verified: s.providerProfile.reviewStatus === "APPROVED",
            isAgency: true,
          }
        : null,
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
  rejectionReason?: string | null;
  createdAt: Date;
  property: {
    id: string;
    title: string;
    offerType?: string;
    kind?: string;
    price: Decimal | number;
    currency: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaM2?: number | null;
    commune: { name: string };
    neighborhood: { name: string } | null;
    media: { url: string }[];
    owner?: {
      fullName: string;
      providerProfile?: {
        displayName: string;
        logoUrl: string | null;
        reviewStatus: string;
      } | null;
    } | null;
  } | null;
  service: {
    id: string;
    title: string;
    category: { name: string };
    media: { url: string }[];
    coverageCommunes: { name: string }[];
    providerProfile?: {
      displayName: string;
      logoUrl: string | null;
      reviewStatus: string;
    } | null;
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
    rejectionReason: request.rejectionReason ?? null,
    target: mapTargetSummary(request),
    createdAt: request.createdAt,
  };
}
