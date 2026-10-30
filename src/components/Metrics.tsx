import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  PiggyBank,
  Wallet,
} from "lucide-react";
import {
  euro,
  openingBalance,
  percentageChange,
  previousMonth,
  totals,
} from "../lib/finance";
import { useFinance } from "../lib/store";
import { MonthSelect } from "./UI";

export function useStats() {
  const { transactions, month } = useFinance();
  // "All time" has no previous period, so month-over-month changes are not shown.
  const allTime = month === "all";
  const selected = transactions.filter(
    (t) => month === "all" || t.date.startsWith(month),
  );
  const stats = totals(selected);
  const previous = totals(
    transactions.filter((t) =>
      t.date.startsWith(previousMonth(month === "all" ? "2026-10" : month)),
    ),
  );
  const balance =
    openingBalance +
    transactions
      .filter((t) => month === "all" || t.date.slice(0, 7) <= month)
      .reduce((sum, t) => sum + t.amount, 0);
  const previousBalance = balance - stats.net;
  return {
    ...stats,
    allTime,
    balance,
    selected,
    previous,
    changes: {
      balance: percentageChange(balance, previousBalance),
      income: percentageChange(stats.income, previous.income),
      expenses: percentageChange(stats.expenses, previous.expenses),
      net: percentageChange(stats.net, previous.net),
      savings: stats.savings - previous.savings,
    },
  };
}
export function Metrics({ analytics = false }: { analytics?: boolean }) {
  const stats = useStats();
  const items = analytics
    ? [
        {
          key: "income",
          label: "Revenue / income",
          value: euro(stats.income),
          change: stats.changes.income,
          icon: ArrowDownLeft,
        },
        {
          key: "expenses",
          label: "Total expenses",
          value: euro(stats.expenses),
          change: stats.changes.expenses,
          icon: ArrowUpRight,
        },
        {
          key: "net",
          label: "Net cash flow",
          value: euro(stats.net),
          change: stats.changes.net,
          icon: ChartNoAxesCombined,
        },
        {
          key: "savings",
          label: "Savings rate",
          value: `${stats.savings.toFixed(1)}%`,
          change: stats.changes.savings,
          icon: PiggyBank,
        },
      ]
    : [
        {
          key: "balance",
          label: "Total balance",
          value: euro(stats.balance),
          change: stats.changes.balance,
          icon: Wallet,
        },
        {
          key: "income",
          label: stats.allTime ? "Total income" : "Monthly income",
          value: euro(stats.income),
          change: stats.changes.income,
          icon: ArrowDownLeft,
        },
        {
          key: "expenses",
          label: stats.allTime ? "Total expenses" : "Monthly expenses",
          value: euro(stats.expenses),
          change: stats.changes.expenses,
          icon: ArrowUpRight,
        },
        {
          key: "savings",
          label: "Savings rate",
          value: `${stats.savings.toFixed(1)}%`,
          change: stats.changes.savings,
          icon: PiggyBank,
        },
      ];
  return (
    <div
      className={`metrics ${analytics ? "analytics-metrics" : "overview-metrics"}`}
    >
      {items.map(({ key, label, value, change, icon: Icon }, i) => {
        const good = key === "expenses" ? change <= 0 : change >= 0;
        const ChangeIcon = change < 0 ? ArrowDownRight : ArrowUpRight;
        return (
          <section
            key={key}
            className={`metric-card metric-${key} ${i === 0 ? "featured" : ""}`}
            aria-label={label}
          >
            <div className="metric-label">
              <span>{label}</span>
              <Icon size={15} strokeWidth={1.3} />
              <span className="balance-month">
                <MonthSelect compact />
              </span>
            </div>
            <strong className="metric-value" data-testid={`metric-${key}`}>
              {value}
            </strong>
            <div className="metric-bottom">
              {stats.allTime ? (
                <span className="metric-period">All-time total</span>
              ) : (
                <>
                  <span
                    className={`metric-change ${good ? "positive" : "negative"}`}
                  >
                    <ChangeIcon size={10} />
                    {Math.abs(change).toFixed(1)}
                    {key === "savings" ? " pts" : "%"}
                    <span className="mobile-this-month"> this month</span>
                  </span>
                  <small>vs. last month</small>
                </>
              )}
              <span className="mobile-saved">
                {stats.savings.toFixed(1)}% saved
              </span>
            </div>
            <span className="mini-bars" aria-hidden="true">
              {[8, 11, 10, 12, 11, 10, 12].map((height, index) => (
                <i key={index} style={{ height }} />
              ))}
            </span>
          </section>
        );
      })}
    </div>
  );
}
