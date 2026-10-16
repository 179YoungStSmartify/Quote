import { test, expect } from "@playwright/test";

test("release acceptance: real navigation, mobile focus, summary, and error-free assets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/Quote/");
  await page.evaluate(() => document.fonts.ready);
  const summary = page.getByRole("region", { name: "Quote summary" });
  await expect(summary).toContainText("$16,692.00");
  await expect(summary).toContainText("$15,416.00");
  await expect(summary).toContainText("$1,276.00");
  await expect(summary).toContainText("$3,600.00");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole("dialog").getByRole("link", { name: "Scope" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator("#scope")
        .evaluate((element) =>
          Math.abs(element.getBoundingClientRect().top - 20),
        ),
    )
    .toBeLessThan(4);
  await page.getByRole("link", { name: "Review scope" }).click();
  await expect
    .poll(() =>
      page
        .locator("#scope")
        .evaluate((element) =>
          Math.abs(element.getBoundingClientRect().top - 20),
        ),
    )
    .toBeLessThan(4);
  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
  ).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#scope")).toHaveCSS("break-inside", "auto");
  await expect(
    page.getByText("60 days of support", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("2 years, hardware only", { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
