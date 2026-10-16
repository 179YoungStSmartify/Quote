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
