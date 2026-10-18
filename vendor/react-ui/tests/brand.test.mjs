import { test } from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

test("shared header exports a decorative brand mark from the approved SVG", async () => {
  const source = await readFile(
    new URL("../src/index.tsx", import.meta.url),
    "utf8",
  );
  const mark = await readFile(
    new URL("../src/brand-mark.svg", import.meta.url),
  );
  // Pin approved artwork without requiring any consumer checkout beside this library.
  const approved =
    "ebce36b498429dc3ac6d0a1f8921e88f7b34fc0d28e67904a9ce09948b03b9f1";

  assert.match(source, /export function BrandMark\(/);
  assert.match(source, /export function Brand\(/);
  assert.match(source, /BrandMark/);
  assert.match(
    source,
    /new URL\("\.\/brand-mark\.svg", import\.meta\.url\)\.href/,
  );
  assert.equal(
    createHash("sha256").update(mark).digest("hex"),
    approved,
    "the header mark must retain the approved artwork byte-for-byte",
  );
  assert.match(source, /alt=""/);
  assert.match(source, /aria-hidden="true"/);
});
