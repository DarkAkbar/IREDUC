import { api } from "./client";
import { AuthUser } from "./types";

export async function updateProfile(input: {
  fullName?: string;
  phone?: string | null;
  whatsapp?: string | null;
  avatarUrl?: string | null;
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
