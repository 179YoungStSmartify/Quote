import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("production prefix, quote navigation, responsive widths, print and real PDF download", async ({
  page,
  request,
}) => {
  await page.goto("/Quote/");
  await expect(
    page.getByRole("heading", { name: /thoughtful foundation/i }),
  ).toBeVisible();
  await expect(page.getByText("PL-HZL-179YS-0001-v1")).toBeVisible();
  await expect(page.getByText("$16,692.00").first()).toBeVisible();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    expect(
      await page.locator("body").evaluate((e) => e.scrollWidth <= innerWidth),
      `document overflow at ${width}px`,
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Details" }).click();
  await expect(page).toHaveURL(/#terms$/);
  await page.getByRole("link", { name: "Review scope" }).click();
  await expect(page).toHaveURL(/#scope$/);
  const [pdf] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Download quote PDF" }).first().click(),
  ]);
  expect(pdf.suggestedFilename()).toBe("PL-HZL-179YS-0001-v1.pdf");
  expect((await readFile(await pdf.path())).subarray(0, 4).toString()).toBe(
    "%PDF",
  );
  const response = await request.get("quote.pdf");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/pdf/);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".topbar")).toHaveCSS("display", "none");
});
