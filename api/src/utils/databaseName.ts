/** Extrait le nom de base depuis une DATABASE_URL PostgreSQL. */
export function getDatabaseName(databaseUrl: string): string {
  try {
    const normalized = databaseUrl.replace(/^postgresql:/i, "http:");
    const pathname = new URL(normalized).pathname;
    const name = pathname.replace(/^\//, "").split("/")[0];
    return name && name.length > 0 ? decodeURIComponent(name) : "inconnu";
  } catch {
    const match = databaseUrl.match(/\/([^/?]+)(?:\?|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : "inconnu";
  }
}

export function maskDatabaseUrl(databaseUrl: string): string {
  return databaseUrl.replace(/:([^:@/]+)@/, ":****@");
}
