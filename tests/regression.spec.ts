import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

// Regression coverage for the issues listed in AUDIT_REPORT.md (H-1 … M-7).
const isMobile = (info: TestInfo) => info.project.name.startsWith("mobile");
function navLink(page: Page, info: TestInfo, name: string) {
  const mobileNames: Record<string, string> = { Transactions: "Activity" };
  return page
    .getByRole("navigation", {
      name: isMobile(info) ? "Mobile navigation" : "Main navigation",
      exact: true,
    })
    .getByRole("link", {
      name: isMobile(info) ? (mobileNames[name] ?? name) : name,
      exact: true,
    });
}
const rows = (page: Page) => page.locator("tbody tr");
const bulkBar = (page: Page) =>
  page.getByRole("region", { name: "Selected transactions" });

test("H-1: filtering clears the selection, so hidden rows cannot be deleted", async ({
  page,
}) => {
  await page.goto("/transactions");
  await page.getByRole("checkbox", { name: "Select Studio North" }).check();
  await page
    .getByRole("checkbox", { name: "Select Whole Foods Market" })
    .check();
  await expect(bulkBar(page)).toContainText("2 selected");
  await page
    .getByRole("textbox", { name: "Search transactions", exact: true })
    .fill("Adobe");
  await expect(bulkBar(page)).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Select Adobe" }).first().check();
  await bulkBar(page)
    .getByRole("button", { name: "Delete selected (1)" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".delete-list")).toContainText("Adobe");
  await expect(dialog).not.toContainText("Studio North");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search transactions", exact: true })
    .fill("");
  await expect(rows(page).first()).toContainText("Studio North");
  await expect(page.getByText("Showing 1–8 of 127 transactions")).toBeVisible();
});

test("M-4: pagination stays available while rows are selected", async ({
  page,
}) => {
  await page.goto("/transactions");
  await page.getByRole("checkbox", { name: "Select Studio North" }).check();
  const pagination = page.getByRole("navigation", {
    name: "Transaction pages",
  });
  await expect(pagination).toBeVisible();
  await pagination.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Showing 9–16 of 128 transactions")).toBeVisible();
  await expect(bulkBar(page)).toContainText("1 selected · includes other pages");
});

test("H-2: All time is labelled as a total, never as a monthly comparison", async ({
  page,
}, info) => {
  await page.goto("/transactions");
  await page
    .locator(".transaction-filters")
    .getByRole("combobox", { name: "Date range", exact: true })
    .selectOption("all");
  await navLink(page, info, "Overview").click();
  await expect(page.getByText("Total income", { exact: true })).toBeVisible();
  await expect(page.getByText("All-time total").first()).toBeVisible();
  await expect(page.getByText("vs. last month")).toHaveCount(0);
  await expect(page.getByText(/this month/)).toHaveCount(0);
  await navLink(page, info, "Analytics").click();
  await expect(page.getByText("All time · 6-month trend")).toBeVisible();
  await expect(page.locator(".analytics-grid").getByText(/September/)).toHaveCount(0);
});

test("M-1: a negative month extends the cash flow scale below zero", async ({
  page,
}, info) => {
  await page.goto("/transactions");
  await page
    .getByRole("button", { name: "Add Transaction", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Add Transaction" });
  await dialog.getByLabel("Transaction name", { exact: true }).fill("Big purchase");
  await dialog.getByLabel("Amount (EUR)", { exact: true }).fill("20000");
  await dialog.getByLabel("Date", { exact: true }).fill("2026-10-15");
  await dialog
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await navLink(page, info, "Overview").click();
  const chart = page.locator(".cash-chart");
  await expect(chart.getByText("−€15k")).toBeVisible();
  const [lowestDot, axisBottom] = await chart.evaluate((el) => {
    const dots = [...el.querySelectorAll(".recharts-area-dots circle")];
    const grid = el.querySelector(".recharts-cartesian-grid")!.getBoundingClientRect();
    return [
      Math.max(...dots.map((d) => d.getBoundingClientRect().bottom)),
      grid.bottom,
    ];
  });
  expect(lowestDot).toBeLessThanOrEqual(axisBottom + 3);
});

test("L-4, L-5: future dates are rejected and negative totals use a minus sign", async ({
  page,
}, info) => {
  await page.goto("/transactions");
  await page
    .getByRole("button", { name: "Add Transaction", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Add Transaction" });
  await dialog.getByLabel("Transaction name", { exact: true }).fill("Later");
  await dialog.getByLabel("Amount (EUR)", { exact: true }).fill("20000");
  const date = dialog.getByLabel("Date", { exact: true });
  await expect(date).toHaveAttribute("max", "2026-10-31");
  await date.fill("2099-01-01");
  await dialog
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await expect(
    dialog.getByText("Choose a date between Jan 1, 2000 and Oct 31, 2026."),
  ).toBeVisible();
  await date.fill("2026-10-15");
  await dialog
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await navLink(page, info, "Overview").click();
  const net = page.locator(
    isMobile(info) ? ".mobile-cash-summary strong" : ".cash-summary strong",
  );
  await expect(net).toHaveText(isMobile(info) ? "−€14,740" : "−€14,740.00");
});

test("M-2: one unreadable saved record does not erase the others", async ({
  page,
}) => {
  await page.goto("/transactions");
  await page.evaluate(() =>
    localStorage.setItem(
      "pixelperfect:northstar:v1",
      JSON.stringify({
        version: 1,
        created: [
          {
            id: "kept",
            name: "Saved coffee",
            description: "Demo",
            date: "2026-10-31",
            category: "Food & groceries",
            amount: -450,
            status: "Completed",
          },
          { id: "broken", name: "Broken", category: "Unknown", amount: -1 },
        ],
        deletedIds: [],
      }),
    ),
  );
  await page.reload();
  await expect(
    page.getByText("1 saved entry could not be read and was skipped."),
  ).toBeVisible();
  await expect(rows(page).first()).toContainText("Saved coffee");
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("pixelperfect:northstar:v1")!).created
        .length,
  );
  expect(stored).toBe(1);
});

test("M-3: the row actions menu works with the keyboard", async ({ page }) => {
  await page.goto("/transactions");
  const trigger = page.getByRole("button", {
    name: "Actions for Studio North",
    exact: true,
  });
  await trigger.click();
  const menu = page.getByRole("menu", { name: "Actions for Studio North" });
  await expect(menu.getByRole("menuitem", { name: "View details" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    menu.getByRole("menuitem", { name: "Delete transaction" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.mouse.click(4, 400);
  await expect(menu).toHaveCount(0);
});

test("M-5: date ranges stay local, inverted ranges are ignored and filters live in the URL", async ({
  page,
}, info) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByLabel("From date", { exact: true }).fill("2026-10-28");
  await page.getByLabel("To date", { exact: true }).fill("2026-10-01");
  await expect(page.getByRole("alert")).toContainText(
    "From date must be on or before To date",
  );
  await expect(page.getByText("Showing 1–8 of 128 transactions")).toBeVisible();
  await page.getByLabel("To date", { exact: true }).fill("2026-10-30");
  await expect(page.getByText("Showing 1–3 of 3 transactions")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Shopping");
  for (const part of ["from=2026-10-28", "to=2026-10-30", "category=Shopping"])
    await expect(page).toHaveURL(new RegExp(part));
  await navLink(page, info, "Overview").click();
  await expect(page.getByTestId("metric-income")).toHaveText("€8,500.00");
  await page.goBack();
  await expect(page.getByText("Showing 1–1 of 1 transactions")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Showing 1–1 of 1 transactions")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Category", exact: true }),
  ).toHaveValue("Shopping");
});

test("H-3, M-6, M-7: mobile shows no fake device chrome and readable analytics", async ({
  page,
}, info) => {
  test.skip(!isMobile(info), "Mobile-only layout checks");
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByText("9:41", { exact: true })).toHaveCount(0);
  await expect(page.locator(".home-indicator, .mobile-status")).toHaveCount(0);
  await page.goto("/analytics");
  const select = page
    .locator(".page-actions")
    .getByRole("combobox", { name: "Date range", exact: true });
  expect(await select.evaluate((s: HTMLSelectElement) => s.selectedOptions[0].text)).toBe(
    "October 2026",
  );
  expect(
    await select.evaluate((s: HTMLSelectElement) => s.scrollWidth <= s.clientWidth),
  ).toBe(true);
  const chart = page.locator(".trends-card .income-chart");
  await expect(chart.locator(".recharts-bar-rectangle").first()).toBeVisible();
  const [labelsRight, firstBarLeft] = await chart.evaluate((el) => [
    Math.max(
      ...[...el.querySelectorAll(".recharts-yAxis text")].map(
        (t) => t.getBoundingClientRect().right,
      ),
    ),
    Math.min(
      ...[...el.querySelectorAll(".recharts-bar-rectangle path")].map(
        (b) => b.getBoundingClientRect().left,
      ),
    ),
  ]);
  expect(firstBarLeft).toBeGreaterThan(labelsRight);
});
