import { it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

it("PDF uses the React print page and preserves approved facts without signing", async () => {
  execFileSync(process.execPath, ["scripts/generate-pdf.mjs"], {
    stdio: "inherit",
    timeout: 60000,
  });
  for (const name of await readdir("dist/assets")) {
    if (name.endsWith(".js"))
      expect(await readFile(`dist/assets/${name}`, "utf8")).not.toContain(
        "Download the React DevTools",
      );
  }
  const parser = new PDFParse({ data: await readFile("dist/quote.pdf") });
  try {
    const parsed = await parser.getText();
    const text = parsed.pages
      .map((page) => page.text)
      .join(" ")
      .replace(/\s+/g, " ");
    expect(parsed.pages.length).toBeGreaterThan(0);
    for (const page of parsed.pages) {
      if (page.text.includes("Included experience"))
        expect(page.text).toContain("Dashboards");
      if (page.text.includes("Notes and terms"))
        expect(page.text).toContain("This quote includes");
    }
    for (const fact of [
      "Quote summary",
      "Before discount",
      "PL-HZL-179YS-0001-v2",
      "Hazal",
      "$15,453.20",
      "$14,177.20",
      "$1,276.00",
      "$4,977.20",
      "$17,777.20",
      "80 hours",
      "$10,800.00",
      "$2,000.00",
      "-$3,600.00",
      "Chinese spoken-language understanding",
      "NeoPlan3D",
      "10 automations, including:",
      '"I\'m home" scene.',
      '"I\'m leaving" scene.',
      "1 scene-control dashboard.",
      "1 mobile dashboard per account/person.",
      "hardware only",
    ])
      expect(text).toContain(fact);
    expect(text).not.toMatch(
      /Acceptance|Accepted by:|Signing integration|signature/i,
    );
    expect(text).not.toMatch(
      /QC Realty|Hazel|\bGST\b|Section [AB]\b|internal costing|gross profit|markup/i,
    );
  } finally {
    await parser.destroy();
  }
}, 30000);
