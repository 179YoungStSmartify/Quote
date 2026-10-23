import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { QuoteData } from "../src/types";

const quote = JSON.parse(
  readFileSync(new URL("../src/quote.json", import.meta.url), "utf8"),
) as QuoteData;

describe("Essential English issued quote data", () => {
  it("is issued with approved dates and no draft or tax-confirmation language", () => {
    expect(quote.quoteId).toBe("PL-HZL-179YS-0002-v2");
    expect(quote.status).toBe("issued");
    expect(quote).not.toHaveProperty("draftedOn");
    expect(quote).not.toHaveProperty("draftChecks");
    expect(quote.quoteDate).toBe("23/10/2026");
    expect(quote.validUntil).toBe("22/11/2026");
    expect(JSON.stringify(quote)).not.toMatch(/GST|tax inclusive|tax exclusive/i);
    expect(quote.presentation.heroSubheading).not.toMatch(/draft|review|not yet issued/i);
    expect(quote.phaseTwo?.introduction).not.toMatch(/confirm|before this draft is issued/i);
    expect(quote.phaseTwo?.introduction).toMatch(/90 days from issue/i);
    expect(quote.phaseTwo?.introduction).toMatch(/supplier price changes notified before order/i);
  });

  it("prices the six-item Essential scope and unchanged network exactly", () => {
    const [smart, network] = quote.sections;
    expect(smart.items).toHaveLength(8);
    expect(
      smart.items
        .slice(0, 7)
        .reduce((sum, item) => sum + item.quantity * item.unitCents, 0),
    ).toBe(857000);
    expect(
      smart.items.find((item) => item.name.startsWith('4"')),
    ).toMatchObject({ quantity: 1, unitCents: 29900 });
    expect(smart.items[7]).toMatchObject({ quantity: 21, unitCents: 18000 });
    expect(smart.interimSubtotal).toMatchObject({
      afterItemCount: 7,
      amountCents: 857000,
    });
    expect(smart.discount).toBeNull();
    expect(smart.grossSubtotal).toBeNull();
    expect(network.items).toEqual([
      {
        name: "UniFi Cloud Gateway Ultra (UCG-Ultra)",
        quantity: 1,
        unitCents: 20790,
      },
      {
        name: "UniFi U7 Lite Wi-Fi 7 ceiling access point (U7-Lite)",
        quantity: 4,
        unitCents: 19690,
      },
      {
        name: "UniFi Switch Ultra 60W, 8-port PoE (USW-Ultra-60W)",
        quantity: 1,
        unitCents: 28050,
      },
    ]);
    expect(
      network.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCents,
        0,
      ),
    ).toBe(127600);
    expect(quote.optionalAddons?.map((item) => item.amountCents)).toEqual([
      36000,
    ]);
    expect(quote.phaseTwo?.items.map((item) => item.amountCents)).toEqual([
      29900, 74900, 39800, 36000, 72000,
    ]);
    expect(
      quote.optionalAddons?.reduce((sum, item) => sum + item.amountCents, 0),
    ).not.toBe(quoteTotal());
    expect(quoteTotal()).toBe(1362600);
    expect(smart.items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0)).toBe(1235000);
    expect(JSON.stringify(quote)).not.toMatch(
      /R&D|Accepted by|signature|[\u4e00-\u9fff]/i,
    );
  });

  it("preserves client-facing inclusion and protection terms", () => {
    const text = JSON.stringify(quote);
    for (const phrase of [
      "AirTouch",
      "Google Assistant",
      "Hosted",
      "60 days",
      "Australian Consumer Law",
      "Nabu Casa",
      "Wi-Fi",
      "manufacturer instructions",
      "own Google accounts",
    ]) {
      expect(text.toLowerCase()).toContain(phrase.toLowerCase());
    }
    expect(text).toMatch(/six automations|6 automations/i);
    expect(text).toMatch(/90[- ]day/i);
    expect(text).toMatch(/90 days from issue/i);
    expect(text).toMatch(/supplier price changes notified before order/i);
  });
});

function quoteTotal() {
  return quote.sections.reduce(
    (sum, section) =>
      sum +
      section.items.reduce(
        (subtotal, item) => subtotal + item.quantity * item.unitCents,
        0,
      ),
    0,
  );
}
