import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "ireduc_access_token";
const REFRESH_KEY = "ireduc_refresh_token";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

export async function getStoredTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function setStoredTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearStoredTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = await getStoredTokens();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });
    await setStoredTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    await clearStoredTokens();
    onAuthFailure?.();
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  const { accessToken } = await getStoredTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
);

/** À incrémenter après un `seed:demo` pour invalider le cache Expo Image. */
const MEDIA_CACHE_VERSION = "20261024c";

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) {
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}v=${MEDIA_CACHE_VERSION}`;
  }
  const origin = API_URL.replace(/\/api\/v1\/?$/, "");
  const url = `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  return `${url}?v=${MEDIA_CACHE_VERSION}`;
}
