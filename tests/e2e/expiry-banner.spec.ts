import { expect, test } from "@playwright/test";

// The shipped quote is valid until 15/11/2026, so these tests pin the
// banner states with a fixed browser clock rather than the real date.
test("hides the expiry banner while the quote is valid", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T09:00:00"));
  await page.goto("/");
  await expect(page.locator(".expiry-banner")).toHaveCount(0);
});

test("shows the expiring banner within seven days of validUntil", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-12T09:00:00"));
  await page.goto("/");
  await expect(page.locator(".expiry-banner--expiring")).toContainText(
    "expires soon",
  );
  await expect(page.locator(".expiry-banner--expiring")).toContainText(
    "15/11/2026",
  );
});

test("shows the expired banner once validUntil has passed", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-16T09:00:00"));
  await page.goto("/");
  await expect(page.locator(".expiry-banner--expired")).toContainText(
    "expired on 15/11/2026",
  );
  await expect(page.locator(".expiry-banner--expired")).toContainText(
    "refreshed pricing",
  );
});
