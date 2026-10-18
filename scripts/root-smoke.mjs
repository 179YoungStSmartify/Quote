import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve, sep } from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(resolve("package.json"))("@playwright/test");

const root = resolve(process.argv[2] ?? "dist");
const quote = JSON.parse(await readFile(resolve("src/quote.json"), "utf8"));
const line = (item) => item.quantity * item.unitCents;
const totalCents = quote.sections.reduce(
  (sum, section) =>
    sum +
    section.items.reduce((subtotal, item) => subtotal + line(item), 0) +
    (section.discount ? line(section.discount) : 0),
  0,
);
const total = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: quote.currency,
}).format(totalCents / 100);
const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (file !== root && !file.startsWith(root + sep))
      throw new Error("outside root");
    if (!(await stat(file)).isFile()) throw new Error("not a file");
    res.setHeader(
      "content-type",
      contentTypes[file.slice(file.lastIndexOf("."))] ??
        "application/octet-stream",
    );
    createReadStream(file).pipe(res);
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
});
await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen),
);
const address = server.address();
const base = `http://127.0.0.1:${address.port}/`;
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const problems = [];
  page.on("pageerror", (error) =>
    problems.push(`page error: ${error.message}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) =>
    problems.push(
      `request failed: ${request.url()} ${request.failure()?.errorText}`,
    ),
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  const response = await page.goto(base, { waitUntil: "networkidle" });
  if (!response?.ok()) throw new Error("root index did not load");
  if (new URL(page.url()).pathname !== "/")
    throw new Error(`app redirected away from root: ${page.url()}`);
  if (
    !(await page
      .getByRole("heading", { name: /thoughtful foundation/i })
      .isVisible())
  )
    throw new Error("quote heading is missing");
  if (
    !(await page
      .getByRole("region", { name: "Quote summary" })
      .getByText(total, { exact: true })
      .first()
      .isVisible())
  )
    throw new Error(`canonical total ${total} is missing`);
  const pdfResponse = await page.request.get(new URL("quote.pdf", base).href);
  if (
    !pdfResponse.ok() ||
    !pdfResponse.headers()["content-type"]?.includes("pdf")
  )
    throw new Error("root quote.pdf did not load as PDF");
  if (!(await pdfResponse.body()).subarray(0, 5).equals(Buffer.from("%PDF-")))
    throw new Error("quote.pdf has an invalid PDF header");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Download quote PDF" }).first().click(),
  ]);
  if (download.suggestedFilename() !== `${quote.quoteId}.pdf`)
    throw new Error(`unexpected PDF filename: ${download.suggestedFilename()}`);
  if (problems.length) throw new Error(problems.join("\n"));
  console.log(
    "root browser smoke passed: index, loaded assets, Hazal total, PDF response/header/download, no JS or network errors",
  );
} finally {
  await browser?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
