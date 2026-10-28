import { api, clearStoredTokens, getStoredTokens } from "./client";
import { AuthUser, LoginResponse } from "./types";

export async function login(identifier: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    identifier,
    password,
  });
  return data;
}

export type RegisterResult = LoginResponse & {
  message: string;
};

export async function register(input: {
  fullName: string;
  phone: string;
  password: string;
  email?: string;
}) {
  const { data } = await api.post<RegisterResult>("/auth/register", input);
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", {
    email,
  });
  return data;
}

export async function resendVerification(email: string) {
  const { data } = await api.post<{ message: string; emailSent?: boolean }>(
    "/auth/resend-verification",
    { email }
  );
  return data;
}

export async function logout() {
  const { refreshToken } = await getStoredTokens();
  try {
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } finally {
    await clearStoredTokens();
  }
}

export async function getMe() {
  const { data } = await api.get<AuthUser>("/users/me");
  return data;
}
