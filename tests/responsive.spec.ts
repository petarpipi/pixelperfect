import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

for (const [route, name] of [
  ["/", "dashboard"],
  ["/transactions", "transactions"],
  ["/analytics", "analytics"],
] as const) {
  test(`${name} renders without overflow and meets accessibility checks`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await expect(
      page.getByRole("status", { name: "Loading demo finances" }),
    ).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name:
          route === "/"
            ? "Overview"
            : route === "/transactions"
              ? "Transactions"
              : "Analytics",
        exact: true,
      }),
    ).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          problem: n.failureSummary,
        })),
      })),
    ).toEqual([]);
    expect(errors).toEqual([]);
    // Test runs keep screenshots in test-results; documentation images change only on request.
    const file = `${name}-${testInfo.project.name}.png`;
    const path =
      process.env.UPDATE_DOCS_SCREENSHOTS === "1"
        ? `docs/screenshots/${file}`
        : testInfo.outputPath(file);
    if (process.env.UPDATE_DOCS_SCREENSHOTS === "1")
      await mkdir("docs/screenshots", { recursive: true });
    await page.screenshot({ path, animations: "disabled" });
    await testInfo.attach(file, { path, contentType: "image/png" });
  });
}
