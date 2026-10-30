import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("navigation works through all three pages", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByTestId("metric-balance")).toHaveText("€48,562.00");
  const nav = page.getByRole("navigation", {
    name: info.project.name.startsWith("mobile")
      ? "Mobile navigation"
      : "Main navigation",
    exact: true,
  });
  await nav
    .getByRole("link", {
      name: info.project.name.startsWith("mobile")
        ? "Activity"
        : "Transactions",
      exact: true,
    })
    .click();
  await expect(page.getByPlaceholder("Search transactions...")).toBeVisible();
  await nav.getByRole("link", { name: "Analytics", exact: true }).click();
  await expect(
    page.getByText("Category breakdown", { exact: true }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByTestId("metric-balance")).toHaveText("€48,562.00");
});
test("search, categories, statuses and empty state compose correctly", async ({
  page,
}) => {
  await page.goto("/transactions");
  const search = page.getByRole("textbox", {
    name: "Search transactions",
    exact: true,
  });
  await search.fill("arket");
  await expect(page.locator("tbody tr").first()).toContainText(
    "Whole Foods Market",
  );
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Shopping");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Pending");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await search.fill("something-absent");
  await expect(
    page.getByRole("heading", { name: "No transactions found" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(8);
});
test("pagination and signed amount sorting work", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page.getByText("Showing 1–8 of 128 transactions")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByText("Showing 9–16 of 128 transactions"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Amount", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Studio North");
  await page.getByRole("button", { name: "Amount", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Nordic Living");
});
test("validates, persists, calculates and deletes a new transaction", async ({
  page,
}) => {
  await page.goto("/transactions");
  await page
    .getByRole("button", { name: "Add Transaction", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Add Transaction",
    exact: true,
  });
  await dialog
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await expect(
    dialog.getByText("Enter a name between 1 and 80 characters."),
  ).toBeVisible();
  await dialog
    .getByLabel("Transaction name", { exact: true })
    .fill("Portfolio test purchase");
  await dialog.getByLabel("Amount (EUR)", { exact: true }).fill("19.95");
  await dialog
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("tbody tr").first()).toContainText(
    "Portfolio test purchase",
  );
  await page.reload();
  await expect(page.locator("tbody tr").first()).toContainText(
    "Portfolio test purchase",
  );
  await page.goto("/");
  await expect(page.getByTestId("metric-expenses")).toHaveText("€3,259.95");
  await expect(page.getByTestId("metric-balance")).toHaveText("€48,542.05");
  await page.goto("/transactions");
  await page
    .getByRole("button", {
      name: "Actions for Portfolio test purchase",
      exact: true,
    })
    .click();
  await page
    .getByRole("menuitem", { name: "Delete transaction", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByText("Portfolio test purchase", { exact: true }),
  ).toHaveCount(0);
});
test("date range and advanced filters work", async ({ page }) => {
  await page.goto("/transactions");
  await page
    .getByRole("combobox", { name: "Date range", exact: true })
    .selectOption("2026-09");
  await expect(page.getByText("Showing 1–6 of 6 transactions")).toBeVisible();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByLabel("From date", { exact: true }).fill("2026-10-28");
  await page.getByLabel("To date", { exact: true }).fill("2026-10-30");
  await expect(page.getByText("Showing 1–3 of 3 transactions")).toBeVisible();
});
test("CSV download contains filtered fictional transactions", async ({
  page,
}) => {
  await page.goto("/transactions");
  await page
    .getByRole("textbox", { name: "Search transactions", exact: true })
    .fill("Studio North");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "northstar-demo-transactions.csv",
  );
});
test("modal is accessible and Escape restores focus", async ({ page }) => {
  await page.goto("/transactions");
  const trigger = page.getByRole("button", {
    name: "Add Transaction",
    exact: true,
  });
  await trigger.click();
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
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("cash flow chart responds to pointer and touch input", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.getByTestId("metric-balance")).toHaveText("€48,562.00");
  const chart = page.locator(".cash-chart");
  const box = await chart.boundingBox();
  if (!box) throw new Error("Cash flow chart was not rendered");
  if (info.project.name.startsWith("mobile"))
    await chart.tap({ position: { x: box.width - 12, y: 30 } });
  else await page.mouse.move(box.x + box.width - 12, box.y + 30);
  await expect(chart.locator(".chart-tooltip")).toContainText("€5,260");
});
