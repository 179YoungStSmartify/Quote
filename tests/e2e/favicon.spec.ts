import { expect, test } from "@playwright/test";

const icons = [
  { rel: "icon", type: "image/svg+xml", sizes: "any", href: "favicon.svg" },
  {
    rel: "icon",
    type: "image/x-icon",
    sizes: "16x16 32x32 48x48",
    href: "favicon.ico",
  },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "favicon-16x16.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "favicon-32x32.png" },
  {
    rel: "apple-touch-icon",
    type: "image/png",
    sizes: "180x180",
    href: "apple-touch-icon.png",
  },
];

test("production favicons resolve under the Pages base and contain approved static payloads", async ({
  page,
  request,
}) => {
  await page.goto("/Quote/");
  for (const icon of icons) {
    const link = page.locator(
      `link[rel="${icon.rel}"][href="/Quote/${icon.href}"]`,
    );
    await expect(link).toHaveCount(1);
    if (icon.type) await expect(link).toHaveAttribute("type", icon.type);
    if (icon.sizes) await expect(link).toHaveAttribute("sizes", icon.sizes);
    const url = await link.evaluate(
      (element) => (element as HTMLLinkElement).href,
    );
    expect(new URL(url).pathname).toBe(`/Quote/${icon.href}`);

    const response = await request.get(url);
    expect(response.status(), icon.href).toBe(200);
    const mime = response.headers()["content-type"] ?? "";
    if (icon.href.endsWith(".ico"))
      expect(mime).toMatch(/image\/(x-icon|vnd\.microsoft\.icon|icon)/);
    else expect(mime).toContain(icon.type);
    const body = await response.body();

    if (icon.href.endsWith(".svg")) {
      const svg = body.toString("utf8");
      expect(svg).toMatch(/<svg\b/i);
      expect(svg).not.toMatch(/<script\b|<foreignObject\b|preview\s*labels?/i);
      expect(svg).not.toMatch(
        /(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|data:)/i,
      );
      expect(svg).not.toMatch(/url\(\s*["']?\s*(?:https?:|\/\/|data:)/i);
    } else if (icon.href.endsWith(".png")) {
      expect(body.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      expect(body.readUInt32BE(16)).toBe(Number(icon.sizes?.split("x")[0]));
      expect(body.readUInt32BE(20)).toBe(Number(icon.sizes?.split("x")[1]));
    } else {
      expect(body.readUInt16LE(0)).toBe(0);
      expect(body.readUInt16LE(2)).toBe(1);
      expect(body.readUInt16LE(4)).toBe(3);
    }
  }
});
