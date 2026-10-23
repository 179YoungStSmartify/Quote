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
      if (page.text.includes("Optional add-ons"))
        expect(page.text).toContain("Zeneva far-infrared sauna integration");
      if (page.text.includes("Phase 2 · not included"))
        expect(page.text).toContain("Additional automations");
      if (page.text.includes("Included experience"))
        expect(page.text).toContain("Dashboards");
      if (page.text.includes("Notes and terms"))
        expect(page.text).toMatch(/Notes and terms\s+(?:All prices|Section A)/);
    }
    for (const fact of [
      "23/10/2026", "22/11/2026", "30 days from issue",
      "PL-HZL-179YS-0002-v2", "Hazal", "$13,626.00", "$12,350.00",
      "$1,276.00", "$8,570.00", "$3,780.00", "21 hours",
      "36 hours", "15 complimentary", '15.6"', '10"', '4"',
      "6 automations", "NeoPlan3D", "$360.00",
      "existing client AirTouch tablet", "Home Assistant app", "no additional fee",
      "$299.00", "Phase 2", "90 days from issue", "supplier price changes notified before order",
      "A thoughtful foundation for connected living.",
      "Essential smart home and network, thoughtfully planned for your home.",
      "All amounts are in AUD.",
    ])
      expect(text).toContain(fact);
    expect(text).not.toMatch(/Before discount|Savings|\$0\.00|R&D|DRAFT|NOT ISSUED|GST|[\u4e00-\u9fff]/i);
    expect(text).not.toContain("$598.00");
    expect(text).not.toContain("$240.00");
    expect(text).not.toMatch(/paid conversion|re-locking|power loss/i);
    expect(text).not.toMatch(
      /Acceptance|Accepted by:|Signing integration|signature/i,
    );
    expect(text).not.toMatch(
      /QC Realty|Hazel|Section [AB]\b|internal costing|gross profit|markup/i,
    );
  } finally {
    await parser.destroy();
  }
}, 30000);
