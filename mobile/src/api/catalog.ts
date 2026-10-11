import { api } from "./client";
import { Category, Commune } from "./types";

export async function fetchCategories(kind?: "REAL_ESTATE" | "SERVICE") {
  const { data } = await api.get<Category[]>("/categories", {
    params: kind ? { kind } : undefined,
  });
  return data;
}

export async function fetchCommunes() {
  const { data } = await api.get<Commune[]>("/communes");
  return data;
}
