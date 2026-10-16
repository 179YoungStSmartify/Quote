import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const sha = "0123456789abcdef0123456789abcdef01234567";
async function fixture(t) {
  const root = await mkdtemp(
    join(process.env.TMPDIR || tmpdir(), "react-ui-sync-"),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, "library");
  await mkdir(source);
  await writeFile(
    join(source, "package.json"),
    JSON.stringify({ name: "@perspective-living/react-ui", version: "2.4.1" }),
  );
  await writeFile(join(source, "entry.tsx"), "export const value = 1;");
  return { root, source };
}
function sync(source, target, revision = sha) {
  return spawnSync(
    process.execPath,
    [
      resolve("scripts/sync-snapshot.mjs"),
      source,
      target,
      "--source-sha",
      revision,
    ],
    { encoding: "utf8" },
  );
}

test("rejects unsafe targets, overlapping paths, bad package identity and invalid revisions", async (t) => {
  const { root, source } = await fixture(t);
  for (const target of [
    join(root, "other"),
    join(root, "vendor/react-ui/child"),
    source,
    join(source, "vendor/react-ui"),
  ]) {
    assert.notEqual(sync(source, target).status, 0);
  }
  assert.notEqual(
    sync(source, join(root, "app/vendor/react-ui"), "abc").status,
    0,
  );
  await writeFile(
    join(source, "package.json"),
    JSON.stringify({ name: "wrong", version: "1.0.0" }),
  );
  assert.notEqual(sync(source, join(root, "app/vendor/react-ui")).status, 0);
});

test("stages a snapshot, removes stale content and records source provenance", async (t) => {
  const { root, source } = await fixture(t);
  const target = join(root, "app/vendor/react-ui");
  await mkdir(target, { recursive: true });
  await writeFile(join(target, "stale.txt"), "remove me");
  const result = sync(source, target);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(join(target, "entry.tsx"), "utf8"),
    "export const value = 1;",
  );
  await assert.rejects(readFile(join(target, "stale.txt")));
  const provenance = await readFile(
    join(target, "SNAPSHOT-PROVENANCE.md"),
    "utf8",
  );
  assert.match(provenance, /Library version: 2\.4\.1/);
  assert.match(provenance, new RegExp(sha));
});
