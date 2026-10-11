import { api } from "./client";
import { Paginated, PropertyDetail, PropertyFilters, PropertyListItem } from "./types";

export async function fetchProperties(
  filters: PropertyFilters & { page?: number; limit?: number } = {}
) {
  const { data } = await api.get<Paginated<PropertyListItem>>("/properties", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      offerType: filters.offerType,
      kind: filters.kind,
      communeId: filters.communeId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
      minArea: filters.minArea,
      q: filters.q,
      sort: filters.sort ?? "recent",
    },
  });
  return data;
}

export async function fetchProperty(id: string) {
  const { data } = await api.get<PropertyDetail>(`/properties/${id}`);
  return data;
}
