// CI gate for the published quote. A failed gate cannot remove files already published to Pages.
import { readFile } from "node:fs/promises";
import { parseQuoteValidUntil } from "../src/quoteExpiry.ts";
const quote = JSON.parse(
  await readFile(new URL("../src/quote.json", import.meta.url), "utf8"),
);
const parsed = parseQuoteValidUntil(quote.validUntil);
if ("error" in parsed) {
  console.error(`check-quote-expiry: invalid validUntil: ${parsed.error}`);
  process.exit(1);
}
const remaining = parsed.expiresAtMs - Date.now();
if (remaining < 0) {
  console.error(
    `check-quote-expiry: quote ${quote.quoteId} expired on ${quote.validUntil}. Refresh approved quote content before publishing.`,
  );
  process.exit(1);
}
console.log(
  `check-quote-expiry: quote ${quote.quoteId} valid until ${quote.validUntil} (${Math.ceil(remaining / 86400000)} days remaining).`,
);
