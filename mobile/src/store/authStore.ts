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
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<string>;
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

    login: async (email, password) => {
      const data = await authApi.login(email.trim().toLowerCase(), password);
      await setStoredTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    },

    register: async (fullName, email, password) => {
      const data = await authApi.register(
        fullName.trim(),
        email.trim().toLowerCase(),
        password
      );
      return data.message;
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
