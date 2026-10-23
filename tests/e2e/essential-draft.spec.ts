import { expect, test } from "@playwright/test";

test("issued screen and print show issue dates and separate options", async ({
  page,
}) => {
  await page.goto(".");
  await expect(page.locator(".hero")).toContainText("ISSUED 23/10/2026");
  await expect(page.locator(".hero")).toContainText("VALID UNTIL 22/11/2026");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("#overview-details")).toContainText("Valid until 22/11/2026");
  await expect(page.locator(".hero")).not.toContainText("GST");
  await expect(
    page.getByRole("heading", { name: /Optional add-ons/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Phase 2/ })).toBeVisible();
  await expect(page.locator("#optional-addons")).toContainText(
    "not included in the base quote total",
  );
  await expect(page.locator(".quote-summary-total")).toContainText(
    "$13,626.00",
  );
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".draft-banner")).toHaveCount(0);
  await expect(page.locator("#optional-addons")).toContainText(
    "not included in the base quote total",
  );
});
