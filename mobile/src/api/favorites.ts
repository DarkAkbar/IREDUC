import { api } from "./client";
import { Favorite, RequestTarget } from "./types";

export async function fetchFavorites(type?: RequestTarget) {
  const { data } = await api.get<{ data: Favorite[] }>("/favorites", {
    params: type ? { type } : undefined,
  });
  return data.data;
}

export async function addFavorite(input: {
  targetType: RequestTarget;
  propertyId?: string;
  serviceId?: string;
}) {
  const { data } = await api.post<Favorite>("/favorites", input);
  return data;
}

export async function removeFavorite(favoriteId: string) {
  const { data } = await api.delete<{ message: string }>(`/favorites/${favoriteId}`);
  return data;
}
