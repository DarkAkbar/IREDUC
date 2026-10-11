import { api } from "./client";
import { AuthUser, LoginResponse } from "./types";

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(fullName: string, email: string, password: string) {
  const { data } = await api.post<{ message: string; user: AuthUser }>(
    "/auth/register",
    { fullName, email, password }
  );
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", {
    email,
  });
  return data;
}

export async function getMe() {
  const { data } = await api.get<AuthUser>("/users/me");
  return data;
}
