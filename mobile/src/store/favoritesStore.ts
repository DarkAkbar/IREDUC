import { create } from "zustand";
import * as favoritesApi from "../api/favorites";
import type { RequestTarget } from "../api/types";

type FavoritesState = {
  byKey: Record<string, string>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFavorite: (targetType: RequestTarget, targetId: string) => boolean;
  favoriteId: (targetType: RequestTarget, targetId: string) => string | undefined;
  toggle: (targetType: RequestTarget, targetId: string) => Promise<boolean>;
  clear: () => void;
};

function keyOf(targetType: RequestTarget, targetId: string) {
  return `${targetType}:${targetId}`;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  byKey: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const favorites = await favoritesApi.fetchFavorites();
      const byKey: Record<string, string> = {};
      for (const fav of favorites) {
        const targetId =
          fav.targetType === "PROPERTY" ? fav.propertyId : fav.serviceId;
        if (targetId) {
          byKey[keyOf(fav.targetType, targetId)] = fav.id;
        }
      }
      set({ byKey, hydrated: true });
    } catch {
      set({ byKey: {}, hydrated: true });
    }
  },

  isFavorite: (targetType, targetId) =>
    Boolean(get().byKey[keyOf(targetType, targetId)]),

  favoriteId: (targetType, targetId) => get().byKey[keyOf(targetType, targetId)],

  toggle: async (targetType, targetId) => {
    const mapKey = keyOf(targetType, targetId);
    const existing = get().byKey[mapKey];

    if (existing) {
      await favoritesApi.removeFavorite(existing);
      const next = { ...get().byKey };
      delete next[mapKey];
      set({ byKey: next });
      return false;
    }

    const created = await favoritesApi.addFavorite({
      targetType,
      propertyId: targetType === "PROPERTY" ? targetId : undefined,
      serviceId: targetType === "SERVICE" ? targetId : undefined,
    });
    set({ byKey: { ...get().byKey, [mapKey]: created.id } });
    return true;
  },

  clear: () => set({ byKey: {}, hydrated: false }),
}));
