import { test, expect } from "@playwright/test";

test("phone item text and money remain fully visible with 200 percent text enlargement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  const normalFonts = await page
    .locator("h1,h2,h3,h4,p,li,dt,dd,a,button,.meta")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        size: parseFloat(getComputedStyle(element).fontSize),
      })),
    );
  await page.locator("h1,h2,h3,h4,p,li,dt,dd,a,button,.meta").evaluateAll(
    (elements, fonts) =>
      elements.forEach((element, index) => {
        (element as HTMLElement).style.fontSize = `${fonts[index].size * 2}px`;
      }),
    normalFonts,
  );
  const defects = await page
    .locator(".mobile-item h4, .mobile-item dt, .mobile-item dd")
    .evaluateAll((elements) =>
      elements
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => element.textContent),
    );
  expect(
    defects,
    "no clipped or overflowing item labels or monetary values at twice their normal font size",
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByTestId("mobile-quote-items")).toBeVisible();
});
