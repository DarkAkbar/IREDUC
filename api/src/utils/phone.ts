import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { badRequest } from "./errors";

const DEFAULT_COUNTRY: CountryCode = "CD";

/**
 * Normalise un numéro vers E.164 (ex. +243812345678).
 * Accepte : 0812345678, 812345678, +243 812 345 678, 00243812345678, etc.
 */
export function normalizePhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): string {
  const raw = input.trim();
  if (!raw) {
    throw badRequest("Numéro de téléphone invalide", undefined, "INVALID_PHONE");
  }

  let candidate = raw.replace(/[\s().-]/g, "");
  if (candidate.startsWith("00")) {
    candidate = `+${candidate.slice(2)}`;
  }

  const parsed = parsePhoneNumberFromString(candidate, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    throw badRequest("Numéro de téléphone invalide", undefined, "INVALID_PHONE");
  }

  return parsed.format("E.164");
}

/** Chiffres seuls pour wa.me (sans « + »). */
export function phoneDigitsForWhatsApp(e164OrRaw: string): string {
  const e164 = e164OrRaw.startsWith("+")
    ? e164OrRaw
    : normalizePhone(e164OrRaw);
  return e164.replace(/\D/g, "");
}

/** Détecte si la saisie ressemble à un e-mail plutôt qu'à un téléphone. */
export function looksLikeEmail(identifier: string): boolean {
  return identifier.trim().includes("@");
}

export function normalizeOptionalEmail(
  email: string | null | undefined
): string | null {
  if (email == null) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}
