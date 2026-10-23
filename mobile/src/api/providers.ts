import { api } from "./client";
import {
  CreateProviderInput,
  ProviderDocument,
  ProviderProfile,
  UpdateProviderInput,
} from "./types";

export async function fetchMyProvider() {
  const { data } = await api.get<ProviderProfile>("/providers/me");
  return data;
}

export async function createProvider(input: CreateProviderInput) {
  const { data } = await api.post<ProviderProfile>("/providers", input);
  return data;
}

export async function updateProvider(input: UpdateProviderInput) {
  const { data } = await api.patch<ProviderProfile>("/providers/me", input);
  return data;
}

export async function uploadProviderLogo(uri: string, mimeType?: string) {
  const form = new FormData();
  const name = uri.split("/").pop() ?? `logo-${Date.now()}.jpg`;
  form.append("file", {
    uri,
    name,
    type: mimeType ?? "image/jpeg",
  } as unknown as Blob);
  const { data } = await api.post<ProviderProfile>("/providers/me/logo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadProviderDocument(
  uri: string,
  docType: ProviderDocument["docType"],
  mimeType?: string
) {
  const form = new FormData();
  const name = uri.split("/").pop() ?? `document-${Date.now()}.jpg`;
  form.append("docType", docType);
  form.append("file", {
    uri,
    name,
    type: mimeType ?? "image/jpeg",
  } as unknown as Blob);
  const { data } = await api.post<ProviderDocument>(
    "/providers/me/documents",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}
