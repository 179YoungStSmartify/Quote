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
    expect(quote.status).toBe("draft");
    expect(quote.sections[0].items).toHaveLength(8);
    expect(quote.sections[0].items.slice(0, 7).reduce((a, x) => a + line(x), 0)).toBe(857000);
    expect(quote.sections[0].items.find(x => x.name.startsWith('4"'))).toMatchObject({quantity:1,unitCents:29900});
    expect(quote.sections[0].items[7]).toMatchObject({quantity:21,unitCents:18000});
    expect(quote.sections[0].discount).toBeNull();
    expect(subtotal(quote.sections[0])).toBe(1235000);
    expect(subtotal(quote.sections[1])).toBe(127600);
    expect(quote.sections.reduce((a, s) => a + subtotal(s), 0)).toBe(1362600);
  });
  it("preserves display quantities and quote metadata", () => {
    const items = quote.sections[0].items;
    expect(items.find((x) => x.name.startsWith("15.6"))?.quantity).toBe(1);
    expect(items.find((x) => x.name.startsWith("10"))?.quantity).toBe(1);
    expect(items.find((x) => x.name.startsWith("4"))?.quantity).toBe(1);
    expect(quote.quoteId).toBe("PL-HZL-179YS-0002-v2");
    expect(quote.preparedFor).toBe("Hazal");
    expect(quote.validUntil).toBeNull();
    expect(quote.quoteDate).toBeNull();
  });
  it("includes 21 billed hours within 36 delivered, with no R&D", () => {
    expect(quote.sections[0].items[7]).toMatchObject({
      quantity: 21,
      unitCents: 18000,
    });
    expect(quote.terms.join(" ")).toContain("36 hours");
    expect(JSON.stringify(quote)).not.toMatch(/R&D/i);
    expect(quote.inclusions.voiceControl.join(" ")).toContain("Google Assistant");
    expect(JSON.stringify(quote.inclusions.dashboards)).toContain('4\\"');
    expect(JSON.stringify(quote.phaseTwo)).toContain("NeoPlan3D");
  });
  it("renders grouped inclusions and retains flat integrations", () => {
    expect(quote.inclusions.dashboards).toEqual([
      { label: "Wall displays", items: [
        '1 main dashboard on the 15.6" display.',
        '1 area dashboard on the 10" display.',
        '1 area dashboard and 1 scene-control dashboard on the 4" display.',
      ]},
      { label: "Mobile", items: ["1 mobile dashboard per account/person."] },
    ]);
    expect(quote.inclusions.automations).toEqual([{
      label: "6 automations, agreed at project kickoff",
      items: ["Away scene: lights turn on and off at random when no one is home.", "I’m home.", "I’m leaving.", "Movie scene.", "Night-time sentry mode.", "One automation of your choice."],
    }]);
    expect(
      quote.inclusions.integrations.every((item) => typeof item === "string"),
    ).toBe(true);
  });
  it("uses only client-facing Smart home and Network headings", () => {
    expect(quote.sections.map((s) => s.title)).toEqual([
      "Smart home (Essential)",
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
    expect(quote.warranty).toContain("Two years for hardware supplied by us");
    expect(quote.sections.reduce((a, s) => a + subtotal(s), 0)).toBe(1362600);
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
                    "profit",
          "margin",
          "cost price",
          "supplier cost",
          "wongy",
        ].join("|"),
        "i",
      );
    expect(data).toContain("60 days");
    expect(data).toContain("Two years for hardware supplied by us");
    expect(data).not.toMatch(restricted);
    expect(data).toMatch(/GST.*confirm|confirm.*GST/i);
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
        "Essential smart home and network — prepared for review, not yet issued.",
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
