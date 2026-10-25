import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { usePublishSheetStore } from "../store/publishSheetStore";
import { PublishSheet } from "./PublishSheet";

/** Monte la feuille et la rouvre après connexion si demandé. */
export function PublishSheetHost() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const reopenAfterAuth = usePublishSheetStore((s) => s.reopenAfterAuth);
  const setReopenAfterAuth = usePublishSheetStore((s) => s.setReopenAfterAuth);
  const open = usePublishSheetStore((s) => s.open);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !reopenAfterAuth) return;
    setReopenAfterAuth(false);
    open();
  }, [
    isHydrated,
    isAuthenticated,
    reopenAfterAuth,
    setReopenAfterAuth,
    open,
  ]);

  return <PublishSheet />;
}
