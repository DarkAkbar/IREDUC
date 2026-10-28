import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchMyProvider } from "../api/providers";
import { useAuthStore } from "../store/authStore";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { PublishListingType, usePublishStore } from "../store/publishStore";

export type PartnerGateIntent = "publish" | "become-partner" | "status";

export type PartnerGateOptions = {
  listingType?: PublishListingType;
  partnerType?: "INDIVIDUAL" | "AGENCY" | "SERVICE_PROVIDER";
  /** Ne pas réinitialiser le brouillon d'annonce. */
  resumeDraft?: boolean;
};

/**
 * Aiguillage du parcours partenaire selon l'état du dossier.
 * Retourne true si la navigation a été déclenchée.
 */
export function usePartnerGate() {
  const router = useRouter();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const setListingType = usePublishStore((s) => s.setListingType);
  const resetPublish = usePublishStore((s) => s.reset);

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated,
    queryFn: fetchMyProvider,
    retry: false,
  });

  async function runPartnerGate(
    intent: PartnerGateIntent = "become-partner",
    options: PartnerGateOptions = {}
  ) {
    if (options.listingType) {
      setListingType(options.listingType);
    }

    const listingQuery = options.listingType
      ? `?listingType=${options.listingType}`
      : "";
    const returnTo =
      intent === "publish" ? `/publish${listingQuery}` : "/partner/status";

    if (!isAuthenticated) {
      requireAuth(returnTo);
      return true;
    }

    let status =
      providerQuery.data?.reviewStatus ?? user?.providerProfile?.reviewStatus;
    let reviewNote: string | null = providerQuery.data?.reviewNote ?? null;
    let providerType =
      options.partnerType ??
      (providerQuery.data?.type as PartnerGateOptions["partnerType"]) ??
      undefined;

    if (!providerQuery.data) {
      try {
        const me = await fetchMyProvider();
        status = me.reviewStatus;
        reviewNote = me.reviewNote ?? null;
        providerType =
          options.partnerType ??
          (me.type as PartnerGateOptions["partnerType"]) ??
          providerType;
      } catch {
        if (!user?.providerProfile) status = undefined;
      }
    }

    if (!status) {
      router.push({
        pathname: "/partner",
        params: {
          ...(providerType ? { type: providerType } : {}),
          ...(options.listingType ? { listingType: options.listingType } : {}),
        },
      } as never);
      return true;
    }

    if (status === "DRAFT") {
      router.push({
        pathname: "/partner/form",
        params: {
          type: providerType ?? providerQuery.data?.type ?? "",
          ...(options.listingType ? { listingType: options.listingType } : {}),
        },
      } as never);
      return true;
    }

    if (status === "APPROVED") {
      if (intent === "publish" || intent === "become-partner") {
        if (!options.resumeDraft && options.listingType) {
          /* listingType déjà appliqué via setListingType */
        } else if (!options.resumeDraft && !options.listingType) {
          resetPublish();
        }
        router.push({
          pathname: "/publish",
          params: {
            ...(options.listingType
              ? { listingType: options.listingType }
              : {}),
            ...(options.resumeDraft ? { resume: "1" } : {}),
          },
        } as never);
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
