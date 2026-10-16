import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { PropertyFilters } from "../api/types";

const RECENT_KEY = "ireduc_recent_searches";

type SearchState = {
  filters: PropertyFilters;
  recent: string[];
  setFilters: (filters: PropertyFilters) => void;
  patchFilters: (patch: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  loadRecent: () => Promise<void>;
  addRecent: (q: string) => Promise<void>;
  clearRecent: () => Promise<void>;
};

export const useSearchStore = create<SearchState>((set, get) => ({
  filters: {},
  recent: [],

  setFilters: (filters) => set({ filters }),

  patchFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),

  resetFilters: () => set({ filters: {} }),

  loadRecent: async () => {
    const raw = await SecureStore.getItemAsync(RECENT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      set({ recent: Array.isArray(parsed) ? parsed.slice(0, 8) : [] });
    } catch {
      set({ recent: [] });
    }
  },

  addRecent: async (q) => {
    const value = q.trim();
    if (!value) return;
    const next = [value, ...get().recent.filter((r) => r !== value)].slice(0, 8);
    set({ recent: next });
    await SecureStore.setItemAsync(RECENT_KEY, JSON.stringify(next));
  },

  clearRecent: async () => {
    set({ recent: [] });
    await SecureStore.deleteItemAsync(RECENT_KEY);
  },
}));
