import { create } from "zustand";
import * as favoritesApi from "../api/favorites";
import type { Favorite, RequestTarget } from "../api/types";

type FavoritesState = {
  byKey: Record<string, string>;
  items: Favorite[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFavorite: (targetType: RequestTarget, targetId: string) => boolean;
  favoriteId: (targetType: RequestTarget, targetId: string) => string | undefined;
  toggle: (targetType: RequestTarget, targetId: string) => Promise<boolean>;
  clear: () => void;
};

export function favoriteKey(targetType: RequestTarget, targetId: string) {
  return `${targetType}:${targetId}`;
}

function targetIdOf(fav: Favorite): string | null {
  if (fav.targetType === "PROPERTY") {
    return fav.propertyId ?? fav.property?.id ?? null;
  }
  return fav.serviceId ?? fav.service?.id ?? null;
}

function mapByKey(favorites: Favorite[]) {
  const byKey: Record<string, string> = {};
  for (const fav of favorites) {
    const targetId = targetIdOf(fav);
    if (targetId) {
      byKey[favoriteKey(fav.targetType, targetId)] = fav.id;
    }
  }
  return byKey;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  byKey: {},
  items: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const favorites = await favoritesApi.fetchFavorites();
      const list = Array.isArray(favorites) ? favorites : [];
      set({ byKey: mapByKey(list), items: list, hydrated: true });
    } catch {
      // Ne pas effacer les favoris déjà connus si le réseau échoue au démarrage
      set({ hydrated: true });
    }
  },

  isFavorite: (targetType, targetId) =>
    Boolean(get().byKey[favoriteKey(targetType, targetId)]),

  favoriteId: (targetType, targetId) =>
    get().byKey[favoriteKey(targetType, targetId)],

  toggle: async (targetType, targetId) => {
    const mapKey = favoriteKey(targetType, targetId);
    const existing = get().byKey[mapKey];

    if (existing) {
      await favoritesApi.removeFavorite(existing);
      const nextByKey = { ...get().byKey };
      delete nextByKey[mapKey];
      set({
        byKey: nextByKey,
        items: get().items.filter((item) => item.id !== existing),
      });
      return false;
    }

    const created = await favoritesApi.addFavorite({
      targetType,
      propertyId: targetType === "PROPERTY" ? targetId : undefined,
      serviceId: targetType === "SERVICE" ? targetId : undefined,
    });

    set({
      byKey: { ...get().byKey, [mapKey]: created.id },
      items: [created, ...get().items.filter((item) => item.id !== created.id)],
    });

    // Recharger la liste complète (médias / titres) pour l'écran Favoris
    try {
      const favorites = await favoritesApi.fetchFavorites();
      const list = Array.isArray(favorites) ? favorites : [];
      set({ byKey: mapByKey(list), items: list });
    } catch {
      /* garde l'état local */
    }

    return true;
  },

  clear: () => set({ byKey: {}, items: [], hydrated: false }),
}));
