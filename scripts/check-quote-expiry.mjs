// CI gate for the published quote. A failed gate cannot remove files already published to Pages.
import { readFile } from "node:fs/promises";
import { parseQuoteValidUntil } from "../src/quoteExpiry.ts";
const quote = JSON.parse(
  await readFile(new URL("../src/quote.json", import.meta.url), "utf8"),
);
if (
  Object.hasOwn(quote, "status") &&
  quote.status !== "draft" &&
  quote.status !== "issued"
) {
  console.error(`check-quote-expiry: unknown status: ${quote.status}`);
  process.exit(1);
}
if (quote.status === "draft") {
  const match =
    typeof quote.draftedOn === "string" &&
    /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(quote.draftedOn);
  let drafted = false;
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );
    drafted =
      date.getUTCFullYear() === Number(year) &&
      date.getUTCMonth() === Number(month) - 1 &&
      date.getUTCDate() === Number(day);
  }
  if (quote.quoteDate !== null || quote.validUntil !== null || !drafted) {
    console.error(
      "check-quote-expiry: malformed draft; expected null issue/expiry dates and a valid draftedOn date.",
    );
    process.exit(1);
  }
  console.log(
    `check-quote-expiry: quote ${quote.quoteId} is a draft, not issued (drafted ${quote.draftedOn}).`,
  );
  process.exit(0);
}
const parsed = parseQuoteValidUntil(quote.validUntil ?? "");
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
