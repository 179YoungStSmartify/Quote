import { test, expect } from "@playwright/test";
import quote from "../../src/quote.json" with { type: "json" };

const gross = (section: (typeof quote.sections)[number]) =>
  section.items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
const money = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: quote.currency,
  }).format(value / 100);

test("draft summary has no struck-through originals or savings", async ({
  page,
}) => {
  await page.goto("./");
  const summary = page.getByRole("region", { name: "Quote summary" });
  await expect(summary.locator(".quote-summary-original")).toHaveCount(0);
  await expect(summary.locator(".discount-summary")).toHaveCount(0);
  await expect(summary.locator("s")).toHaveCount(0);
  await expect(summary.locator(".quote-summary-amount")).toHaveText(money(
    quote.sections.reduce((sum, section) => sum + gross(section), 0),
  ));
  for (const section of quote.sections) {
    const row = summary.locator(`[data-summary-section="${section.id}"]`);
    await expect(row.locator(".quote-summary-section-amount")).toHaveText(money(gross(section)));
    await expect(row.locator("s")).toHaveCount(0);
  }
  await page.emulateMedia({ media: "print" });
  await expect(summary.locator("s")).toHaveCount(0);
  await expect(summary.locator(".quote-summary-amount")).toBeVisible();
});
