import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";

/**
 * Redirige vers la connexion si l'utilisateur n'est pas authentifié.
 * `returnTo` est stocké pour revenir après login.
 */
export function useRequireAuth() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  function requireAuth(returnTo?: string) {
    if (isAuthenticated) return true;
    router.push({
      pathname: "/auth/login",
      params: returnTo ? { returnTo } : undefined,
    });
    return false;
  }

  return { requireAuth, isAuthenticated };
}
