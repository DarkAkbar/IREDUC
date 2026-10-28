import { api, getStoredTokens } from "./client";
import { AuthUser } from "./types";

export type ProfileSummary = {
  requests: Record<string, number>;
  requestsTotal: number;
  favorites: number;
  alerts: number;
  unreadMessages: number;
  unreadNotifications: number;
  partner: null | {
    reviewStatus: string;
    rejectionReason: string | null;
    listings: Record<string, number>;
    listingsTotal: number;
    pendingReceivedRequests: number;
  };
};

export type SessionItem = {
  id: string;
  deviceName: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
};

export async function fetchProfileSummary() {
  const { data } = await api.get<ProfileSummary>("/users/me/summary");
  return data;
}

export async function updateProfile(input: {
  fullName?: string;
  phone?: string;
  email?: string | null;
  whatsapp?: string | null;
  avatarUrl?: string | null;
  currentPassword?: string;
}) {
  const { data } = await api.patch<AuthUser>("/users/me", input);
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const { data } = await api.patch<{ message: string }>("/users/me/password", {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function uploadAvatar(uri: string, mimeType?: string) {
  const form = new FormData();
  const name = uri.split("/").pop() ?? `avatar-${Date.now()}.jpg`;
  form.append("file", {
    uri,
    name,
    type: mimeType ?? "image/jpeg",
  } as unknown as Blob);
  const { data } = await api.post<AuthUser>("/users/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteAccount(password: string) {
  const { data } = await api.delete<{ message: string }>("/users/me", {
    data: { password },
  });
  return data;
}

async function withRefreshHeader() {
  const { refreshToken } = await getStoredTokens();
  return refreshToken
    ? { "X-Refresh-Token": refreshToken }
    : ({} as Record<string, string>);
}

export async function fetchSessions() {
  const headers = await withRefreshHeader();
  const { data } = await api.get<{ data: SessionItem[] }>("/users/me/sessions", {
    headers,
  });
  return data.data;
}

export async function revokeSession(sessionId: string) {
  const headers = await withRefreshHeader();
  const { data } = await api.delete<{ message: string }>(
    `/users/me/sessions/${sessionId}`,
    { headers }
  );
  return data;
}

export async function revokeOtherSessions() {
  const headers = await withRefreshHeader();
  const { data } = await api.delete<{ message: string; revokedCount: number }>(
    "/users/me/sessions/others",
    { headers }
  );
  return data;
}
