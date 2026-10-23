import { create } from "zustand";
import {
  OfferType,
  PropertyKind,
  RequestTarget,
} from "../api/types";

export type PublishListingType = "RENT" | "SALE" | "LAND" | "SERVICE";
export type PublishStep = 1 | 2 | 3;

export type PendingMedia = {
  key: string;
  uri: string;
  mimeType?: string;
  isVideo: boolean;
  caption: string;
};

export type PublishDraft = {
  listingType: PublishListingType;
  targetType: RequestTarget;
  listingId: string | null;
  categoryId: string | null;
  offerType: OfferType;
  kind: PropertyKind;
  title: string;
  description: string;
  price: string;
  communeId: string | null;
  neighborhoodId: string | null;
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  hasTitleDeed: boolean;
  subServices: string;
  coverageCommuneIds: string[];
  parking: boolean;
  hasPool: boolean;
  hasSecurity: boolean;
  hasGarden: boolean;
  tags: string;
  address: string;
  latitude: string;
  longitude: string;
  pendingMedia: PendingMedia[];
};

type PublishState = {
  step: PublishStep;
  draft: PublishDraft;
  uploadProgress: { done: number; total: number } | null;
  setStep: (step: PublishStep) => void;
  patchDraft: (patch: Partial<PublishDraft>) => void;
  setListingType: (listingType: PublishListingType) => void;
  reset: () => void;
  loadFromProperty: (property: {
    id: string;
    offerType: OfferType;
    kind: string;
    title: string;
    description: string;
    price: number;
    commune: { id: string };
    neighborhood: { id: string } | null;
    bedrooms: number | null;
    bathrooms: number | null;
    areaM2: number | null;
    hasTitleDeed: boolean | null;
    parking: boolean | null;
    hasPool: boolean | null;
    tags: string[];
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    category: { id: string };
  }) => void;
  loadFromService: (service: {
    id: string;
    title: string;
    description: string;
    category: { id: string };
    subServices: string[];
    coverageCommunes: { id: string }[];
  }) => void;
  setUploadProgress: (progress: { done: number; total: number } | null) => void;
};

const emptyDraft = (): PublishDraft => ({
  listingType: "RENT",
  targetType: "PROPERTY",
  listingId: null,
  categoryId: null,
  offerType: "RENT",
  kind: "APARTMENT",
  title: "",
  description: "",
  price: "",
  communeId: null,
  neighborhoodId: null,
  bedrooms: "",
  bathrooms: "",
  areaM2: "",
  hasTitleDeed: false,
  subServices: "",
  coverageCommuneIds: [],
  parking: false,
  hasPool: false,
  hasSecurity: false,
  hasGarden: false,
  tags: "",
  address: "",
  latitude: "",
  longitude: "",
  pendingMedia: [],
});

export const usePublishStore = create<PublishState>((set) => ({
  step: 1,
  draft: emptyDraft(),
  uploadProgress: null,

  setStep: (step) => set({ step }),

  patchDraft: (patch) =>
    set((state) => ({ draft: { ...state.draft, ...patch } })),

  setListingType: (listingType) =>
    set((state) => {
      if (listingType === "SERVICE") {
        return {
          draft: {
            ...state.draft,
            listingType,
            targetType: "SERVICE",
            offerType: "RENT",
            kind: "APARTMENT",
          },
        };
      }
      if (listingType === "LAND") {
        return {
          draft: {
            ...state.draft,
            listingType,
            targetType: "PROPERTY",
            offerType: "SALE",
            kind: "LAND",
            bedrooms: "",
            bathrooms: "",
          },
        };
      }
      return {
        draft: {
          ...state.draft,
          listingType,
          targetType: "PROPERTY",
          offerType: listingType === "RENT" ? "RENT" : "SALE",
          kind: state.draft.kind === "LAND" ? "APARTMENT" : state.draft.kind,
        },
      };
    }),

  reset: () => set({ step: 1, draft: emptyDraft(), uploadProgress: null }),

  loadFromProperty: (property) => {
    const listingType: PublishListingType =
      property.kind === "LAND"
        ? "LAND"
        : property.offerType === "RENT"
          ? "RENT"
          : "SALE";
    set({
      step: 1,
      draft: {
        ...emptyDraft(),
        listingType,
        targetType: "PROPERTY",
        listingId: property.id,
        categoryId: property.category.id,
        offerType: property.offerType,
        kind: property.kind as PropertyKind,
        title: property.title,
        description: property.description,
        price: String(property.price),
        communeId: property.commune.id,
        neighborhoodId: property.neighborhood?.id ?? null,
        bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
        bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
        areaM2: property.areaM2 != null ? String(property.areaM2) : "",
        hasTitleDeed: Boolean(property.hasTitleDeed),
        parking: Boolean(property.parking),
        hasPool: Boolean(property.hasPool),
        hasSecurity: property.tags.includes("Sécurité"),
        hasGarden: property.tags.includes("Jardin"),
        tags: property.tags.filter((t) => t !== "Sécurité" && t !== "Jardin").join(", "),
        address: property.address ?? "",
        latitude: property.latitude != null ? String(property.latitude) : "",
        longitude: property.longitude != null ? String(property.longitude) : "",
      },
    });
  },

  loadFromService: (service) =>
    set({
      step: 1,
      draft: {
        ...emptyDraft(),
        listingType: "SERVICE",
        targetType: "SERVICE",
        listingId: service.id,
        categoryId: service.category.id,
        title: service.title,
        description: service.description,
        subServices: service.subServices.join(", "),
        coverageCommuneIds: service.coverageCommunes.map((c) => c.id),
      },
    }),

  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
}));

export const PHOTO_CAPTIONS = [
  "Vue de face",
  "Vue gauche",
  "Vue droite",
  "Salon",
  "Cuisine",
  "Chambre",
  "Salle de bain",
  "Extérieur",
] as const;
