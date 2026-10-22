import { build, preview } from "vite";
import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
let server;
let browser;
try {
  // Unit runners may pass NODE_ENV=test; the exported app must remain production-built.
  process.env.NODE_ENV = "production";
  await build({ root });
  server = await preview({
    root,

    preview: { host: "127.0.0.1", port: 0, strictPort: true, open: false },
  });
  const address = server.httpServer.address();
  if (!address || typeof address === "string")
    throw new Error("Preview server has no TCP address");
  const base = new URL(
    server.config.base || "/",
    `http://127.0.0.1:${address.port}`,
  );
  browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("requestfailed", (request) =>
    failures.push(
      `${request.url()}: ${request.failure()?.errorText || "request failed"}`,
    ),
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  await page.emulateMedia({ media: "print" });
  const response = await page.goto(base.href, { waitUntil: "networkidle" });
  if (!response?.ok())
    throw new Error(`Built page returned HTTP ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  if (failures.length)
    throw new Error(`Page/resource errors: ${failures.join("; ")}`);
  await page.pdf({
    path: resolve(root, "dist/quote.pdf"),
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: false,
  });
  if (failures.length)
    throw new Error(`Page/resource errors: ${failures.join("; ")}`);
} finally {
  try {
    if (browser) await browser.close();
  } finally {
    if (server)
      await new Promise((done, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : done())),
      );
  }
}
