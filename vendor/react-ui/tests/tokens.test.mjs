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
  assert.match(css, /env\(safe-area-inset-top\)/);
});
