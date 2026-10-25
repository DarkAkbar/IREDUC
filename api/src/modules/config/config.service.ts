import { env } from "../../config/env";

export function getPublicConfig() {
  return {
    supportWhatsapp: env.SUPPORT_WHATSAPP,
    minAppVersion: env.MIN_APP_VERSION,
    legal: {
      termsUrl: env.LEGAL_TERMS_URL,
      privacyUrl: env.LEGAL_PRIVACY_URL,
    },
  };
}
