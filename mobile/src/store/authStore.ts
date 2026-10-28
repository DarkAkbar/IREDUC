import { create } from "zustand";
import {
  clearStoredTokens,
  getStoredTokens,
  setAuthFailureHandler,
  setStoredTokens,
} from "../api/client";
import * as authApi from "../api/auth";
import { AuthUser } from "../api/types";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: {
    fullName: string;
    phone: string;
    password: string;
    email?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => {
  setAuthFailureHandler(() => {
    set({ user: null, isAuthenticated: false });
  });

  return {
    user: null,
    isAuthenticated: false,
    isHydrated: false,

    hydrate: async () => {
      try {
        const { accessToken } = await getStoredTokens();
        if (!accessToken) {
          set({ isHydrated: true, isAuthenticated: false, user: null });
          return;
        }
        const user = await authApi.getMe();
        set({ user, isAuthenticated: true, isHydrated: true });
      } catch {
        await clearStoredTokens();
        set({ user: null, isAuthenticated: false, isHydrated: true });
      }
    },

    login: async (identifier, password) => {
      const data = await authApi.login(identifier.trim(), password);
      await setStoredTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    },

    register: async (input) => {
      const data = await authApi.register({
        fullName: input.fullName.trim(),
        phone: input.phone,
        password: input.password,
        email: input.email?.trim() || undefined,
      });
      await setStoredTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    },

    logout: async () => {
      try {
        await authApi.logout();
      } catch {
        await clearStoredTokens();
      }
      set({ user: null, isAuthenticated: false });
    },

    setUser: (user) => set({ user, isAuthenticated: !!user }),
  };
});
