import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET est requis"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET est requis"),
  PORT: z.coerce.number().int().positive().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Configuration invalide: ${details}`);
}

export const env = parsed.data;
