import { expect, test } from "@playwright/test";

test("an unissued draft stays a draft past any hypothetical validity date", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2030-11-16T09:00:00+10:00"));
  await page.goto(".");
  await expect(page.locator(".draft-banner")).toContainText("DRAFT");
  await expect(page.locator(".expiry-banner")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
