import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const quote = JSON.parse(readFileSync(new URL("../src/quote.json", import.meta.url), "utf8"));

describe("existing client tablet scope", () => {
  it("includes app installation and dashboard configuration without an additional fee", () => {
    expect(quote.optionalAddons?.some((item: { id: string }) => item.id === "tablet")).toBe(false);
    const dashboards = quote.inclusions.dashboards.flatMap((group: { label: string; items: string[] }) => [group.label, ...group.items]).join(" ");
    expect(dashboards).toMatch(/existing client AirTouch tablet/i);
    expect(dashboards).toMatch(/install the Home Assistant app/i);
    expect(dashboards).toMatch(/configure a dashboard/i);
    expect(dashboards).toMatch(/included in the existing 36-hour package/i);
    expect(dashboards).toMatch(/no additional fee/i);
  });

  it("preserves three supplied displays and base quote amounts", () => {
    const supplied = quote.sections.flatMap((section: { items: { name: string; quantity: number }[] }) => section.items).filter((item: { name: string }) => /display/i.test(item.name));
    expect(supplied).toHaveLength(3);
    expect(supplied.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)).toBe(3);
    const totals = Object.fromEntries(quote.sections.map((section: { id: string; items: { quantity: number; unitCents: number }[] }) => [section.id, section.items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0)]));
    expect(totals).toEqual({ "smart-home": 1235000, network: 127600 });
    expect(quote.terms.join(" ")).toContain("36 hours");
    expect(quote.sections.find((section: { id: string }) => section.id === "smart-home").items.at(-1)).toMatchObject({ quantity: 21 });
    expect(quote.scopeIntroduction).toContain("36 hours delivered: 15 complimentary and 21 billed");
  });
});
