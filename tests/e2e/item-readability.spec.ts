import { test, expect } from "@playwright/test";
import quote from "../../src/quote.json" with { type: "json" };

test("all item quantities and prices are visible without sideways panning", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  const money = (cents: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: quote.currency,
    }).format(cents / 100);
  const expected = quote.sections.flatMap((section) => [
    ...section.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitCents: item.unitCents,
    })),
    ...(section.discount
      ? [
          {
            name: section.discount.label,
            quantity: section.discount.quantity,
            unitCents: section.discount.unitCents,
          },
        ]
      : []),
  ]);
  for (const width of [320, 360, 375, 390, 430, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    const items = page
      .getByTestId("mobile-quote-items")
      .locator(".mobile-item");
    await expect(items).toHaveCount(expected.length);
    await expect(page.getByRole("table")).toHaveCount(0);
    for (let index = 0; index < expected.length; index++) {
      const item = items.nth(index);
      await expect(item.locator("h4")).toHaveText(expected[index].name);
      await expect(item.locator("dd")).toHaveText([
        String(expected[index].quantity),
        money(expected[index].unitCents),
        money(expected[index].unitCents * expected[index].quantity),
      ]);
    }
    const overflow = await page
      .locator(".mobile-item h4, .mobile-item dt, .mobile-item dd")
      .evaluateAll((elements) =>
        elements
          .filter((element) => {
            const box = element.getBoundingClientRect();
            return (
              element.scrollWidth > element.clientWidth + 1 ||
              box.left < -1 ||
              box.right > innerWidth + 1
            );
          })
          .map((element) => element.textContent),
      );
    expect(overflow, `item content must fit at ${width}px`).toEqual([]);
  }
  await page.emulateMedia({ media: "print" });
  await expect(page.getByTestId("mobile-quote-items")).toBeHidden();
  await expect(page.getByRole("table")).toHaveCount(1);
});
