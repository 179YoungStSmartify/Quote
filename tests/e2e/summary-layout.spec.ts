import { test, expect } from "@playwright/test";

test("summary total hierarchy, definition alignment, gaps, and print colors hold across widths", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  for (const [width, expectedGap] of [
    [320, 24],
    [900, 24],
    [901, 32],
    [1440, 32],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    const gap = await page.evaluate(() => {
      const summary = document
        .querySelector(".quote-summary")!
        .getBoundingClientRect();
      const overview = document
        .querySelector(".overview")!
        .getBoundingClientRect();
      return overview.top - summary.bottom;
    });
    expect(gap, `${width}px summary to overview gap`).toBeCloseTo(
      expectedGap,
      0,
    );
    await expect(
      page.locator(".quote-summary-total .quote-summary-amount"),
    ).toBeVisible();
    await expect(page.locator(".quote-summary-breakdown dt").first()).toHaveCSS(
      "text-align",
      "left",
    );
    await expect(page.locator(".quote-summary-breakdown dd").first()).toHaveCSS(
      "text-align",
      "right",
    );
    expect(
      await page
        .locator(".quote-summary-total")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
  }
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".hero")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator(".hero p")).toHaveCSS("color", "rgb(36, 33, 28)");
  await expect(page.locator(".quote-summary-total")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.locator(".quote-summary-total .quote-summary-amount"),
  ).toHaveCSS("color", "rgb(36, 33, 28)");
});
