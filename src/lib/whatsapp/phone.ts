/** Retire tout sauf les chiffres. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Normalise un numéro pour comparaison (format international sans +).
 * Ex. "06 72 65 13 76" → "33672651376"
 */
export function normalizeWhatsappPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (!digits) return "";

  if (digits.startsWith("0") && digits.length === 10) {
    return `33${digits.slice(1)}`;
  }

  return digits;
}

/** Compare deux numéros après normalisation. */
export function phonesMatch(a: string, b: string): boolean {
  const na = normalizeWhatsappPhone(a);
  const nb = normalizeWhatsappPhone(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.endsWith(nb) || nb.endsWith(na);
}
