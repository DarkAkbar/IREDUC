import { api } from "./client";
import {
  CreateRequestInput,
  Paginated,
  PropertyListItem,
  RequestCounters,
  RequestDetail,
  RequestListItem,
  RequestStatus,
} from "./types";

export async function createRequest(input: CreateRequestInput) {
  const { data } = await api.post<RequestListItem>("/requests", input);
  return data;
}

export async function fetchMyRequests(params?: {
  page?: number;
  limit?: number;
  status?: RequestStatus;
}) {
  const { data } = await api.get<
    Paginated<RequestListItem> & { counters: RequestCounters }
  >("/requests/mine", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      status: params?.status,
    },
  });
  return data;
}

export async function fetchRequest(id: string) {
  const { data } = await api.get<RequestDetail>(`/requests/${id}`);
  return data;
}

export async function cancelRequest(id: string) {
  const { data } = await api.patch<RequestListItem>(`/requests/${id}/cancel`);
  return data;
}

export async function payRequest(id: string) {
  const { data } = await api.post<RequestListItem>(`/requests/${id}/pay`);
  return data;
}

export async function fetchSimilarRequests(id: string) {
  const { data } = await api.get<{ data: PropertyListItem[] }>(
    `/requests/${id}/similar`
  );
  return Array.isArray(data.data) ? data.data : [];
}
