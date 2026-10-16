import { describe, it, expect } from "vitest";
import quote from "../src/quote.json";
const line = (x: { quantity: number; unitCents: number }) =>
  x.quantity * x.unitCents;
const subtotal = (s: (typeof quote.sections)[number]) =>
  s.items.reduce((n, x) => n + line(x), 0) +
  (s.discount ? line(s.discount) : 0);
describe("Hazal quote", () => {
  it("preserves the approved AUD totals and discount", () => {
    expect(quote.sections[0].items.reduce((a, x) => a + line(x), 0)).toBe(
      1901600,
    );
    expect(quote.sections[0].grossSubtotal?.amountCents).toBe(1901600);
    expect(subtotal(quote.sections[0])).toBe(1541600);
    expect(subtotal(quote.sections[1])).toBe(127600);
    expect(quote.sections.reduce((a, s) => a + subtotal(s), 0)).toBe(1669200);
    expect(Math.abs(line(quote.sections[0].discount!))).toBe(360000);
  });
  it("preserves display quantities and quote metadata", () => {
    const items = quote.sections[0].items;
    expect(items.find((x) => x.name.startsWith("15.6"))?.quantity).toBe(1);
    expect(items.find((x) => x.name.startsWith("10"))?.quantity).toBe(2);
    expect(items.find((x) => x.name.startsWith("4"))?.quantity).toBe(2);
    expect(quote.quoteId).toBe("PL-HZL-179YS-0001-v1");
    expect(quote.preparedFor).toBe("Hazal");
    expect(quote.validUntil).toBe("15/11/2026");
    expect(quote.quoteDate).toBe("16/10/2026");
  });
  it("keeps signing deferred and excludes internal commercial information", () => {
    const data = JSON.stringify(quote),
      restricted = new RegExp(
        [
          ["G", "S", "T"].join(""),
          ["t", "a", "x"].join(""),
          "profit",
          "margin",
          "cost price",
          "supplier cost",
          "wongy",
        ].join("|"),
        "i",
      );
    expect(data).toContain("Signing integration deferred");
    expect(data).toContain("60 days");
    expect(data).toContain("2 years, hardware only");
    expect(data).not.toMatch(restricted);
  });
});
