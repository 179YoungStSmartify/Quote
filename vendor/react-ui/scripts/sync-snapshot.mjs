#!/usr/bin/env node
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

const [sourceArg, targetArg, ...flags] = process.argv.slice(2);
const shaIndex = flags.indexOf("--source-sha");
const sha = shaIndex >= 0 ? flags[shaIndex + 1] : "";
const usage =
  "Usage: node scripts/sync-snapshot.mjs <library-source> <app/vendor/react-ui> --source-sha <40-hex-git-sha>";

function fail(message) {
  console.error(message);
  process.exit(2);
}

if (!sourceArg || !targetArg || !/^[\da-f]{40}$/i.test(sha)) fail(usage);

const source = resolve(sourceArg);
const target = resolve(targetArg);
const vendorSuffix = `${sep}vendor${sep}react-ui`;
if (
  !target.endsWith(vendorSuffix) ||
  source === target ||
  source.startsWith(`${target}${sep}`) ||
  target.startsWith(`${source}${sep}`)
) {
  fail(
    "Source and target must be disjoint, and target must end in vendor/react-ui.",
  );
}

const sourcePackage = JSON.parse(
  await readFile(join(source, "package.json"), "utf8"),
);
if (sourcePackage.name !== "@perspective-living/react-ui")
  fail("Source package must be @perspective-living/react-ui.");
const parent = dirname(target);
const staging = join(parent, `.react-ui-stage-${randomUUID()}`);
const backup = join(parent, `.react-ui-backup-${randomUUID()}`);
await mkdir(parent, { recursive: true });
try {
  await mkdir(staging);
  for (const name of await readdir(source)) {
    if (["node_modules", "dist", ".git"].includes(name)) continue;
    await cp(join(source, name), join(staging, name), { recursive: true });
  }
  await writeFile(
    join(staging, "SNAPSHOT-PROVENANCE.md"),
    `# Vendored react-ui snapshot\n\n- Library version: ${sourcePackage.version}\n- Source revision: ${sha}\n- Sync command: \`node scripts/sync-snapshot.mjs <library-source> <app/vendor/react-ui> --source-sha <git-sha>\`\n- Keep this directory aligned with the source library (excluding this generated provenance record).\n`,
  );
  let hadTarget = false;
  try {
    await stat(target);
    hadTarget = true;
  } catch {}
  if (hadTarget) await rename(target, backup);
  try {
    await rename(staging, target);
  } catch (error) {
    if (hadTarget) await rename(backup, target);
    throw error;
  }
  if (hadTarget) await rm(backup, { recursive: true, force: true });
  console.log(`Synced ${source} -> ${target} at ${sha}`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
