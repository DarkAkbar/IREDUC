import { api } from "./client";
import {
  CreateServiceInput,
  ListingStatus,
  MediaItem,
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

export async function fetchMyServices(params?: {
  page?: number;
  limit?: number;
  status?: ListingStatus;
}) {
  const { data } = await api.get<Paginated<ServiceDetail>>("/services/mine", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      status: params?.status,
    },
  });
  return data;
}

export async function createService(input: CreateServiceInput) {
  const { data } = await api.post<ServiceDetail>("/services", input);
  return data;
}

export async function updateService(
  id: string,
  input: Partial<CreateServiceInput>
) {
  const { data } = await api.patch<ServiceDetail>(`/services/${id}`, input);
  return data;
}

export async function submitService(id: string) {
  const { data } = await api.post<ServiceDetail>(`/services/${id}/submit`);
  return data;
}

export async function archiveService(id: string) {
  const { data } = await api.delete<ServiceDetail>(`/services/${id}`);
  return data;
}

export async function addServiceMedia(
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
  const { data } = await api.post<MediaItem>(`/services/${id}/media`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateServiceMedia(
  id: string,
  mediaId: string,
  input: { caption?: string; sortOrder?: number }
) {
  const { data } = await api.patch<MediaItem>(
    `/services/${id}/media/${mediaId}`,
    input
  );
  return data;
}

export async function deleteServiceMedia(id: string, mediaId: string) {
  const { data } = await api.delete<{ message: string }>(
    `/services/${id}/media/${mediaId}`
  );
  return data;
}
