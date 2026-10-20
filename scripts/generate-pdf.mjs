import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const quote = JSON.parse(
  await readFile(new URL("../src/quote.json", import.meta.url), "utf8"),
);
const money = (n) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: quote.currency,
  }).format(n / 100);
const clean = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/×/g, "x")
    .replace(/•/g, "-")
    .replace(/[^\x20-\x7E]/g, "?");
const doc = await PDFDocument.create(),
  font = await doc.embedFont(StandardFonts.Helvetica),
  bold = await doc.embedFont(StandardFonts.HelveticaBold);
const W = 595.28,
  H = 841.89,
  M = 48;
let page, y;
function newPage() {
  page = doc.addPage([W, H]);
  y = H - M;
  page.drawRectangle({
    x: 0,
    y: H - 8,
    width: W,
    height: 8,
    color: rgb(0.13, 0.12, 0.1),
  });
  page.drawText("PERSPECTIVE LIVING  /  PROJECT QUOTE", {
    x: M,
    y: H - 31,
    size: 8,
    font: bold,
    color: rgb(0.57, 0.44, 0.23),
  });
  y -= 42;
}
function ensure(h = 22) {
  if (y < h + M) newPage();
}
function text(
  t,
  {
    size = 10,
    b = false,
    color = rgb(0.14, 0.13, 0.11),
    indent = 0,
    gap = 6,
  } = {},
) {
  const f = b ? bold : font,
    s = clean(t),
    max = W - M * 2 - indent;
  const words = s.split(/\s+/);
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (f.widthOfTextAtSize(next, size) > max) {
      ensure(size + gap);
      page.drawText(line, { x: M + indent, y, size, font: f, color });
      y -= size + gap;
      line = word;
    } else line = next;
  }
  if (line) {
    ensure(size + gap);
    page.drawText(line, { x: M + indent, y, size, font: f, color });
    y -= size + gap;
  }
}
function rule() {
  ensure(12);
  page.drawLine({
    start: { x: M, y },
    end: { x: W - M, y },
    thickness: 0.6,
    color: rgb(0.86, 0.83, 0.77),
  });
  y -= 12;
}
function title(t) {
  ensure(32);
  text(t, { size: 18, b: true, color: rgb(0.27, 0.22, 0.16), gap: 12 });
}
newPage();
text("Prepared for " + quote.preparedFor, { size: 10, b: true });
text(quote.site, { size: 10 });
text(
  "Quote " +
    quote.quoteId +
    "  |  Prepared " +
    quote.quoteDate +
    "  |  Valid until " +
    quote.validUntil,
  { size: 9, color: rgb(0.42, 0.4, 0.36) },
);
y -= 10;
text(quote.presentation.heroHeadline, {
  size: 24,
  b: true,
  color: rgb(0.13, 0.12, 0.1),
  gap: 14,
});
text(quote.presentation.heroSubheading, { size: 10, gap: 10 });
text("Prepared by " + quote.preparedBy, { size: 11 });
rule();
title("Scope and investment");
text(quote.scopeIntroduction, { size: 10 });
text(quote.presentation.currencyNote, { size: 9, color: rgb(0.42, 0.4, 0.36) });
for (const s of quote.sections) {
  ensure(60);
  text(s.title, { size: 13, b: true, color: rgb(0.4, 0.31, 0.17), gap: 8 });
  for (const [itemIndex, item] of s.items.entries()) {
    if (s.interimSubtotal?.afterItemCount === itemIndex) {
      text(
        `${s.interimSubtotal.label}     ${money(s.interimSubtotal.amountCents)}`,
        { size: 9, b: true, color: rgb(0.42, 0.4, 0.36), gap: 8 },
      );
    }
    const value = item.quantity * item.unitCents;
    const label = clean(item.name);
    const parts =
      label.length > 80 ? [label.slice(0, 80), label.slice(80)] : [label];
    ensure(parts.length * 12.5 + 24);
    text(parts[0], { size: 8.5, gap: 4 });
    if (parts[1]) text(parts[1], { size: 8.5, gap: 4, indent: 8 });
    text(`${item.quantity} x ${money(item.unitCents)}     ${money(value)}`, {
      size: 8,
      color: rgb(0.42, 0.4, 0.36),
      indent: 8,
      gap: 8,
    });
  }
  if (
    s.interimSubtotal &&
    s.interimSubtotal.afterItemCount === s.items.length
  ) {
    text(
      `${s.interimSubtotal.label}     ${money(s.interimSubtotal.amountCents)}`,
      { size: 9, b: true, color: rgb(0.42, 0.4, 0.36), gap: 8 },
    );
  }
  if (s.grossSubtotal) {
    text(`${s.grossSubtotal.label}     ${money(s.grossSubtotal.amountCents)}`, {
      size: 9,
      b: true,
      color: rgb(0.42, 0.4, 0.36),
      gap: 8,
    });
  }
  if (s.discount) {
    text(s.discount.label, { size: 9, b: true });
    text(
      `${s.discount.quantity} × ${money(s.discount.unitCents)}     ${money(s.discount.quantity * s.discount.unitCents)}`,
      { size: 8, color: rgb(0.42, 0.4, 0.36), indent: 8 },
    );
  }
  text(
    `${s.finalLabel || `${s.title} subtotal`}     ${money(s.items.reduce((a, x) => a + x.quantity * x.unitCents, 0) + (s.discount ? s.discount.quantity * s.discount.unitCents : 0))}`,
    { size: 10, b: true, gap: 11 },
  );
}
const total = quote.sections.reduce(
  (a, s) =>
    a +
    s.items.reduce((b, x) => b + x.quantity * x.unitCents, 0) +
    (s.discount ? s.discount.quantity * s.discount.unitCents : 0),
  0,
);
rule();
text("TOTAL  " + money(total), {
  size: 17,
  b: true,
  color: rgb(0.34, 0.26, 0.15),
  gap: 14,
});
text(
  quote.discountSummary +
    ": " +
    money(
      quote.sections.reduce(
        (a, s) =>
          a +
          (s.discount
            ? Math.abs(s.discount.quantity * s.discount.unitCents)
            : 0),
        0,
      ),
    ),
  { size: 9 },
);
y -= 12;
title("Included experience");
for (const [label, items] of Object.entries(quote.inclusions)) {
  ensure(60);
  y -= 6;
  text(label.charAt(0).toUpperCase() + label.slice(1), { size: 12, b: true });
  for (const item of items) {
    if (typeof item === "string") {
      text("- " + item, { size: 9, indent: 8, gap: 5 });
    } else {
      ensure(40);
      text("- " + item.label, { size: 9, b: true, indent: 8, gap: 5 });
      for (const child of item.items)
        text("- " + child, { size: 9, indent: 22, gap: 5 });
    }
  }
}
// Avoid starting the terms block in a short tail after expanded inclusions.
ensure(240);
y -= 12;
title("Notes and terms");
for (const item of quote.terms)
  text("- " + item, { size: 9, indent: 8, gap: 6 });
ensure(60);
text("Hyper-care", { size: 11, b: true });
text(quote.hyperCare, { size: 9 });
ensure(60);
text("Hardware warranty", { size: 11, b: true });
text(quote.warranty, { size: 9 });
ensure(60);
text("Acceptance", { size: 11, b: true });
text(quote.signing, { size: 9 });
text("Accepted by: __________________________    Date: ____ / ____ / ______", {
  size: 9,
});
for (const [i, p] of doc.getPages().entries())
  p.drawText(`${i + 1} / ${doc.getPageCount()}`, {
    x: W - M - 30,
    y: 20,
    size: 8,
    font,
    color: rgb(0.45, 0.43, 0.4),
  });
const out = resolve(
  dirname(new URL(import.meta.url).pathname),
  "../dist/quote.pdf",
);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, await doc.save());
console.log(`Generated ${out} (${doc.getPageCount()} pages, ${money(total)})`);
