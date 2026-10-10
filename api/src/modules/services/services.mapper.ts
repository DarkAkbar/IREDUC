type ProviderShape = {
  id: string;
  displayName: string;
  logoUrl: string | null;
  reviewStatus: string;
  type: string;
  yearsOfExperience: number | null;
  phone: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
};

type MediaShape = {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  sortOrder: number;
};

type ReviewShape = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  author: { id: string; fullName: string };
};

export function mapServiceListItem(service: {
  id: string;
  title: string;
  description: string;
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  category: { id: string; name: string; slug: string };
  providerProfile: ProviderShape;
  media: MediaShape[];
  reviews: { rating: number }[];
  coverageCommunes: { id: string; name: string }[];
  createdAt: Date;
}) {
  const ratings = service.reviews.map((r) => r.rating);
  const averageRating =
    ratings.length === 0
      ? null
      : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;

  return {
    id: service.id,
    title: service.title,
    description: service.description,
    status: service.status,
    isFeatured: service.isFeatured,
    viewsCount: service.viewsCount,
    category: service.category,
    coverPhoto: service.media[0]
      ? {
          id: service.media[0].id,
          url: service.media[0].url,
          caption: service.media[0].caption,
        }
      : null,
    provider: {
      id: service.providerProfile.id,
      displayName: service.providerProfile.displayName,
      logoUrl: service.providerProfile.logoUrl,
      type: service.providerProfile.type,
      verified: service.providerProfile.reviewStatus === "APPROVED",
    },
    averageRating,
    reviewsCount: ratings.length,
    coverageCommunes: service.coverageCommunes,
    createdAt: service.createdAt,
  };
}

export function mapServiceDetail(service: {
  id: string;
  title: string;
  description: string;
  subServices: string[];
  status: string;
  rejectionReason: string | null;
  isFeatured: boolean;
  viewsCount: number;
  category: { id: string; name: string; slug: string };
  providerProfile: ProviderShape;
  media: MediaShape[];
  reviews: ReviewShape[];
  coverageCommunes: { id: string; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  const list = mapServiceListItem({
    ...service,
    reviews: service.reviews.map((r) => ({ rating: r.rating })),
  });

  return {
    ...list,
    subServices: service.subServices,
    rejectionReason: service.rejectionReason,
    media: service.media,
    provider: {
      ...list.provider,
      yearsOfExperience: service.providerProfile.yearsOfExperience,
      contactEmail: service.providerProfile.contactEmail,
      phone: service.providerProfile.phone,
      whatsapp: service.providerProfile.whatsapp,
    },
    reviews: service.reviews,
    updatedAt: service.updatedAt,
  };
}
