import { useRequireAuth } from "./useRequireAuth";
import { usePublishSheetStore } from "../store/publishSheetStore";

/**
 * Ouvre la feuille de publication ; demande la connexion si besoin,
 * puis rouvre la feuille après authentification.
 */
export function useOpenPublish() {
  const open = usePublishSheetStore((s) => s.open);
  const setReopenAfterAuth = usePublishSheetStore((s) => s.setReopenAfterAuth);
  const { requireAuth, isAuthenticated } = useRequireAuth();

  function openPublish(returnTo = "/(tabs)") {
    if (!isAuthenticated) {
      setReopenAfterAuth(true);
      requireAuth(returnTo);
      return;
    }
    open();
  }

  return { openPublish, isAuthenticated };
}
