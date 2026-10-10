import { ProviderType, ReviewStatus, SystemRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
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
