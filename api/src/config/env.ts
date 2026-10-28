import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET est requis"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET est requis"),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  /**
   * Si true : les actions sensibles exigent phoneVerified.
   * false (défaut) : pas de blocage ; le code de vérification e-mail/téléphone reste disponible.
   */
  REQUIRE_ACCOUNT_VERIFICATION: z
    .string()
    .optional()
    .transform((value) => value === "true" || value === "1"),
  /** Numéro WhatsApp du support (E.164), ex. +243812345678 */
  SUPPORT_WHATSAPP: z.string().default("+243810000000"),
  /** Version minimale de l'app mobile (semver) */
  MIN_APP_VERSION: z.string().default("1.0.0"),
  LEGAL_TERMS_URL: z.string().default("/legal/terms"),
  LEGAL_PRIVACY_URL: z.string().default("/legal/privacy"),
  MAIL_DRIVER: z.enum(["console", "resend", "smtp"]).default("console"),
  MAIL_FROM: z.string().default("IREDUC <noreply@ireduc.cd>"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Configuration invalide: ${details}`);
}

export const env = parsed.data;

export const AUTH_CONFIG = {
  accessTokenTtl: "15m" as const,
  refreshTokenTtlDays: 30,
  bcryptRounds: 10,
  userTokenTtlHours: 24,
} as const;
