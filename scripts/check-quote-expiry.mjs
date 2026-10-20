// CI gate: refuse to publish a quote whose validUntil has passed.
// Exits 1 when the committed quote is expired, so a refreshed quote
// (new pricing plus fresh quoteDate/validUntil) is required first.
import { readFile } from "node:fs/promises";

const quote = JSON.parse(
  await readFile(new URL("../src/quote.json", import.meta.url), "utf8"),
);
const [day, month, year] = String(quote.validUntil).split("/").map(Number);
if (!day || !month || !year) {
  console.error(
    `check-quote-expiry: cannot parse validUntil "${quote.validUntil}" (expected DD/MM/YYYY)`,
  );
  process.exit(1);
}
// End of the expiry day in Brisbane (AEST, UTC+10, no daylight saving).
const endOfDay = new Date(year, month - 1, day, 23, 59, 59).getTime() + 36000000;
const now = Date.now();
if (endOfDay < now) {
  console.error(
    `check-quote-expiry: quote ${quote.quoteId} expired on ${quote.validUntil}. ` +
      "Refresh pricing and quoteDate/validUntil before publishing.",
  );
  process.exit(1);
}
console.log(
  `check-quote-expiry: quote ${quote.quoteId} valid until ${quote.validUntil} ` +
    `(${Math.ceil((endOfDay - now) / 86400000)} days remaining).`,
);
