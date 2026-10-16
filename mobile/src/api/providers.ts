import { api } from "./client";
import { ProviderProfile } from "./types";

export async function fetchMyProvider() {
  const { data } = await api.get<ProviderProfile>("/providers/me");
  return data;
}
