import { api } from "./client";
import { HomeResponse } from "./types";

export async function fetchHome() {
  const { data } = await api.get<HomeResponse>("/home");
  return data;
}
