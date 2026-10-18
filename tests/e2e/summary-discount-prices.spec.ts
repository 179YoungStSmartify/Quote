import { test, expect } from "@playwright/test";
import quote from "../../src/quote.json" with { type: "json" };

const gross = (section: (typeof quote.sections)[number]) =>
  section.items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
const money = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: quote.currency,
  }).format(value / 100);

test("summary distinguishes original and discounted totals without changing savings", async ({
  page,
}) => {
  await page.goto("./");
  const before = quote.sections.reduce(
    (sum, section) => sum + gross(section),
    0,
  );
  const adjustment = quote.sections.reduce(
    (sum, section) =>
      sum +
      (section.discount
        ? section.discount.quantity * section.discount.unitCents
        : 0),
    0,
  );
  const summary = page.getByRole("region", { name: "Quote summary" });
  await expect(summary.locator(".quote-summary-original s")).toHaveText(
    money(before),
  );
  await expect(summary.locator(".quote-summary-original")).toContainText(
    "Before discount",
  );
  await expect(summary.locator(".quote-summary-amount")).toHaveText(
    money(before + adjustment),
  );
  for (const section of quote.sections) {
    const row = summary.locator(`[data-summary-section="${section.id}"]`);
    const reduction = section.discount
      ? section.discount.quantity * section.discount.unitCents
      : 0;
    await expect(row.locator(".quote-summary-section-amount")).toHaveText(
      money(gross(section) + reduction),
    );
    if (reduction < 0) {
      await expect(row.locator("s")).toHaveText(money(gross(section)));
      await expect(row).toContainText("Before discount:");
      await expect(row).toContainText("After discount:");
      await expect(row.locator("s")).toHaveCSS(
        "text-decoration-line",
        "line-through",
      );
    } else {
      await expect(row.locator("s")).toHaveCount(0);
    }
  }
  await expect(summary.locator(".discount-summary dt")).toHaveText(
    quote.discountSummary,
  );
  await expect(summary.locator(".discount-summary dd")).toHaveText(
    money(-adjustment),
  );
  await page.emulateMedia({ media: "print" });
  await expect(summary.locator(".quote-summary-original s")).toHaveCSS(
    "text-decoration-line",
    "line-through",
  );
  await expect(summary.locator(".quote-summary-amount")).toBeVisible();
});
