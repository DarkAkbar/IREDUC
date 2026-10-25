import { env } from "../../config/env";
import {
  getCachedSettingObject,
} from "../admin/admin.settings.service";

type GeneralSettings = {
  supportWhatsapp?: string;
  contactEmail?: string;
  platformName?: string;
  slogan?: string;
  defaultCurrency?: string;
  launchCity?: string;
  partnerReviewSlaHours?: number;
};

type MobileSettings = {
  minAppVersion?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  termsUrl?: string;
  privacyUrl?: string;
};

export async function getPublicConfig() {
  let general: GeneralSettings = {};
  let mobile: MobileSettings = {};

  try {
    general = await getCachedSettingObject<GeneralSettings>("general");
    mobile = await getCachedSettingObject<MobileSettings>("mobile");
  } catch {
    // Fallback env si la table Setting n'est pas encore migrée
  }

  return {
    platformName: general.platformName ?? "IREDUC",
    slogan: general.slogan ?? "Trouvez. Comparez. Réalisez.",
    defaultCurrency: general.defaultCurrency ?? "USD",
    launchCity: general.launchCity ?? "Kinshasa",
    contactEmail: general.contactEmail ?? "contact@ireduc.cd",
    supportWhatsapp: general.supportWhatsapp ?? env.SUPPORT_WHATSAPP,
    minAppVersion: mobile.minAppVersion ?? env.MIN_APP_VERSION,
    maintenanceMode: mobile.maintenanceMode ?? false,
    maintenanceMessage:
      mobile.maintenanceMessage ??
      "Maintenance en cours. Réessayez bientôt.",
    legal: {
      termsUrl: mobile.termsUrl ?? env.LEGAL_TERMS_URL,
      privacyUrl: mobile.privacyUrl ?? env.LEGAL_PRIVACY_URL,
    },
    partnerReviewSlaHours: general.partnerReviewSlaHours ?? 48,
  };
}
