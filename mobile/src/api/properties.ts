import { api } from "./client";
import {
  CreatePropertyInput,
  ListingStatus,
  MediaItem,
  Paginated,
  PropertyDetail,
  PropertyFilters,
  PropertyListItem,
} from "./types";

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

export async function fetchMyProperties(params?: {
  page?: number;
  limit?: number;
  status?: ListingStatus;
}) {
  const { data } = await api.get<Paginated<PropertyDetail>>("/properties/mine", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      status: params?.status,
    },
  });
  return data;
}

export async function createProperty(input: CreatePropertyInput) {
  const { data } = await api.post<PropertyDetail>("/properties", input);
  return data;
}

export async function updateProperty(
  id: string,
  input: Partial<CreatePropertyInput>
) {
  const { data } = await api.patch<PropertyDetail>(`/properties/${id}`, input);
  return data;
}

export async function submitProperty(id: string) {
  const { data } = await api.post<PropertyDetail>(`/properties/${id}/submit`);
  return data;
}

export async function archiveProperty(id: string) {
  const { data } = await api.delete<PropertyDetail>(`/properties/${id}`);
  return data;
}

export async function addPropertyMedia(
  id: string,
  uri: string,
  options?: { caption?: string; mimeType?: string; isVideo?: boolean }
) {
  const form = new FormData();
  const ext = options?.isVideo ? "mp4" : "jpg";
  const name = uri.split("/").pop() ?? `media-${Date.now()}.${ext}`;
  if (options?.caption) form.append("caption", options.caption);
  form.append("file", {
    uri,
    name,
    type:
      options?.mimeType ??
      (options?.isVideo ? "video/mp4" : "image/jpeg"),
  } as unknown as Blob);
  const { data } = await api.post<MediaItem>(`/properties/${id}/media`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updatePropertyMedia(
  id: string,
  mediaId: string,
  input: { caption?: string; sortOrder?: number }
) {
  const { data } = await api.patch<MediaItem>(
    `/properties/${id}/media/${mediaId}`,
    input
  );
  return data;
}

export async function deletePropertyMedia(id: string, mediaId: string) {
  const { data } = await api.delete<{ message: string }>(
    `/properties/${id}/media/${mediaId}`
  );
  return data;
}
