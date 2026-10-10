import { ProviderProfile, User } from "@prisma/client";

export type UserWithProvider = User & {
  providerProfile: ProviderProfile | null;
};

export function toPublicUser(user: UserWithProvider) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    whatsapp: user.whatsapp,
    systemRole: user.systemRole,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    providerProfile: user.providerProfile
      ? {
          id: user.providerProfile.id,
          type: user.providerProfile.type,
          displayName: user.providerProfile.displayName,
          reviewStatus: user.providerProfile.reviewStatus,
          isRegistered: user.providerProfile.isRegistered,
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
