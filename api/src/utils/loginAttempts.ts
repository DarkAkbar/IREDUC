/** Anti-bruteforce connexion : par IP et par identifiant normalisé. */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

type Bucket = { count: number; resetAt: number };

const byIp = new Map<string, Bucket>();
const byIdentifier = new Map<string, Bucket>();

function touch(map: Map<string, Bucket>, key: string): Bucket {
  const now = Date.now();
  const current = map.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 0, resetAt: now + WINDOW_MS };
    map.set(key, next);
    return next;
  }
  return current;
}

export function isLoginBlocked(ip: string, identifier: string): boolean {
  const now = Date.now();
  for (const [map, key] of [
    [byIp, ip] as const,
    [byIdentifier, identifier] as const,
  ]) {
    const bucket = map.get(key);
    if (bucket && bucket.resetAt > now && bucket.count >= MAX_FAILURES) {
      return true;
    }
  }
  return false;
}

export function recordLoginFailure(ip: string, identifier: string): void {
  for (const [map, key] of [
    [byIp, ip] as const,
    [byIdentifier, identifier] as const,
  ]) {
    const bucket = touch(map, key);
    bucket.count += 1;
  }
}

export function clearLoginFailures(ip: string, identifier: string): void {
  byIp.delete(ip);
  byIdentifier.delete(identifier);
}

/** Pour les tests Vitest. */
export function resetLoginAttemptsForTests(): void {
  byIp.clear();
  byIdentifier.clear();
}

export const LOGIN_ATTEMPT_LIMIT = MAX_FAILURES;
