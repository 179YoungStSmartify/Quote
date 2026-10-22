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
    expect(JSON.stringify(quote.inclusions.dashboards)).toContain("NeoPlan3D");
  });
  it("renders grouped inclusions and retains flat integrations", () => {
    expect(quote.inclusions.dashboards).toEqual([
      {
        label: '15.6" and 10" displays',
        items: [
          "1 main dashboard for an at-a-glance view of the home.",
          "1 area-based dashboard.",
          'NeoPlan3D interactive 3D floor plan on the 15.6" display.',
        ],
      },
      {
        label: '4" displays',
        items: [
          "1 Home Assistant dashboard for the display's area.",
          "1 scene-control dashboard.",
        ],
      },
      { label: "Mobile", items: ["1 mobile dashboard per account/person."] },
    ]);
    expect(quote.inclusions.automations).toEqual([
      {
        label: "10 automations, including:",
        items: [
          "Away scene: lights turn on and off at random while no one is home.",
          '"I\'m home" scene.',
          '"I\'m leaving" scene.',
          "Movie scene.",
          "Night-time sentry mode.",
        ],
      },
    ]);
    expect(
      quote.inclusions.integrations.every((item) => typeof item === "string"),
    ).toBe(true);
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
  it("keeps signing content out while retaining terms, warranty, and totals", () => {
    expect(quote).not.toHaveProperty("signing");
    expect(quote.hyperCare).toContain("60 days");
    expect(quote.warranty).toContain("2 years, hardware only");
    expect(quote.sections.reduce((a, s) => a + subtotal(s), 0)).toBe(1545320);
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
  it("excludes internal commercial information", () => {
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
    expect(data).toContain("60 days");
    expect(data).toContain("2 years, hardware only");
    expect(data).not.toMatch(restricted);
  });
  it("sources hero and currency copy from quote.json in both renderers", () => {
    const app = readFileSync(
      new URL("../src/App.tsx", import.meta.url),
      "utf8",
    );
    const pdf = readFileSync(
      new URL("../scripts/generate-pdf.mjs", import.meta.url),
      "utf8",
    );
    expect(quote.presentation).toEqual({
      heroHeadline: "A thoughtful foundation for connected living.",
      heroSubheading:
        "Clear scope for a considered smart home and a separately priced network.",
      currencyNote: "All amounts are in AUD.",
    });
    expect(app).not.toContain("A thoughtful foundation for connected living");
    expect(app).not.toContain("Clear scope for a considered smart home");
    expect(app).not.toContain("All amounts are in AUD");
    expect(app).toContain("q.presentation.heroHeadline");
    expect(app).toContain("q.presentation.heroSubheading");
    expect(app).toContain("q.presentation.currencyNote");
    expect(pdf).not.toContain("presentation");
    expect(pdf).toContain("await page.pdf");
    expect(pdf).toContain('page.emulateMedia({ media: "print" })');
  });
});
