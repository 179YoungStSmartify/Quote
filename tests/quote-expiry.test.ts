import { describe, expect, it } from "vitest";
import quote from "../src/quote.json";
import {
  isQuoteExpired,
  parseQuoteValidUntil,
  quoteExpiryStatus,
} from "../src/quoteExpiry";

describe("quote expiry gate", () => {
  it("parses DD/MM/YYYY as the end of that day in Brisbane time", () => {
    // 15/11/2026 23:59:59.999 AEST is 13:59:59.999 UTC.
    expect(parseQuoteValidUntil("15/11/2026")).toEqual({
      expiresAtMs: Date.UTC(2026, 10, 15, 13, 59, 59, 999),
    });
  });

  it("rejects malformed or impossible dates", () => {
    expect(parseQuoteValidUntil("2026-11-15")).toHaveProperty("error");
    expect(parseQuoteValidUntil("not a date")).toHaveProperty("error");
    expect(parseQuoteValidUntil("31/02/2026")).toHaveProperty("error");
    expect(parseQuoteValidUntil("15/13/2026")).toHaveProperty("error");
  });

  it("treats a quote as expired only after its whole expiry day", () => {
    const at = (iso: string) => new Date(iso).getTime();
    // 1:59pm AEST on the expiry day is still inside the validity window.
    expect(isQuoteExpired("15/11/2026", at("2026-11-15T03:59:59Z"))).toBe(
      false,
    );
    expect(isQuoteExpired("15/11/2026", at("2026-11-15T13:59:59.999Z"))).toBe(
      false,
    );
    // 12:00am 16/11 AEST is the first expired moment.
    expect(isQuoteExpired("15/11/2026", at("2026-11-15T14:00:00Z"))).toBe(true);
    expect(isQuoteExpired("15/11/2026", at("2026-11-01T00:00:00Z"))).toBe(
      false,
    );
  });

  it("does not expire on an unparseable date (format is guarded separately)", () => {
    expect(isQuoteExpired("not a date", 0)).toBe(false);
  });

  it("uses the DD/MM/YYYY format for the published quote", () => {
    expect(quote.validUntil).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("quote expiry status", () => {
  const expiresAt = Date.UTC(2026, 10, 15, 13, 59, 59, 999);
  const day = 24 * 60 * 60 * 1000;

  it("is active more than seven days out", () => {
    expect(quoteExpiryStatus("15/11/2026", Date.UTC(2026, 10, 1))).toBe(
      "active",
    );
    expect(quoteExpiryStatus("15/11/2026", expiresAt - 7 * day - 1)).toBe(
      "active",
    );
  });

  it("is expiring within the final seven days, expiry day included", () => {
    expect(quoteExpiryStatus("15/11/2026", expiresAt - 7 * day)).toBe(
      "expiring",
    );
    expect(quoteExpiryStatus("15/11/2026", Date.UTC(2026, 10, 12))).toBe(
      "expiring",
    );
    expect(quoteExpiryStatus("15/11/2026", expiresAt)).toBe("expiring");
  });

  it("is expired once the expiry day has passed", () => {
    expect(quoteExpiryStatus("15/11/2026", expiresAt + 1)).toBe("expired");
    expect(quoteExpiryStatus("15/11/2026", Date.UTC(2026, 11, 1))).toBe(
      "expired",
    );
  });

  it("reports an unparseable date honestly", () => {
    expect(quoteExpiryStatus("not a date", 0)).toBe("invalid");
  });
});
