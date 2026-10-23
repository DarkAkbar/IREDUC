import { api } from "./client";
import { Category, Commune, Neighborhood } from "./types";

export async function fetchCategories(kind?: "REAL_ESTATE" | "SERVICE") {
  const { data } = await api.get<{ data: Category[] }>("/categories", {
    params: kind ? { kind } : undefined,
  });
  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchCommunes() {
  const { data } = await api.get<{ data: Commune[] }>("/communes");
  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchNeighborhoods(communeId: string) {
  const { data } = await api.get<{ data: Neighborhood[] }>(
    `/communes/${communeId}/neighborhoods`
  );
  return Array.isArray(data.data) ? data.data : [];
}
