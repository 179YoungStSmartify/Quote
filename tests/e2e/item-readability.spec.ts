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
      const quantity = item.locator('[data-fact="quantity"]');
      const unit = item.locator('[data-fact="unit-price"]');
      const lineTotal = item.locator('[data-fact="line-total"]');
      await expect(quantity.locator("dt")).toHaveText("Quantity");
      await expect(unit.locator("dt")).toHaveText("Unit price");
      await expect(lineTotal.locator("dt")).toHaveText("Line total");
      const hierarchy = await item.evaluate((element) => {
        const unitAmount = element.querySelector(
          '[data-fact="unit-price"] dd',
        )!;
        const totalAmount = element.querySelector(
          '[data-fact="line-total"] dd',
        )!;
        const totalBox = totalAmount.getBoundingClientRect();
        const cardBox = element.getBoundingClientRect();
        return {
          unitFont: parseFloat(getComputedStyle(unitAmount).fontSize),
          totalFont: parseFloat(getComputedStyle(totalAmount).fontSize),
          unitWeight: parseInt(getComputedStyle(unitAmount).fontWeight, 10),
          totalWeight: parseInt(getComputedStyle(totalAmount).fontWeight, 10),
          totalRight: totalBox.right,
          totalTop: totalBox.top,
          unitBottom: unitAmount.getBoundingClientRect().bottom,
          contentRight:
            cardBox.right - parseFloat(getComputedStyle(element).paddingRight),
          card: [cardBox.left, cardBox.right],
          total: [totalBox.left, totalBox.right],
          dl: (() => {
            const box = element.querySelector("dl")!.getBoundingClientRect();
            return [box.left, box.right];
          })(),
        };
      });
      if (width <= 430) {
        expect(
          hierarchy.totalTop,
          "normal phone layout puts the total beside secondary metadata, not below it",
        ).toBeLessThanOrEqual(hierarchy.unitBottom);
      }
      expect(
        hierarchy.totalFont,
        `line total emphasis at ${width}px`,
      ).toBeGreaterThan(hierarchy.unitFont);
      expect(
        hierarchy.totalWeight,
        `line total weight at ${width}px`,
      ).toBeGreaterThanOrEqual(hierarchy.unitWeight);
      expect(
        Math.abs(hierarchy.contentRight - hierarchy.totalRight),
        `line total right edge at ${width}px: ${JSON.stringify(hierarchy)}`,
      ).toBeLessThanOrEqual(1.5);
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
  await expect(page.locator(".mobile-item--discount")).toHaveCount(1);
  await expect(page.locator(".saving")).toHaveText("You save: $2,700.00");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("tr.discount")).toHaveCount(1);
  await expect(page.locator(".saving")).toHaveText("You save: $2,700.00");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByTestId("mobile-quote-items")).toBeHidden();
  await expect(page.getByRole("table")).toHaveCount(1);
  await expect(page.locator("tr.discount")).toHaveCount(1);
});
