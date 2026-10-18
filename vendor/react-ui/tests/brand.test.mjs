import { test } from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

test("shared header exports a decorative brand mark from the approved SVG", async () => {
  const source = await readFile(new URL("../src/index.tsx", import.meta.url), "utf8");
  const mark = await readFile(new URL("../src/brand-mark.svg", import.meta.url), "utf8");
  const approved = await readFile(
    new URL("../../Quote/public/favicon.svg", import.meta.url),
    "utf8",
  );

  assert.match(source, /export function BrandMark\(/);
  assert.match(source, /export function Brand\(/);
  assert.match(source, /BrandMark/);
  assert.match(source, /new URL\("\.\/brand-mark\.svg", import\.meta\.url\)\.href/);
  assert.equal(mark, approved, "the header mark must retain the approved artwork byte-for-byte");
  assert.match(source, /alt=""/);
  assert.match(source, /aria-hidden="true"/);
});
