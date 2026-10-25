import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchMyProvider } from "../api/providers";
import { useAuthStore } from "../store/authStore";
import { useRequireAuth } from "../hooks/useRequireAuth";

export type PartnerGateIntent = "publish" | "become-partner" | "status";

/**
 * Aiguillage du parcours partenaire selon l'état du dossier.
 * Retourne true si la navigation a été déclenchée.
 */
export function usePartnerGate() {
  const router = useRouter();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const user = useAuthStore((s) => s.user);

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated,
    queryFn: fetchMyProvider,
    retry: false,
  });

  async function runPartnerGate(intent: PartnerGateIntent = "become-partner") {
    const returnTo =
      intent === "publish" ? "/publish" : "/partner/status";

    if (!isAuthenticated) {
      requireAuth(returnTo);
      return true;
    }

    let status = providerQuery.data?.reviewStatus ?? user?.providerProfile?.reviewStatus;
    let reviewNote = providerQuery.data?.reviewNote ?? null;

    if (!providerQuery.data && !user?.providerProfile) {
      try {
        const me = await fetchMyProvider();
        status = me.reviewStatus;
        reviewNote = me.reviewNote;
      } catch {
        status = undefined;
      }
    } else if (!providerQuery.data && user?.providerProfile) {
      try {
        const me = await fetchMyProvider();
        status = me.reviewStatus;
        reviewNote = me.reviewNote;
      } catch {
        /* keep cached */
      }
    }

    if (!status) {
      router.push("/partner" as never);
      return true;
    }

    if (status === "DRAFT") {
      router.push({
        pathname: "/partner/form",
        params: { type: providerQuery.data?.type ?? "" },
      } as never);
      return true;
    }

    if (status === "APPROVED") {
      if (intent === "publish" || intent === "become-partner") {
        router.push("/publish" as never);
      } else {
        router.push("/partner/status" as never);
      }
      return true;
    }

    // PENDING (avec ou sans complément), REJECTED → suivi
    void reviewNote;
    router.push("/partner/status" as never);
    return true;
  }

  return {
    runPartnerGate,
    provider: providerQuery.data,
    isLoading: isAuthenticated && providerQuery.isLoading,
  };
}
