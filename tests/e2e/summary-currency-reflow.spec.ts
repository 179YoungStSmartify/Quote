import { test, expect } from "@playwright/test";

test("enlarged summary currency remains one intact token across column transitions", async ({
  page,
}) => {
  for (const width of [320, 375, 390, 768, 900, 901, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      const elements = [
        ...document.querySelectorAll<HTMLElement>(
          "h1,h2,h3,h4,p,li,dt,dd,a,button,.meta",
        ),
      ];
      const sizes = elements.map((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      );
      elements.forEach((element, index) => {
        element.style.fontSize = `${sizes[index] * 2}px`;
      });
    });
    const measurements = await page
      .locator(".quote-summary-amount, .quote-summary-breakdown dd")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const rects = [...range.getClientRects()];
          const card = element.closest(".card")!.getBoundingClientRect();
          return {
            text: element.textContent,
            lines: new Set(rects.map((rect) => Math.round(rect.top))).size,
            left: Math.min(...rects.map((rect) => rect.left)),
            right: Math.max(...rects.map((rect) => rect.right)),
            cardLeft: card.left,
            cardRight: card.right,
          };
        }),
      );
    expect(measurements.length).toBeGreaterThan(1);
    for (const measurement of measurements) {
      expect(
        measurement.lines,
        `${width}px: ${JSON.stringify(measurement)}`,
      ).toBe(1);
      expect(measurement.left).toBeGreaterThanOrEqual(measurement.cardLeft - 1);
      expect(measurement.right).toBeLessThanOrEqual(measurement.cardRight + 1);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
