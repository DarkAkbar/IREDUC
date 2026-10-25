import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistSession,
  getStoredUser,
} from "./auth-storage";

const baseURL = import.meta.env.VITE_API_URL as string;

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh`, {
      refreshToken,
    });
    const user = data.user ?? getStoredUser();
    if (!user) {
      clearSession();
      return null;
    }
    persistSession(data.accessToken, data.refreshToken, user);
    return data.accessToken as string;
  } catch {
    clearSession();
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const token = await refreshPromise;
    if (!token) {
      window.location.href = "/login";
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  }
);

export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string | string[];
          details?: Array<{ path?: string; message?: string }>;
        }
      | undefined;
    const details = data?.details
      ?.map((d) => d.message)
      .filter((m): m is string => Boolean(m));
    if (details && details.length > 0) {
      return details.join(" · ");
    }
    const message = data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
    if (error.response?.status === 401) {
      return "Session expirée. Reconnectez-vous.";
    }
    if (error.response?.status === 403) {
      return "Permissions insuffisantes pour cette action.";
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
