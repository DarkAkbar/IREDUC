const ACCESS_KEY = "ireduc_admin_access";
const REFRESH_KEY = "ireduc_admin_refresh";
const USER_KEY = "ireduc_admin_user";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  systemRole: "ADMIN" | "SUPER_ADMIN" | string;
  accountStatus: string;
};

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function persistSession(
  accessToken: string,
  refreshToken: string,
  user: AdminUser
) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdminRole(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role?: string | null) {
  return role === "SUPER_ADMIN";
}
