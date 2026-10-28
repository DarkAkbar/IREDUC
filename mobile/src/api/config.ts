import { api } from "./client";

export type PublicConfig = {
  supportWhatsapp: string;
  minAppVersion: string;
  partnerReviewSlaHours?: number;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  legal: {
    termsUrl: string;
    privacyUrl: string;
  };
};

export async function fetchPublicConfig() {
  const { data } = await api.get<PublicConfig>("/config");
  return data;
}
