import { test, expect } from "@playwright/test";

test("static cards stay still and reduced motion preserves full-width navigation", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  const card = page.locator(".card").first();
  await card.hover();
  await expect(card).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page
      .locator(".topbar")
      .evaluate((element) => ({
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
    expect(Math.abs(bounds.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.right - bounds.viewport)).toBeLessThanOrEqual(1);
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.viewport);
  }
});

test("print suppresses an already-open mobile portal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("./");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".mobile-panel")).toBeHidden();
  await expect(page.locator(".mobile-overlay")).toBeHidden();
  await expect(page.locator(".topbar")).toBeHidden();
});
