import { describe, expect, it } from "vitest";
import {
  cashFlowScale,
  categories,
  csvCell,
  dateScope,
  emptyStore,
  euro,
  filterTransactions,
  monthlySeries,
  openingBalance,
  parseStore,
  readStore,
  seedTransactions,
  signedEuro,
  totals,
  validateTransaction,
} from "./finance";
import type { Filters, TransactionForm } from "./finance";

const october = seedTransactions.filter((t) => t.date.startsWith("2026-10"));
const filters: Filters = {
  query: "",
  category: "all",
  month: "2026-10",
  status: "all",
  type: "all",
  sort: "date-desc",
};
const valid: TransactionForm = {
  name: "Demo groceries",
  amount: "12.50",
  date: "2026-10-31",
  category: "Food & groceries",
  type: "expense",
  status: "Completed",
  description: "",
};
describe("Financial calculations", () => {
  it("reconciles every initial Figma metric and October transaction count", () => {
    expect(october).toHaveLength(128);
    expect(totals(october)).toMatchObject({
      income: 850000,
      expenses: 324000,
      net: 526000,
    });
    expect(totals(october).savings).toBeCloseTo(61.88235);
    expect(
      openingBalance + seedTransactions.reduce((sum, t) => sum + t.amount, 0),
    ).toBe(4856200);
  });
  it("reconciles category totals without floating point rounding", () => {
    expect(
      categories
        .slice(1)
        .map(
          (category) =>
            -october
              .filter((t) => t.category === category)
              .reduce((sum, t) => sum + t.amount, 0),
        ),
    ).toEqual([145000, 72000, 48000, 35000, 24000]);
  });
  it("updates totals from new income and expenses", () => {
    const changed = [
      ...october,
      { ...october[0], id: "new", amount: -999, category: "Shopping" as const },
    ];
    expect(totals(changed).net).toBe(525001);
    expect(totals(changed.filter((t) => t.id !== "oct-1")).income).toBe(270000);
  });
  it("handles an empty month and zero income", () => {
    expect(totals([])).toEqual({ income: 0, expenses: 0, net: 0, savings: 0 });
    expect(totals([october[1]]).savings).toBe(0);
  });
  it("derives charts from transactions, in chronological order", () => {
    const series = monthlySeries(seedTransactions, "2026-10");
    expect(series.map((s) => s.month)).toEqual([
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
    ]);
    expect(series.at(-1)).toEqual({
      month: "Oct",
      income: 8500,
      expenses: 3240,
      net: 5260,
    });
  });
  it("keeps the reference cash flow scale and extends it below zero (M-1)", () => {
    expect(cashFlowScale([4100, 4400, 5260])).toEqual({
      domain: [0, 6000],
      ticks: [0, 3000, 6000],
    });
    expect(cashFlowScale([4100, 4520, -14740])).toEqual({
      domain: [-15000, 6000],
      ticks: [-15000, 0, 6000],
    });
  });
});
describe("Transaction queries", () => {
  it("combines search, category, status and date filters", () => {
    expect(
      filterTransactions(seedTransactions, {
        ...filters,
        query: " arket ",
        category: "Shopping",
        status: "Pending",
        from: "2026-10-28",
        to: "2026-10-28",
      }).map((t) => t.id),
    ).toEqual(["oct-3"]);
  });
  it("sorts dates and signed amounts in both directions", () => {
    expect(filterTransactions(seedTransactions, filters)[0].name).toBe(
      "Studio North",
    );
    expect(
      filterTransactions(seedTransactions, {
        ...filters,
        sort: "amount-desc",
      })[0].amount,
    ).toBe(580000);
    expect(
      filterTransactions(seedTransactions, {
        ...filters,
        sort: "amount-asc",
      })[0].amount,
    ).toBe(-145000);
  });
  it("lets a custom range replace the month and ignores inverted ranges (M-5)", () => {
    expect(dateScope("2026-10")).toMatchObject({
      month: "2026-10",
      custom: false,
      invalid: false,
    });
    expect(dateScope("2026-10", "2026-09-01", "2026-09-30")).toEqual({
      month: "all",
      from: "2026-09-01",
      to: "2026-09-30",
      custom: true,
      invalid: false,
    });
    expect(dateScope("2026-10", "2026-10-30", "2026-10-01")).toEqual({
      month: "2026-10",
      from: "",
      to: "",
      custom: false,
      invalid: true,
    });
    const scope = dateScope("2026-10", "2026-09-01", "2026-09-30");
    expect(
      filterTransactions(seedTransactions, { ...filters, ...scope }),
    ).toHaveLength(6);
  });
  it("supports type, minimum and empty search results", () => {
    expect(
      filterTransactions(seedTransactions, { ...filters, type: "income" }),
    ).toHaveLength(2);
    expect(
      filterTransactions(seedTransactions, { ...filters, minimum: "5000" }),
    ).toHaveLength(1);
    expect(
      filterTransactions(seedTransactions, {
        ...filters,
        query: "no-such-merchant",
      }),
    ).toHaveLength(0);
  });
});
describe("Validation and persistence boundaries", () => {
  it("accepts valid entries and rejects blank, non-finite, fractional-cent and negative amounts", () => {
    expect(validateTransaction(valid)).toEqual({});
    for (const amount of ["", "0", "-1", "Infinity", "1.001", "1e4"])
      expect(validateTransaction({ ...valid, amount }).amount).toBeTruthy();
    expect(validateTransaction({ ...valid, name: " " }).name).toBeTruthy();
  });
  it("only accepts dates up to the demo's today (L-4)", () => {
    expect(validateTransaction({ ...valid, date: "2026-10-31" })).toEqual({});
    expect(validateTransaction({ ...valid, date: "2026-11-01" }).date).toBe(
      "Choose a date between Jan 1, 2000 and Oct 31, 2026.",
    );
    expect(
      validateTransaction({ ...valid, date: "1999-12-31" }).date,
    ).toBeTruthy();
  });
  it("formats negative amounts with a typographic minus (L-5)", () => {
    expect(euro(-1474000)).toBe("−€14,740.00");
    expect(euro(-1474000, false)).toBe("−€14,740");
    expect(euro(526000)).toBe("€5,260.00");
    expect(euro(-40, false)).toBe("€0");
    expect(signedEuro(-8640)).toBe("−€86.40");
  });
  it("rejects impossible dates and incompatible categories", () => {
    expect(
      validateTransaction({ ...valid, date: "2026-02-30" }).date,
    ).toBeTruthy();
    expect(
      validateTransaction({ ...valid, category: "Income" }).category,
    ).toBeTruthy();
  });
  it("restores valid data and recovers from corrupt or incompatible storage", () => {
    expect(parseStore(null)).toEqual(emptyStore());
    for (const value of [
      "broken",
      "{}",
      '{"version":2}',
      JSON.stringify({ version: 1, created: [{ bad: true }], deletedIds: [] }),
    ])
      expect(parseStore(value)).toEqual(emptyStore());
    const data = {
      version: 1,
      created: [{ ...october[1], id: "user-1" }],
      deletedIds: ["oct-2"],
    };
    expect(parseStore(JSON.stringify(data))).toEqual(data);
  });
  it("skips only the invalid stored records and reports them (M-2)", () => {
    const saved = { ...october[1], id: "user-1" };
    const result = readStore(
      JSON.stringify({
        version: 1,
        created: [saved, { ...saved, id: "user-2", category: "Unknown" }, null],
        deletedIds: ["oct-2", 7, "oct-2"],
      }),
    );
    expect(result.data).toEqual({
      version: 1,
      created: [saved],
      deletedIds: ["oct-2"],
    });
    expect(result.discarded).toBe(3);
    expect(result.reset).toBe(false);
    expect(readStore("broken").reset).toBe(true);
    expect(readStore(null)).toEqual({
      data: emptyStore(),
      discarded: 0,
      reset: false,
    });
  });
  it("neutralizes spreadsheet formulas and quotes CSV values", () => {
    expect(csvCell("=1+1")).toBe('"\'=1+1"');
    expect(csvCell('hello,"world"')).toBe('"hello,""world"""');
    expect(csvCell(-12.5)).toBe('"-12.5"');
  });
});
