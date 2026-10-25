import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getErrorMessage } from "@/lib/api";
import {
  clearSession,
  getStoredUser,
  isAdminRole,
  persistSession,
  type AdminUser,
} from "@/lib/auth-storage";

type AuthContextValue = {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());

  const login = useCallback(async (identifier: string, password: string) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    const nextUser = data.user as AdminUser;
    if (!isAdminRole(nextUser.systemRole)) {
      throw new Error(
        "Accès réservé aux administrateurs. Ce compte n'est pas autorisé."
      );
    }
    persistSession(data.accessToken, data.refreshToken, nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("ireduc_admin_refresh");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // ignore logout network errors
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}

export { getErrorMessage };
