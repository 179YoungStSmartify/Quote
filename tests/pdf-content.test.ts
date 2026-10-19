import { it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  PDFArray,
  PDFDocument,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";

it("generates the approved v2 PDF content without stale labels or private material", async () => {
  execFileSync(process.execPath, ["scripts/generate-pdf.mjs"]);
  const document = await PDFDocument.load(readFileSync("dist/quote.pdf"));
  const pageTexts = document
    .getPages()
    .map((page) => {
      const contents = page.node.Contents();
      const streams =
        contents instanceof PDFArray
          ? contents
              .asArray()
              .map((reference) => document.context.lookup(reference))
          : [contents];
      return streams.flatMap((stream) => {
        if (!(stream instanceof PDFRawStream))
          throw new Error("Unexpected PDF content stream");
        const operators = Buffer.from(
          decodePDFRawStream(stream).decode(),
        ).toString("latin1");
        return [...operators.matchAll(/<([0-9a-f]+)>\s*Tj/gi)].map((match) =>
          Buffer.from(match[1], "hex").toString("latin1"),
        );
      });
    })
    .map((lines) => lines.join(" "));
  const text = pageTexts.join(" ");
  for (const page of pageTexts) {
    if (page.includes("Hardware warranty"))
      expect(page).toContain("2 years, hardware only.");
    if (page.includes("Hyper-care"))
      expect(page).toContain("For 60 days after handover");
    if (page.includes("Acceptance")) expect(page).toContain("Accepted by:");
  }
  expect(document.getPageCount()).toBeGreaterThan(0);
  for (const fact of [
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
    /QC Realty|Hazel|\bGST\b|Section [AB]\b|internal costing|gross profit|markup/i,
  );
});
