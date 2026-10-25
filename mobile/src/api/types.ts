export type AuthUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  systemRole: "USER" | "ADMIN" | "SUPER_ADMIN";
  accountStatus: "ACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  phoneVerified: boolean;
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
  rejectionReason?: string | null;
  contacts: {
    phoneMasked: string | null;
    whatsapp: string | null;
  };
  updatedAt: string;
};

export type ListingStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type CreatePropertyInput = {
  categoryId: string;
  offerType: OfferType;
  kind: PropertyKind;
  title: string;
  description: string;
  price: number;
  currency?: string;
  communeId: string;
  neighborhoodId?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  parking?: boolean | null;
  hasPool?: boolean | null;
  hasTitleDeed?: boolean | null;
  tags?: string[];
};

export type CreateServiceInput = {
  categoryId: string;
  title: string;
  description: string;
  subServices: string[];
  coverageCommuneIds: string[];
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
  rejectionReason?: string | null;
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

export type Neighborhood = {
  id: string;
  name: string;
  communeId?: string;
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

export type ProjectType = "RENT" | "BUY" | "OTHER";
export type VisitMode = "PHYSICAL" | "VIRTUAL";
export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";
export type PaymentStatus = "UNPAID" | "PAID";

export type RequestTargetOwner = {
  fullName: string;
  logoUrl: string | null;
  verified: boolean;
  isAgency: boolean;
};

export type RequestTargetSummary = {
  type: RequestTarget;
  id: string;
  title: string;
  photo: string | null;
  location: string | null;
  price: number | null;
  currency: string | null;
  offerType?: string | null;
  kind?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  category?: string;
  owner?: RequestTargetOwner | null;
};

export type RequestListItem = {
  id: string;
  number: string;
  targetType: RequestTarget;
  projectType: ProjectType;
  status: RequestStatus;
  paymentStatus: PaymentStatus;
  visitDate: string | null;
  visitSlot: string | null;
  rejectionReason?: string | null;
  target: RequestTargetSummary | null;
  createdAt: string;
};

export type RequestDetail = RequestListItem & {
  desiredDate: string | null;
  durationMonths: number | null;
  occupants: number | null;
  visitMode: VisitMode | null;
  fullName: string;
  phone: string;
  email: string;
  whatsapp: string | null;
  message: string | null;
  rejectionReason: string | null;
  requester: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  accessRole: "requester" | "owner";
  updatedAt: string;
};

export type RequestCounters = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
};

export type CreateRequestInput = {
  targetType: RequestTarget;
  propertyId?: string;
  serviceId?: string;
  projectType: ProjectType;
  desiredDate?: string;
  durationMonths?: number;
  occupants?: number;
  visitMode?: VisitMode;
  visitDate?: string;
  visitSlot?: string;
  fullName: string;
  phone: string;
  email: string;
  whatsapp?: string;
  message?: string;
};

export type ConversationParticipant = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  whatsapp?: string | null;
};

export type ConversationTargetProperty = {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  offerType?: OfferType;
  photo?: string | null;
};

export type ConversationTargetService = {
  id: string;
  title: string;
  photo?: string | null;
};

export type Message = {
  id: string;
  conversationId?: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

export type ConversationListItem = {
  id: string;
  request: { id: string; number: string } | null;
  property: ConversationTargetProperty | null;
  service: ConversationTargetService | null;
  otherParticipant: ConversationParticipant | null;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
};

export type ConversationDetail = {
  id: string;
  requestId?: string | null;
  propertyId?: string | null;
  serviceId?: string | null;
  participants?: Array<{ userId: string }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateConversationInput = {
  requestId?: string;
  propertyId?: string;
  serviceId?: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: {
    requestId?: string;
    conversationId?: string;
    messageId?: string;
    number?: string;
    decision?: string;
  } | null;
  readAt: string | null;
  createdAt: string;
};

export type AlertCriteria = {
  offerType?: OfferType;
  communeId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
};

export type AlertItem = {
  id: string;
  criteria: AlertCriteria;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProviderType = "INDIVIDUAL" | "AGENCY" | "SERVICE_PROVIDER";

export type ProviderDocument = {
  id: string;
  docType: "ID" | "RCCM" | "PATENTE" | "PORTFOLIO" | "REFERENCE";
  fileUrl: string;
  reviewStatus: string;
  createdAt: string;
};

export type ProviderProfile = {
  id: string;
  userId: string;
  type: ProviderType | string;
  displayName: string;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  website?: string | null;
  address?: string | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | string;
  rejectionReason: string | null;
  isRegistered: boolean;
  yearsOfExperience: number | null;
  documents?: ProviderDocument[];
  createdAt: string;
  updatedAt: string;
};

export type CreateProviderInput = {
  type: ProviderType;
  displayName?: string;
  description?: string;
  contactEmail?: string;
  phone?: string;
  whatsapp: string;
  website?: string;
  address?: string;
  isRegistered: boolean;
  yearsOfExperience?: number;
};

export type UpdateProviderInput = {
  displayName?: string;
  description?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: string | null;
  isRegistered?: boolean;
  yearsOfExperience?: number | null;
};
