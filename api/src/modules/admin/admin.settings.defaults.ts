export const SETTING_KEYS = [
  "general",
  "mobile",
  "validation",
  "security",
  "home",
  "notifications",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export const DEFAULT_SETTINGS: Record<SettingKey, unknown> = {
  general: {
    platformName: "IREDUC",
    slogan: "Trouvez. Comparez. Réalisez.",
    logoUrl: null,
    defaultCurrency: "USD",
    launchCity: "Kinshasa",
    supportWhatsapp: "+243810000000",
    contactEmail: "contact@ireduc.cd",
    /** Délai indicatif de traitement des dossiers partenaires (heures). */
    partnerReviewSlaHours: 48,
  },
  mobile: {
    minAppVersion: "1.0.0",
    maintenanceMode: false,
    maintenanceMessage: "Maintenance en cours. Réessayez bientôt.",
    termsUrl: "/legal/terms",
    privacyUrl: "/legal/privacy",
  },
  validation: {
    requiredDocuments: {
      INDIVIDUAL: ["ID"],
      AGENCY: ["ID", "RCCM"],
      SERVICE_PROVIDER: ["ID", "PORTFOLIO"],
    },
    requireRegisteredBusiness: false,
    maxPhotos: 12,
    maxVideos: 2,
    maxMediaSizeMb: 20,
    moderationBeforePublish: true,
  },
  security: {
    maxLoginAttempts: 5,
    sessionDurationDays: 30,
    minPasswordLength: 8,
    requireAccountVerification: false,
  },
  home: {
    itemsPerSection: 8,
    sections: [
      { id: "featured", label: "À la une", enabled: true, order: 1 },
      { id: "properties", label: "Biens récents", enabled: true, order: 2 },
      { id: "services", label: "Services", enabled: true, order: 3 },
      { id: "partners", label: "Partenaires", enabled: true, order: 4 },
    ],
    featuredIds: [] as string[],
  },
  notifications: {
    templates: {
      approval:
        "Bonjour {{name}}, votre dossier a été approuvé. Bienvenue sur IREDUC !",
      rejection:
        "Bonjour {{name}}, votre dossier a été rejeté. Motif : {{reason}}",
      welcome:
        "Bienvenue sur IREDUC, {{name}} ! Trouvez, comparez et réalisez.",
    },
  },
};
