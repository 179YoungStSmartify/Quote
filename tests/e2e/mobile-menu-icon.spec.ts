import { test, expect } from "@playwright/test";

test.use({ hasTouch: true });

test("mobile navigation uses an accessible hamburger with a generous touch target", async ({
  page,
}) => {
  await page.goto("./");
  for (const width of [320, 390, 720]) {
    await page.setViewportSize({ width, height: 900 });
    const trigger = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText("");
    const icon = trigger.locator("svg");
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveAttribute("focusable", "false");
    const box = await trigger.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await trigger.tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Radix correctly hides the background trigger from the accessibility tree while modal.
    await expect(page.locator(".menu-trigger")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("button", { name: "Close navigation", exact: true })
      .click();
    await expect(trigger).toBeFocused();
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
});
