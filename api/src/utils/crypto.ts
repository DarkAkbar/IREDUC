import { createHash, randomBytes, randomInt } from "crypto";

export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString("hex");
}

/** Code à 6 chiffres pour vérification e-mail sur mobile. */
export function generateEmailCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
