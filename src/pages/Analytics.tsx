import { Download, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { CategoryBreakdown, IncomeChart } from "../components/Charts";
import { Metrics, useStats } from "../components/Metrics";
import { LoadingState, MonthSelect } from "../components/UI";
import { downloadCsv, euro, monthlySeries } from "../lib/finance";
import { useFinance } from "../lib/store";
import { useMobileLayout } from "../lib/useMobileLayout";

export function Analytics() {
  const { transactions, month, loading } = useFinance();
  const mobile = useMobileLayout();
  const stats = useStats();
  const series = monthlySeries(transactions, month);
  const metrics = [
    {
      title: "Income",
      key: "income" as const,
      value: stats.income,
      previous: stats.previous.income,
      change: stats.changes.income,
    },
    {
      title: "Expenses",
      key: "expenses" as const,
      value: stats.expenses,
      previous: stats.previous.expenses,
      change: stats.changes.expenses,
    },
    {
      title: "Net cash flow",
      key: "net" as const,
      value: stats.net,
      previous: stats.previous.net,
      change: stats.changes.net,
    },
  ];
  function report() {
    downloadCsv("northstar-demo-report.csv", [
      ["Northstar Finance — portfolio demonstration"],
      ["Period", month],
      ["Metric", "EUR"],
      ["Income", stats.income / 100],
      ["Expenses", stats.expenses / 100],
      ["Net cash flow", stats.net / 100],
      ["Savings rate (%)", Number(stats.savings.toFixed(1))],
      [],
      ["Month", "Income (EUR)", "Expenses (EUR)", "Net (EUR)"],
      ...series.map((row) => [row.month, row.income, row.expenses, row.net]),
    ]);
  }
  const fullMonth = (short = "") =>
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].find((name) => short && name.startsWith(short)) ?? short;
  const currentMonth = fullMonth(series.at(-1)?.month);
  const previousMonthName = fullMonth(series.at(-2)?.month);
  const expenseDifference = stats.previous.expenses - stats.expenses;
  const { allTime } = stats;
  return (
    <div className="analytics-page">
      <div className="page-heading">
        <div>
          <h1>Analytics</h1>
          <p>See the patterns. Plan your next move.</p>
        </div>
        <div className="page-actions">
          <MonthSelect monthLabel={mobile} />
          <button className="button" onClick={report}>
            <Download size={16} />
            Download report
          </button>
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Metrics analytics />
          <div className="analytics-grid">
            <IncomeChart analytics />
            <CategoryBreakdown />
            <section className="card perspective-card">
              <div className="card-heading">
                <h2>A healthier month, in perspective</h2>
                <small>
                  {allTime
                    ? "All time · 6-month trend"
                    : `${currentMonth} vs. ${previousMonthName}`}
                </small>
              </div>
              <div className="perspective-columns">
                {metrics.map((m) => (
                  <div className="perspective-metric" key={m.key}>
                    <span>{m.title}</span>
                    <div>
                      <strong>{euro(m.value, false)}</strong>
                      {!allTime && (
                        <small
                          className={
                            (
                              m.key === "expenses"
                                ? m.change <= 0
                                : m.change >= 0
                            )
                              ? "positive"
                              : "negative"
                          }
                        >
                          {m.change >= 0 ? "+" : "−"}
                          {Math.abs(m.change).toFixed(1)}%
                        </small>
                      )}
                    </div>
                    <div
                      className="sparkline"
                      role="img"
                      aria-label={`${m.title} trend`}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={series}
                          margin={{ top: 8, right: 6, bottom: 10, left: 0 }}
                        >
                          <YAxis hide domain={["dataMin", "dataMax"]} />
                          <Tooltip
                            formatter={(value) =>
                              euro(Number(value) * 100, false)
                            }
                            labelFormatter={(_, payload) =>
                              payload[0]?.payload?.month ?? ""
                            }
                          />
                          <Area
                            dataKey={m.key}
                            type="linear"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            fill="transparent"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <small>
                      {allTime
                        ? "Total across all months"
                        : `${euro(m.previous, false)} in ${previousMonthName}`}
                    </small>
                  </div>
                ))}
              </div>
            </section>
            <section className="card insights-card">
              <h2>
                <Sparkles size={18} />A few things worth noticing
              </h2>
              {allTime ? (
                <div>
                  <h3>{euro(stats.expenses, false)} spent in total</h3>
                  <p>
                    Across every recorded month. Choose a single month to
                    compare it with the month before.
                  </p>
                </div>
              ) : (
                <div>
                  <h3>
                    {euro(Math.abs(expenseDifference), false)}{" "}
                    {expenseDifference >= 0 ? "less" : "more"} spent this month
                  </h3>
                  <p>
                    Your expenses{" "}
                    {stats.changes.expenses <= 0 ? "fell" : "rose"}{" "}
                    {Math.abs(stats.changes.expenses).toFixed(1)}% from{" "}
                    {previousMonthName}
                    {expenseDifference >= 0
                      ? ", leaving more room for what matters."
                      : "."}
                  </p>
                </div>
              )}
              <div>
                <h3>You saved {stats.savings.toFixed(1)}% of your income</h3>
                <p>
                  {allTime
                    ? `That's ${euro(stats.net, false)} set aside across all recorded months.`
                    : `That's ${euro(stats.net, false)} set aside in ${currentMonth}, ${stats.net >= stats.previous.net ? "up" : "down"} from ${euro(stats.previous.net, false)} last month.`}
                </p>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
