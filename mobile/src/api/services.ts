import { api } from "./client";
import {
  Paginated,
  ServiceDetail,
  ServiceFilters,
  ServiceListItem,
  ServiceReviewsResponse,
} from "./types";

export async function fetchServices(
  filters: ServiceFilters & { page?: number; limit?: number } = {}
) {
  const { data } = await api.get<Paginated<ServiceListItem>>("/services", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      categoryId: filters.categoryId,
      communeId: filters.communeId,
      q: filters.q ?? filters.subService,
      sort: filters.sort ?? "recent",
    },
  });
  return data;
}

export async function fetchService(id: string) {
  const { data } = await api.get<ServiceDetail>(`/services/${id}`);
  return data;
}

export async function fetchServiceReviews(id: string, page = 1, limit = 10) {
  const { data } = await api.get<ServiceReviewsResponse>(`/services/${id}/reviews`, {
    params: { page, limit },
  });
  return data;
}
