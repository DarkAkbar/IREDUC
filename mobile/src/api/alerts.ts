import { api } from "./client";
import { AlertItem, AlertCriteria } from "./types";

export async function fetchAlerts() {
  const { data } = await api.get<{ data: AlertItem[] }>("/alerts");
  return Array.isArray(data.data) ? data.data : [];
}

export async function updateAlert(
  id: string,
  input: { isActive?: boolean; criteria?: AlertCriteria }
) {
  const { data } = await api.patch<AlertItem>(`/alerts/${id}`, input);
  return data;
}

export async function deleteAlert(id: string) {
  const { data } = await api.delete<{ message: string }>(`/alerts/${id}`);
  return data;
}
