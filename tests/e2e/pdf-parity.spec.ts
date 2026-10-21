import { test, expect } from "@playwright/test";
import { PDFParse } from "pdf-parse";

const norm = (value: string) => value.replace(/\s+/g, " ").trim();
test("downloaded PDF matches browser print page by page without signing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(".");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByText(/Acceptance|Accepted by:|Signing integration/i),
  ).toHaveCount(0);
  const link = page
    .getByRole("link", { name: "Download quote PDF", exact: true })
    .first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error("PDF download link is missing");
  const response = await page.request.get(new URL(href, page.url()).href);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  const parser = new PDFParse({ data: await response.body() });
  try {
    const generated = await parser.getText();
    await page.emulateMedia({ media: "print" });
    await expect(
      page.getByText(/Acceptance|Accepted by:|Signing integration/i),
    ).toHaveCount(0);
    const independent = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });
    const other = new PDFParse({ data: independent });
    try {
      const printed = await other.getText();
      expect(generated.pages).toHaveLength(printed.pages.length);
      generated.pages.forEach((p, i) =>
        expect(norm(p.text)).toBe(norm(printed.pages[i].text)),
      );
    } finally {
      await other.destroy();
    }
  } finally {
    await parser.destroy();
  }
});
