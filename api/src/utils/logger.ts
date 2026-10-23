const SENSITIVE_KEYS = [
  "password",
  "temporarypassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "jwt",
  "secret",
  "passwordhash",
];

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
        out[key] = "[redacted]";
      } else {
        out[key] = redact(val);
      }
    }
    return out;
  }
  return value;
}

export const logger = {
  info(message: string, meta?: unknown) {
    if (meta !== undefined) {
      console.log(`[INFO] ${message}`, redact(meta));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  error(message: string, err?: unknown) {
    if (err instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
      });
      return;
    }
    console.error(`[ERROR] ${message}`, redact(err));
  },
};
