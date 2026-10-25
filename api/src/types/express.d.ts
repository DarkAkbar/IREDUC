import { ProviderType, ReviewStatus, SystemRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone: string;
        email: string | null;
        role: SystemRole;
      };
      providerProfile?: {
        id: string;
        type: ProviderType;
        displayName: string;
        reviewStatus: ReviewStatus;
      };
    }
  }
}

export {};
