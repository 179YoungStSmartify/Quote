// Quote expiry logic shared by the web page and the CI expiry gate.
// validUntil uses DD/MM/YYYY and is interpreted in Australia/Brisbane time
// (AEST, UTC+10, no daylight saving), so a quote stays valid through the
// whole expiry day.
export function parseQuoteValidUntil(
  validUntil: string,
): { expiresAtMs: number } | { error: string } {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(validUntil);
  if (!match) {
    return { error: `validUntil must be DD/MM/YYYY, got "${validUntil}"` };
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) {
    return { error: `validUntil month out of range: "${validUntil}"` };
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) {
    return { error: `validUntil day out of range: "${validUntil}"` };
  }
  // 23:59:59.999 on the expiry day in Brisbane (AEST) is 13:59:59.999 UTC.
  return { expiresAtMs: Date.UTC(year, month - 1, day, 13, 59, 59, 999) };
}

export function isQuoteExpired(
  validUntil: string,
  nowMs: number = Date.now(),
): boolean {
  const parsed = parseQuoteValidUntil(validUntil);
  if ("error" in parsed) return false;
  return nowMs > parsed.expiresAtMs;
}

export type QuoteExpiryStatus = "active" | "expiring" | "expired";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function quoteExpiryStatus(
  validUntil: string,
  nowMs: number = Date.now(),
): QuoteExpiryStatus {
  const parsed = parseQuoteValidUntil(validUntil);
  if ("error" in parsed) return "active";
  const remaining = parsed.expiresAtMs - nowMs;
  if (remaining < 0) return "expired";
  if (remaining <= SEVEN_DAYS_MS) return "expiring";
  return "active";
}
