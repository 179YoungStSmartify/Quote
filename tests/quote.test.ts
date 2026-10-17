import { describe, it, expect } from "vitest";
import quote from "../src/quote.json";
import { readFileSync } from "node:fs";
const line = (x: { quantity: number; unitCents: number }) =>
  x.quantity * x.unitCents;
const subtotal = (s: (typeof quote.sections)[number]) =>
  s.items.reduce((n, x) => n + line(x), 0) +
  (s.discount ? line(s.discount) : 0);
describe("Hazal quote", () => {
  it("uses the approved v2 item rates, quantities, subtotals, and total", () => {
    expect(
      quote.sections[0].items
        .slice(0, 7)
        .map(({ quantity, unitCents }) => [quantity, unitCents]),
    ).toEqual([
      [1, 40480],
      [30, 5719],
      [1, 71390],
      [2, 54890],
      [2, 21890],
      [4, 10890],
      [4, 4290],
    ]);
    expect(quote.sections[0].items.reduce((a, x) => a + line(x), 0)).toBe(
      1777720,
    );
    expect(quote.sections[0].interimSubtotal?.amountCents).toBe(497720);
    expect(quote.sections[0].grossSubtotal?.amountCents).toBe(1777720);
    expect(subtotal(quote.sections[0])).toBe(1417720);
    expect(subtotal(quote.sections[1])).toBe(127600);
    expect(quote.sections.reduce((a, s) => a + subtotal(s), 0)).toBe(1545320);
    expect(Math.abs(line(quote.sections[0].discount!))).toBe(360000);
  });
  it("preserves display quantities and quote metadata", () => {
    const items = quote.sections[0].items;
    expect(items.find((x) => x.name.startsWith("15.6"))?.quantity).toBe(1);
    expect(items.find((x) => x.name.startsWith("10"))?.quantity).toBe(2);
    expect(items.find((x) => x.name.startsWith("4"))?.quantity).toBe(2);
    expect(quote.quoteId).toBe("PL-HZL-179YS-0001-v2");
    expect(quote.preparedFor).toBe("Hazal");
    expect(quote.validUntil).toBe("15/11/2026");
    expect(quote.quoteDate).toBe("16/10/2026");
  });
  it("includes the approved 60-hour installation and 20-hour R&D allocation", () => {
    expect(quote.sections[0].items[7]).toMatchObject({
      quantity: 60,
      unitCents: 18000,
    });
    expect(quote.sections[0].items[8]).toMatchObject({
      quantity: 20,
      unitCents: 10000,
    });
    expect(quote.terms.join(" ")).toContain("up to 80 hours");
    expect(quote.inclusions.integrations).toContain(
      "Voice assistant with Chinese spoken-language understanding",
    );
    expect(quote.inclusions.dashboards.join(" ")).toContain("NeoPlan3D");
  });
  it("uses only client-facing Smart home and Network headings", () => {
    expect(quote.sections.map((s) => s.title)).toEqual([
      "Smart home",
      "Network",
    ]);
    expect(quote.sections.map((s) => s.finalLabel)).toEqual([
      "Smart home total",
      "Network total",
    ]);
  });
  it("styles the summary total hierarchy and responsive summary boundary", () => {
    const app = readFileSync(
      new URL("../src/App.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(
      new URL("../src/quote.css", import.meta.url),
      "utf8",
    );
    expect(app).toContain("quote-summary-total");
    expect(app).toContain("quote-summary-breakdown");
    expect(css).toMatch(/\.quote-summary-total[\s\S]*?32px[\s\S]*?48px/);
    expect(css).toMatch(/\.quote-summary[\s\S]*?24px[\s\S]*?32px/);
    expect(css).toMatch(
      /@media print[\s\S]*?quote-summary-total[\s\S]*?background:\s*#fff/,
    );
    expect(css).toMatch(/\.quote-summary dt[\s\S]*?text-align:\s*left/);
    expect(css).toMatch(/\.quote-summary dd[\s\S]*?text-align:\s*right/);
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
