import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repo = process.cwd();
function fixture(script: string, validUntil: string | null, status?: string, draftedOn?: string) {
  const root = mkdtempSync(join(tmpdir(), "quote-expiry-cli-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "scripts/check-quote-expiry.mjs"), script);
  writeFileSync(
    join(root, "src/quoteExpiry.ts"),
    readFileSync(join(repo, "src/quoteExpiry.ts")),
  );
  writeFileSync(
    join(root, "src/quote.json"),
    JSON.stringify({ validUntil, quoteDate: status === "draft" ? null : "01/11/2026", status, draftedOn, quoteId: "fixture" }),
  );
  return root;
}
function run(root: string, now: string, timezone: string) {
  const preload = `data:text/javascript,globalThis.Date.now=()=>${Date.parse(now)}`;
  return spawnSync(
    process.execPath,
    ["--import", preload, join(root, "scripts/check-quote-expiry.mjs")],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, TZ: timezone },
    },
  );
}

describe("CLI expiry script in isolated real-child fixtures", () => {
  it("passes at exact end-of-day and fails one millisecond later in three host zones", () => {
    const repaired = readFileSync(
      join(repo, "scripts/check-quote-expiry.mjs"),
      "utf8",
    );

    const root = fixture(repaired, "15/11/2026");
    try {
      for (const zone of ["UTC", "Australia/Brisbane", "America/Los_Angeles"]) {
        const boundary = run(root, "2026-11-15T13:59:59.999Z", zone);
        console.log(
          `GREEN ${zone} exact boundary: exit=${boundary.status}; ${boundary.stdout.trim()} ${boundary.stderr.trim()}`,
        );
        expect(boundary.status).toBe(0);
        const after = run(root, "2026-11-15T14:00:00.000Z", zone);
        console.log(
          `GREEN ${zone} +1ms: exit=${after.status}; ${after.stdout.trim()} ${after.stderr.trim()}`,
        );
        expect(after.status).not.toBe(0);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["31/02/2026", "29/02/2025", "15/13/2026", "not a date"])(
    "rejects invalid fixture validUntil %s",
    (validUntil) => {
      const script = readFileSync(
        join(repo, "scripts/check-quote-expiry.mjs"),
        "utf8",
      );
      const root = fixture(script, validUntil);
      try {
        const result = run(root, "2026-11-01T00:00:00.000Z", "UTC");
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain("invalid validUntil");
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );
});

describe("draft and unknown status handling", () => {
  const script = readFileSync(join(repo, "scripts/check-quote-expiry.mjs"), "utf8");
  it("accepts a coherent draft without treating it as issued", () => {
    const root = fixture(script, null, "draft", "21/10/2026");
    try {
      const result = run(root, "2035-01-01T00:00:00Z", "UTC");
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("draft, not issued");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it.each([["31/02/2026", null], [null, "2026-10-21"]])("rejects invalid draft", (validUntil, draftedOn) => {
    const root = fixture(script, validUntil, "draft", draftedOn ?? "21/10/2026");
    try { expect(run(root, "2035-01-01T00:00:00Z", "UTC").status).not.toBe(0); }
    finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("rejects an unknown status", () => {
    const root = fixture(script, "15/11/2026", "pending", "21/10/2026");
    try { expect(run(root, "2026-11-01T00:00:00Z", "UTC").status).not.toBe(0); }
    finally { rmSync(root, { recursive: true, force: true }); }
  });
});
