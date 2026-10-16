import { test, expect, devices } from "@playwright/test";

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
  for (const width of [320, 360, 375, 390, 430, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByTestId("mobile-quote-items")).toBeVisible();
    await expect(page.getByTestId("mobile-quote-items")).toContainText(
      "Unit price",
    );
    await expect(page.getByTestId("mobile-quote-items")).toContainText(
      "Line total",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".table-wrap table")).toBeVisible();
  await expect(page.getByTestId("mobile-quote-items")).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await menu.evaluate((el) => el.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);
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

test("real phone emulation keeps all quote values readable in both orientations and enlarged text", async ({
  browser,
}) => {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    baseURL: "http://127.0.0.1:4175/Quote/",
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByTestId("mobile-quote-items")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addStyleTag({
    content:
      "html { font-size: 125% !important; } body { zoom: 1.25 !important; }",
  });
  await expect(page.getByTestId("mobile-quote-items")).toContainText(
    "Line total",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".mobile-item")
      .evaluateAll((items) =>
        items.every(
          (item) =>
            item.scrollWidth <= item.clientWidth + 1 &&
            item.scrollHeight <= item.clientHeight + 1,
        ),
      ),
  ).toBe(true);
  await context.close();
});
