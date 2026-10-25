import { api, clearStoredTokens, getStoredTokens } from "./client";
import { AuthUser, LoginResponse } from "./types";

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export type RegisterResult = {
  message: string;
  emailSent: boolean;
  autoVerified?: boolean;
  user: AuthUser;
};

export async function register(fullName: string, email: string, password: string) {
  const { data } = await api.post<RegisterResult>("/auth/register", {
    fullName,
    email,
    password,
  });
  return data;
}

export async function verifyEmail(input: {
  token?: string;
  email?: string;
  code?: string;
}) {
  const { data } = await api.post<{ message: string }>(
    "/auth/verify-email",
    input
  );
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
