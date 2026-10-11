import { Decimal } from "@prisma/client/runtime/library";
import { maskPhone } from "../../utils/contacts";

function toNumber(value: Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

type OwnerShape = {
  id: string;
  fullName: string;
  emailVerified: boolean;
  phone: string | null;
  whatsapp: string | null;
  providerProfile: {
    id: string;
    displayName: string;
    type: string;
    logoUrl: string | null;
    reviewStatus: string;
    phone: string | null;
    whatsapp: string | null;
  } | null;
};

type MediaShape = {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  sortOrder: number;
};

export function mapPropertyListItem(property: {
  id: string;
  title: string;
  offerType: string;
  kind: string;
  price: Decimal | number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  parking?: boolean | null;
  hasPool?: boolean | null;
  tags?: string[];
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  commune: { id: string; name: string };
  neighborhood: { id: string; name: string } | null;
  media: MediaShape[];
  owner: OwnerShape;
  createdAt: Date;
}) {
  const cover = property.media[0] ?? null;
  const verified =
    property.owner.emailVerified &&
    property.owner.providerProfile?.reviewStatus === "APPROVED";

  return {
    id: property.id,
    title: property.title,
    offerType: property.offerType,
    kind: property.kind,
    price: toNumber(property.price),
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaM2: property.areaM2,
    parking: property.parking ?? null,
    hasPool: property.hasPool ?? null,
    tags: property.tags ?? [],
    status: property.status,
    isFeatured: property.isFeatured,
    viewsCount: property.viewsCount,
    commune: property.commune,
    neighborhood: property.neighborhood,
    coverPhoto: cover
      ? { id: cover.id, url: cover.url, caption: cover.caption }
      : null,
    photos: property.media.map((m) => ({
      id: m.id,
      url: m.url,
      caption: m.caption,
      type: m.type,
    })),
    owner: {
      id: property.owner.id,
      fullName: property.owner.fullName,
      verified,
      agency: property.owner.providerProfile
        ? {
            id: property.owner.providerProfile.id,
            displayName: property.owner.providerProfile.displayName,
            type: property.owner.providerProfile.type,
            logoUrl: property.owner.providerProfile.logoUrl,
          }
        : null,
    },
    createdAt: property.createdAt,
  };
}

export function mapPropertyDetail(property: {
  id: string;
  title: string;
  description: string;
  offerType: string;
  kind: string;
  price: Decimal | number;
  currency: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  parking: boolean | null;
  hasPool: boolean | null;
  hasTitleDeed: boolean | null;
  tags: string[];
  status: string;
  rejectionReason: string | null;
  isFeatured: boolean;
  viewsCount: number;
  category: { id: string; name: string; slug: string };
  commune: { id: string; name: string };
  neighborhood: { id: string; name: string } | null;
  media: MediaShape[];
  owner: OwnerShape;
  createdAt: Date;
  updatedAt: Date;
}) {
  const list = mapPropertyListItem(property);
  const agency = property.owner.providerProfile;

  return {
    ...list,
    description: property.description,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    parking: property.parking,
    hasPool: property.hasPool,
    hasTitleDeed: property.hasTitleDeed,
    tags: property.tags,
    rejectionReason: property.rejectionReason,
    category: property.category,
    media: property.media,
    contacts: {
      phoneMasked: maskPhone(agency?.phone ?? property.owner.phone),
      whatsapp: agency?.whatsapp ?? property.owner.whatsapp,
    },
    updatedAt: property.updatedAt,
  };
}
