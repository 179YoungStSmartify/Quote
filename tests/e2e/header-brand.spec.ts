import { expect, test } from "@playwright/test";

test("header brand shows the decorative mark and returns to the real page top", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator("header.topbar");
  const brand = header.locator("a.brand");
  const mark = header.locator("img.brand-mark");

  await expect(brand).toBeVisible();
  await expect(mark).toHaveCount(1);
  await expect(brand).toContainText("Perspective Living");
  await expect(brand).toHaveAccessibleName(
    "Perspective Living SMART HOME & NETWORKS",
  );
  await expect(mark).toHaveAttribute("alt", "");
  await expect(mark).toHaveAttribute("aria-hidden", "true");
  await expect
    .poll(() => mark.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await expect(page.locator(".hero img.brand-mark")).toHaveCount(0);

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(brand).toBeFocused();
  await expect(brand).toHaveCSS("outline-style", "solid");
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(3);
  await expect(page.locator("#top")).toHaveCount(1);
  await expect(page.locator("header.topbar#top")).toHaveCount(1);

  for (const width of [320, 375, 720, 721, 901, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const brandBox = await brand.boundingBox();
    const markBox = await mark.boundingBox();
    expect(brandBox?.height).toBeGreaterThanOrEqual(44);
    expect(markBox?.width).toBeGreaterThan(0);
    expect(markBox!.x + markBox!.width).toBeLessThanOrEqual(
      brandBox!.x + brandBox!.width + 1,
    );
    expect(
      await page
        .locator("body")
        .evaluate(
          (body) => body.scrollWidth <= document.documentElement.clientWidth,
        ),
    ).toBe(true);
    const menu = page.getByRole("button", { name: "Open navigation" });
    if (width < 721) {
      const menuBox = await menu.boundingBox();
      expect(menuBox?.width).toBeGreaterThanOrEqual(44);
      expect(menuBox?.height).toBeGreaterThanOrEqual(44);
      expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(menuBox!.x + 1);
    } else {
      await expect(menu).toBeHidden();
    }
  }

  await page.setViewportSize({ width: 320, height: 800 });
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  const fontSizes = await page
    .locator(
      ".topbar .brand, .topbar .brand span, .topbar .brand small, .topbar .menu-trigger",
    )
    .evaluateAll((elements) => {
      const sizes = elements.map((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      );
      elements.forEach((element, index) => {
        (element as HTMLElement).style.fontSize = `${sizes[index] * 2}px`;
      });
      return sizes;
    });
  expect(
    await brand.evaluate((link) => parseFloat(getComputedStyle(link).fontSize)),
  ).toBeCloseTo(fontSizes[0] * 2);
  expect(
    await brand
      .locator("span")
      .evaluate((copy) => copy.scrollWidth <= copy.clientWidth + 1),
  ).toBe(true);
  const enlargedBrand = await brand.boundingBox();
  const enlargedMark = await mark.boundingBox();
  const enlargedTrigger = await trigger.boundingBox();
  expect(enlargedBrand?.height).toBeGreaterThanOrEqual(44);
  expect(enlargedMark?.width).toBeGreaterThan(0);
  expect(enlargedTrigger?.width).toBeGreaterThanOrEqual(44);
  expect(enlargedTrigger?.height).toBeGreaterThanOrEqual(44);
  expect(
    await page
      .locator("body")
      .evaluate(
        (body) => body.scrollWidth <= document.documentElement.clientWidth,
      ),
  ).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
  await brand.evaluate((link: HTMLAnchorElement) =>
    link.focus({ preventScroll: true }),
  );
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(3);

  await page.emulateMedia({ media: "print" });
  await expect(header).toBeHidden();
});
