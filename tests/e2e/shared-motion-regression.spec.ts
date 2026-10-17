import { test, expect } from "@playwright/test";

test("section entrance runs once and visible back-to-top is excluded from print", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  const section = page.locator("#terms");
  await section.evaluate((element) => {
    element.setAttribute("data-entrances", "0");
    element.addEventListener("animationstart", () =>
      element.setAttribute(
        "data-entrances",
        String(Number(element.getAttribute("data-entrances")) + 1),
      ),
    );
  });
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute("data-entrances", "1");
  await section.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute("data-entrances", "1");
  const top = page.getByRole("button", { name: "Back to top" });
  await expect(top).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".back-to-top")).toBeHidden();
});

test("sections stay readable when the observer API is unavailable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "IntersectionObserver");
  });
  await page.goto("./");
  const section = page.locator("#terms");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveCSS("opacity", "1");
  await expect(section).toBeVisible();
  expect(errors).toEqual([]);
});
