import { expect, test } from "@playwright/test";
import { PDFParse } from "pdf-parse";

// The shipped quote is valid until 15/11/2026, so these tests pin the
// banner states with a fixed browser clock rather than the real date.
test("hides the expiry banner while the quote is valid", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T09:00:00+10:00"));
  await page.goto("/");
  await expect(page.locator(".expiry-banner")).toHaveCount(0);
});

test("shows the expiring banner within seven days of validUntil", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-12T09:00:00+10:00"));
  await page.goto("/");
  await expect(page.locator(".expiry-banner--expiring")).toContainText(
    "expires soon",
  );
  await expect(page.locator(".expiry-banner--expiring")).toContainText(
    "15/11/2026",
  );
});

test("shows the expired banner once validUntil has passed", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-16T09:00:00+10:00"));
  await page.goto("/");
  await expect(page.locator(".expiry-banner--expired")).toContainText(
    "expired on 15/11/2026",
  );
  await expect(page.locator(".expiry-banner--expired")).toContainText(
    "refreshed pricing",
  );
});

test("native print includes the expired warning with a pinned browser clock", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-16T09:00:00+10:00"));
  await page.goto("/");
  await expect(page.locator(".expiry-banner--expired")).toContainText(
    "refreshed pricing",
  );
  await expect(page.locator(".expiry-banner--expired")).toContainText(
    "expired on 15/11/2026",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
  const parser = new PDFParse({
    data: await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    }),
  });
  try {
    const result = await parser.getText();
    expect(result.text.replace(/\s+/g, " ")).toContain(
      "This quote expired on 15/11/2026.",
    );
    expect(result.text.replace(/\s+/g, " ")).toContain("refreshed pricing.");
  } finally {
    await parser.destroy();
  }
});
