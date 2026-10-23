import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const quote = JSON.parse(
  readFileSync(new URL("../../src/quote.json", import.meta.url), "utf8"),
);

test("approved inclusion groups retain semantic sub-points on screen and paper", async ({
  page,
}) => {
  for (const width of [320, 375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(".");
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator("#inclusions");
    for (const [name, count] of [
      ["Dashboards", 3],
      ["Automations", 1],
    ] as const) {
      const card = section
        .locator(".card")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
      await expect(card.locator(":scope > ul > li > ul")).toHaveCount(count);
      const items =
        quote.inclusions[name.toLowerCase() as "dashboards" | "automations"];
      for (const [i, item] of items.entries()) {
        if (typeof item === "string")
          throw new Error("Approved groups must be structured");
        const group = item as { label: string; items: string[] };
        const parent = card.locator(":scope > ul > li").nth(i);
        await expect(parent.locator(":scope > strong")).toHaveText(group.label);
        await expect(parent.locator(":scope > ul > li")).toHaveText(
          group.items,
        );
      }
    }
    const integrations = section
      .locator(".card")
      .filter({
        has: page.getByRole("heading", { name: "Integrations", exact: true }),
      });
    await expect(integrations.locator(":scope > ul > li")).toHaveText(
      quote.inclusions.integrations,
    );
    await expect(integrations.locator("ul ul")).toHaveCount(0);
    for (const media of ["screen", "print"] as const) {
      await page.emulateMedia({ media });
      await expect(
        section.getByText("Night-time sentry mode.", { exact: true }),
      ).toBeVisible();
      await expect(section.locator("ul ul")).toHaveCount(4);
    }
    await page.emulateMedia({ media: "screen" });
    await section.locator("h3, li, strong").evaluateAll((nodes) => {
      const sizes = nodes.map((node) =>
        parseFloat(getComputedStyle(node).fontSize),
      );
      nodes.forEach((node, i) => {
        (node as HTMLElement).style.fontSize = `${sizes[i] * 2}px`;
      });
    });
    const failures = await section.locator("li, strong").evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const box = node.getBoundingClientRect();
          return (
            box.left < -1 ||
            box.right > innerWidth + 1 ||
            node.scrollWidth > node.clientWidth + 1
          );
        })
        .map((node) => node.textContent),
    );
    expect(failures).toEqual([]);
  }
});
