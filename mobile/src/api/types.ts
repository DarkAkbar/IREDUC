export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  systemRole: "USER" | "ADMIN" | "SUPER_ADMIN";
  accountStatus: "ACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  avatarUrl: string | null;
  providerProfile: {
    id: string;
    type: string;
    displayName: string;
    reviewStatus: string;
    isRegistered: boolean;
  } | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type OfferType = "RENT" | "SALE";
export type PropertyKind = "HOUSE" | "APARTMENT" | "VILLA" | "LAND";
export type PropertySort = "recent" | "price_asc" | "price_desc";
export type ServiceSort = "recent" | "title_asc";
export type RequestTarget = "PROPERTY" | "SERVICE";

export type MediaItem = {
  id: string;
  url: string;
  caption: string | null;
  type?: string;
  sortOrder?: number;
};

export type PropertyListItem = {
  id: string;
  title: string;
  offerType: OfferType;
  kind: PropertyKind | string;
  price: number;
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
  coverPhoto: { id: string; url: string; caption: string | null } | null;
  photos?: MediaItem[];
  owner: {
    id: string;
    fullName: string;
    verified: boolean;
    agency: {
      id: string;
      displayName: string;
      type: string;
      logoUrl: string | null;
    } | null;
  };
  createdAt: string;
};

export type PropertyDetail = PropertyListItem & {
  description: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  parking: boolean | null;
  hasPool: boolean | null;
  hasTitleDeed: boolean | null;
  tags: string[];
  category: { id: string; name: string; slug: string };
  media: MediaItem[];
  contacts: {
    phoneMasked: string | null;
    whatsapp: string | null;
  };
  updatedAt: string;
};

export type ServiceListItem = {
  id: string;
  title: string;
  description: string;
  subServices?: string[];
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  category: { id: string; name: string; slug: string };
  coverPhoto: { id: string; url: string; caption: string | null } | null;
  photos?: MediaItem[];
  provider: {
    id: string;
    displayName: string;
    logoUrl: string | null;
    type: string;
    verified: boolean;
  };
  averageRating: number | null;
  reviewsCount: number;
  coverageCommunes: { id: string; name: string }[];
  createdAt: string;
};

export type ServiceDetail = ServiceListItem & {
  subServices: string[];
  media: MediaItem[];
  provider: ServiceListItem["provider"] & {
    yearsOfExperience: number | null;
    contactEmail: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    author: { id: string; fullName: string };
  }>;
  updatedAt: string;
};

export type PaginatedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  kind: "REAL_ESTATE" | "SERVICE";
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
};

export type Commune = {
  id: string;
  name: string;
};

export type Favorite = {
  id: string;
  targetType: RequestTarget;
  propertyId: string | null;
  serviceId: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    price: number | string;
    offerType: OfferType;
    commune: { id: string; name: string };
    media: MediaItem[];
  } | null;
  service: {
    id: string;
    title: string;
    category: { id: string; name: string; slug: string };
    media: MediaItem[];
  } | null;
};

export type ServiceReviewsResponse = Paginated<{
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; fullName: string; avatarUrl: string | null };
}> & {
  summary: {
    averageRating: number | null;
    totalRatings: number;
    distribution: Record<"1" | "2" | "3" | "4" | "5", number> | {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
    percentage: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
};

export type HomeResponse = {
  counters: {
    activeUsers: number;
    verifiedProperties: number;
  };
  sections: {
    featuredProperties: { title: string; items: PropertyListItem[] };
    housesForRent: { title: string; items: PropertyListItem[] };
    propertiesForSale: { title: string; items: PropertyListItem[] };
    lands: { title: string; items: PropertyListItem[] };
    servicesByCategory: Array<{
      title: string;
      category: { id: string; name: string; slug: string };
      items: ServiceListItem[];
    }>;
  };
};

export type PropertyFilters = {
  offerType?: OfferType;
  kind?: PropertyKind;
  communeId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  q?: string;
  sort?: PropertySort;
};

export type ServiceFilters = {
  categoryId?: string;
  communeId?: string;
  q?: string;
  sort?: ServiceSort;
  subService?: string;
};
