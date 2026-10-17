import { test } from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

test("shared UI preserves editorial tokens, print, focus, and reduced motion", async () => {
  const css = await readFile(
    new URL("../src/styles.css", import.meta.url),
    "utf8",
  );
  for (const token of [
    "#f6f3ed",
    "#24211c",
    "#94703a",
    "Playfair Display",
    "DM Sans",
    "focus-visible",
    "@media print",
    "prefers-reduced-motion",
  ]) {
    assert.ok(css.includes(token), `missing ${token}`);
  }
});

test("shared layout starts narrow with fluid sizing and accessible touch targets", async () => {
  const css = await readFile(
    new URL("../src/styles.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /@media \(min-width: 901px\)/);
  assert.match(css, /min-height: 44px/);
  assert.doesNotMatch(css, /min-width: 320px/);
  assert.match(css, /DM Sans Variable/);
  assert.match(css, /Playfair Display Variable/);
  assert.match(css, /env\(safe-area-inset-top\)/);
});

test("shared back-to-top and section motion remain accessible and restrained", async () => {
  const source = await readFile(
    new URL("../src/index.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../src/styles.css", import.meta.url),
    "utf8",
  );
  assert.match(source, /window\.scrollY > 480/);
  assert.match(source, /aria-label="Back to top"/);
  assert.match(source, /aria-hidden=\{!visible\}/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /IntersectionObserver/);
  assert.match(css, /\.back-to-top\s*\{[^}]*min-height:\s*48px/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media print/);
  assert.doesNotMatch(css, /opacity:\s*0;/);
});

test("shared controls merge classes and provide explicit focus, disabled, and print states", async () => {
  const source = await readFile(
    new URL("../src/index.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../src/styles.css", import.meta.url),
    "utf8",
  );
  assert.match(source, /className=\{\["button", variant, className\]/);
  assert.match(css, /--bronze-text:/);
  assert.match(css, /--space-xs:/);
  assert.match(css, /--type-section:/);
  assert.match(css, /\.table-wrap:focus-visible/);
  assert.match(css, /\.button:disabled/);
  assert.match(css, /\.card--interactive:hover/);
  assert.match(css, /\.section > h2::after/);
  assert.match(
    css,
    /\.mobile-overlay,[\s\S]*?\.mobile-panel[\s\S]*?display:\s*none\s*!important/,
  );
  assert.match(css, /@media print[\s\S]*?transform:\s*none\s*!important/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transform:\s*none\s*!important/,
  );
});
