import { expect, test } from "@playwright/test";

test("draft screen and print identify unissued quote and separate options", async ({
  page,
}) => {
  await page.goto(".");
  await expect(page.locator(".hero")).toContainText("DRAFT · NOT ISSUED");
  await expect(page.locator(".hero")).toContainText("DRAFTED 21/10/2026");
  await expect(page.locator(".hero")).toContainText(
    "VALIDITY: 30 DAYS FROM ISSUE",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".hero")).not.toContainText("Valid until");
  await expect(page.locator(".hero")).not.toContainText("15/11/2026");
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
  await expect(page.locator(".draft-banner")).toBeVisible();
  await expect(page.locator("#optional-addons")).toContainText(
    "not included in the base quote total",
  );
});
