import { Alert } from "react-native";
import { RequestTarget } from "../api/types";
import { useFavoritesStore } from "../store/favoritesStore";
import { useRequireAuth } from "./useRequireAuth";

export function useFavoriteToggle(returnTo?: string) {
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggle = useFavoritesStore((s) => s.toggle);

  async function onToggle(targetType: RequestTarget, targetId: string) {
    if (!requireAuth(returnTo)) return;
    try {
      const active = await toggle(targetType, targetId);
      if (!active) {
        /* retiré */
      }
    } catch (error) {
      const message =
        typeof error === "object" &&
        error &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message === "string"
          ? (error as { response: { data: { message: string } } }).response.data.message
          : "Impossible de mettre à jour le favori.";
      Alert.alert("Favoris", message);
    }
  }

  return { isFavorite, onToggle, isAuthenticated };
}
