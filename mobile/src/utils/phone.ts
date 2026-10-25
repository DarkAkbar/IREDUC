import { parsePhoneNumberFromString } from "libphonenumber-js";

const DEFAULT_COUNTRY = "CD" as const;

export function normalizePhone(input: string): string {
  const raw = input.trim();
  if (!raw) {
    throw new Error("Numéro de téléphone invalide");
  }

  let candidate = raw.replace(/[\s().-]/g, "");
  if (candidate.startsWith("00")) {
    candidate = `+${candidate.slice(2)}`;
  }

  const parsed = parsePhoneNumberFromString(candidate, DEFAULT_COUNTRY);
  if (!parsed || !parsed.isValid()) {
    throw new Error("Numéro de téléphone invalide");
  }

  return parsed.format("E.164");
}

export function looksLikeEmail(identifier: string): boolean {
  return identifier.trim().includes("@");
}

/** Affiche la partie nationale pour un champ préfixé +243. */
export function nationalDigitsFromInput(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("243")) return digits.slice(3).slice(0, 9);
  if (digits.startsWith("0")) return digits.slice(1).slice(0, 9);
  return digits.slice(0, 9);
}

/** Formate 812345678 → 81 234 56 78 pour l'affichage. */
export function formatCdNationalDisplay(national: string): string {
  const d = national.replace(/\D/g, "").slice(0, 9);
  const parts = [
    d.slice(0, 2),
    d.slice(2, 5),
    d.slice(5, 7),
    d.slice(7, 9),
  ].filter(Boolean);
  return parts.join(" ");
}

export function toE164FromCdNational(national: string): string {
  return normalizePhone(`+243${national.replace(/\D/g, "")}`);
}

export function phoneDigitsForWhatsApp(e164OrRaw: string): string {
  try {
    const e164 = e164OrRaw.startsWith("+")
      ? e164OrRaw
      : normalizePhone(e164OrRaw);
    return e164.replace(/\D/g, "");
  } catch {
    return e164OrRaw.replace(/\D/g, "");
  }
}

/** Affiche +243812345678 → +243 81 234 56 78 */
export function formatPhoneDisplay(e164: string): string {
  try {
    const parsed = parsePhoneNumberFromString(e164);
    if (parsed) {
      const intl = parsed.formatInternational();
      return intl;
    }
  } catch {
    /* fallback */
  }
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("243") && digits.length >= 12) {
    const national = digits.slice(3);
    return `+243 ${formatCdNationalDisplay(national)}`;
  }
  return e164;
}
