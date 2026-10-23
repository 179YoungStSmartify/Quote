import { expect, test } from "@playwright/test";

test("issued quote clock shows active, expiring, then expired in Brisbane time", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-15T23:59:58+10:00"));
  await page.goto(".");
  await expect(page.locator(".expiry-banner")).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2026-11-16T00:00:00+10:00"));
  await page.reload();
  await expect(page.locator(".expiry-banner")).toContainText("expires soon");
  await page.clock.setFixedTime(new Date("2026-11-23T00:00:00+10:00"));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("expired on 22/11/2026");
  await page.clock.setFixedTime(new Date("2027-01-01T00:00:00+10:00"));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("expired");
  await expect(page.locator(".draft-banner")).toHaveCount(0);
});
