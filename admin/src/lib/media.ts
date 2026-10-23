const apiBase = (import.meta.env.VITE_API_URL as string) ?? "";
const origin = apiBase.replace(/\/api\/v1\/?$/, "");

export function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${origin}${url}`;
  return `${origin}/${url}`;
}

export const docTypeLabel: Record<string, string> = {
  ID: "Identité",
  RCCM: "RCCM",
  PATENTE: "Patente",
  PORTFOLIO: "Portfolio",
  REFERENCE: "Références",
  AUTRE: "Autre",
};
