import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Local-only screenshot generation. Run after `pnpm dev`.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : process.platform === "win32"
      ? { channel: "msedge" }
      : {},
);
const results = [];
await mkdir("docs/screenshots", { recursive: true });
for (const { name, viewport, route } of [
  {
    name: "dashboard-desktop-1440",
    viewport: { width: 1440, height: 900 },
    route: "/",
  },
  {
    name: "transactions-desktop-1440",
    viewport: { width: 1440, height: 900 },
    route: "/transactions",
  },
  {
    name: "analytics-desktop-1440",
    viewport: { width: 1440, height: 900 },
    route: "/analytics",
  },
  {
    name: "dashboard-mobile-390",
    viewport: { width: 390, height: 844 },
    route: "/",
  },
]) {
  const page = await browser.newPage({ viewport });
  await page.goto("http://127.0.0.1:5174" + route);
  await page.locator(".metric-card, tbody tr").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".recharts-surface")
    .first()
    .waitFor({ state: route === "/transactions" ? "hidden" : "visible" })
    .catch(() => {});
  const measurements = await page.evaluate(() => ({
    font: getComputedStyle(document.body).fontFamily,
    regions: [
      ...document.querySelectorAll(".metric-card, .card, .topbar, .mobile-nav"),
    ]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => ({
        name: el.className,
        x: el.getBoundingClientRect().x,
        y: el.getBoundingClientRect().y,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
      })),
  }));
  await page.screenshot({
    path: `docs/screenshots/${name}.png`,
    animations: "disabled",
  });
  if (name === "dashboard-desktop-1440") {
    const chart = page.locator(".cash-chart");
    const box = await chart.boundingBox();
    await page.mouse.move(box.x + box.width - 12, box.y + 30);
    await page.locator(".chart-tooltip").first().waitFor();
    await page.screenshot({
      path: "docs/screenshots/dashboard-desktop-tooltip.png",
      animations: "disabled",
    });
  }
  results.push({ name, viewport, ...measurements });
  await page.close();
}
await browser.close();
await writeFile(
  "docs/screenshots/measurements.json",
  JSON.stringify(results, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    results.map((r) => ({
      name: r.name,
      font: r.font,
      regions: r.regions.length,
    })),
    null,
    2,
  ),
);
