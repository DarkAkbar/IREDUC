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

export type PropertyListItem = {
  id: string;
  title: string;
  offerType: "RENT" | "SALE";
  kind: string;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  commune: { id: string; name: string };
  neighborhood: { id: string; name: string } | null;
  coverPhoto: { id: string; url: string; caption: string | null } | null;
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

export type ServiceListItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  category: { id: string; name: string; slug: string };
  coverPhoto: { id: string; url: string; caption: string | null } | null;
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
