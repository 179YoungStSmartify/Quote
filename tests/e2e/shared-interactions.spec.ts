import { expect, test } from "@playwright/test";

test("shared back-to-top and section motion work accessibly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("./");
  const top = page.locator(".back-to-top");
  await expect(top).toBeHidden();
  await expect(top).toHaveAttribute("tabindex", "-1");
  const section = page.locator("#terms");
  await section.evaluate((node) =>
    node.addEventListener(
      "animationstart",
      () => node.setAttribute("data-motion-started", "true"),
      { once: true },
    ),
  );
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute("data-motion-started", "true");
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
  await expect(top).toBeVisible();
  expect((await top.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await top.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(3);
  await expect(page.locator("main")).toBeFocused();
  await expect(top).toBeHidden();
  await page.emulateMedia({ media: "print" });
  await expect(top).toBeHidden();
});

test("shared section entrance and back-to-top skip motion when reduced", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const section = page.locator("#terms");
  await section.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      section.evaluate((node) => getComputedStyle(node).animationName),
    )
    .toBe("none");
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
  await page.locator(".back-to-top").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(3);
});
