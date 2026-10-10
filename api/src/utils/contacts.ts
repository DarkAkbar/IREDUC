export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }
  const digits = phone.replace(/\s+/g, "");
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}****`;
  }
  return `${digits.slice(0, 4)}****${digits.slice(-3)}`;
}
