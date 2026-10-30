import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import {
  cashFlowScale,
  categories,
  categoryColors,
  DEFAULT_MONTH,
  euro,
  monthLabel,
  monthlySeries,
} from "../lib/finance";
import { useFinance } from "../lib/store";
import { useMobileLayout } from "../lib/useMobileLayout";
import { useStats } from "./Metrics";

const axisStyle = {
  fontSize: 9,
  fill: "#667085",
  fontFamily: "Inter Variable, sans-serif",
};
const tickEuro = (value: number) =>
  value === 0 ? "€0" : `${value < 0 ? "−" : ""}€${Math.abs(value) / 1000}k`;
// The reference highlights the latest month on the cash flow axis.
function MonthTick({
  x,
  y,
  payload,
  index,
  visibleTicksCount,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
  index?: number;
  visibleTicksCount?: number;
}) {
  const latest = index === (visibleTicksCount ?? 0) - 1;
  // Same 10px offset as the bar chart's dy, which Recharts does not forward to custom ticks.
  return (
    <text
      x={x}
      y={Number(y) + 10}
      textAnchor="middle"
      {...axisStyle}
      fill={latest ? "var(--primary)" : axisStyle.fill}
      fontWeight={latest ? 500 : 400}
    >
      <tspan dy="0.71em">{payload?.value}</tspan>
    </text>
  );
}
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly {
    name?: string | number;
    value?: number | string;
    color?: string;
  }[];
  label?: string | number;
}) {
  return active && payload?.length ? (
    <div className="chart-tooltip">
      <span>{label}</span>
      {payload.map((item, i) => (
        <strong key={i}>
          {payload.length > 1 ? `${item.name}: ` : ""}
          {euro(Number(item.value) * 100, false)}
        </strong>
      ))}
    </div>
  ) : null;
}
export function CashFlow() {
  const { transactions, month } = useFinance();
  const stats = useStats();
  const [range, setRange] = useState(6);
  const data = monthlySeries(transactions, month, range);
  const scale = cashFlowScale(data.map((d) => d.net));
  return (
    <section className="card cash-card">
      <div className="card-heading cash-heading">
        <div>
          <h2>Cash flow</h2>
          <div className="cash-summary">
            <strong>{euro(stats.net)}</strong>
            <small>{stats.allTime ? "net, all time" : "net this month"}</small>
          </div>
        </div>
        <label className="select-wrap cash-range">
          <span className="sr-only">Cash flow period</span>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            <option value={6}>Last 6 months</option>
            <option value={3}>Last 3 months</option>
          </select>
          <ChevronDown size={13} />
        </label>
        <div className="mobile-cash-summary">
          <strong>{euro(stats.net, false)}</strong>{" "}
          {stats.allTime ? "net, all time" : `net in ${data.at(-1)?.month}`}
        </div>
      </div>
      <div
        className="cash-chart"
        role="img"
        aria-label={`Cash flow for ${data.length} months. ${stats.allTime ? "All-time" : "Current"} net cash flow ${euro(stats.net)}.`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 10, bottom: 0, left: -15 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={<MonthTick />}
              axisLine={false}
              tickLine={false}
              padding={{ left: 0, right: 0 }}
            />
            <YAxis
              domain={scale.domain}
              ticks={scale.ticks}
              tickFormatter={tickEuro}
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "#aaa6ee", strokeDasharray: "3 3" }}
            />
            <Area
              name="Net cash flow"
              dataKey="net"
              type="linear"
              stroke="var(--primary)"
              strokeWidth={2.3}
              fill="var(--primary-soft)"
              fillOpacity={1}
              dot={{ r: 2, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
export function IncomeChart({ analytics = false }: { analytics?: boolean }) {
  const { transactions, month, notify } = useFinance();
  const mobile = useMobileLayout();
  // The negative desktop padding matches the reference; narrow screens need real inset so bars clear the Y labels.
  const inset = mobile ? 6 : analytics ? -26 : -11;
  const barSize = analytics && !mobile ? 20 : mobile ? 12 : 10;
  const data = monthlySeries(transactions, month);
  const domain = Math.max(
    9000,
    Math.ceil(Math.max(...data.flatMap((d) => [d.income, d.expenses])) / 4500) *
      4500,
  );
  return (
    <section className={`card income-card ${analytics ? "trends-card" : ""}`}>
      <div className="card-heading">
        <div>
          <h2>
            {analytics ? "Income & expense trends" : "Income vs. expenses"}
          </h2>
          {analytics && (
            <p className="chart-subtitle">
              {data[0].month} – {monthLabel(month === "all" ? DEFAULT_MONTH : month)}{" "}
              · Monthly totals
            </p>
          )}
        </div>
        {analytics ? (
          <Legend />
        ) : (
          <button
            className="icon-button"
            aria-label="About income and expenses chart"
            onClick={() =>
              notify(
                "Chart values include completed and pending demo transactions. Hover or focus a bar to explore.",
              )
            }
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>
      {!analytics && <Legend />}
      <div
        className="income-chart"
        role="img"
        aria-label="Monthly income and expenses in euros"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data}
            barGap={analytics ? 6 : 4}
            margin={{ top: 7, right: 0, bottom: 0, left: -16 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              dy={10}
              padding={{ left: inset, right: inset }}
            />
            <YAxis
              domain={[0, domain]}
              ticks={[0, domain / 2, domain]}
              tickFormatter={tickEuro}
              tick={axisStyle}
              width={48}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f7f7fc" }} />
            <Bar
              name="Income"
              dataKey="income"
              fill="var(--primary)"
              barSize={barSize}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              name="Expenses"
              dataKey="expenses"
              fill="#b8b9ee"
              barSize={barSize}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
function Legend() {
  return (
    <div className="chart-legend">
      <span>
        <i />
        Income
      </span>
      <span>
        <i />
        Expenses
      </span>
    </div>
  );
}
export function useCategories() {
  const stats = useStats();
  return categories
    .slice(1)
    .map((name, index) => ({
      name,
      value: -stats.selected
        .filter((t) => t.category === name && t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0),
      color: categoryColors[index],
    }));
}
export function SpendingChart() {
  const data = useCategories();
  const stats = useStats();
  const { notify } = useFinance();
  return (
    <section className="card spending-card">
      <div className="card-heading">
        <h2>Spending by category</h2>
        <button
          className="icon-button"
          aria-label="About spending categories"
          onClick={() =>
            notify(
              "Expenses are grouped by category for the selected date range.",
            )
          }
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="spending-content">
        <div
          className="donut-chart"
          role="img"
          aria-label={`Total spent ${euro(stats.expenses)} across five categories`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={
                  stats.expenses
                    ? data
                    : [{ name: "No expenses", value: 1, color: "#e4e3f9" }]
                }
                dataKey="value"
                innerRadius={50}
                outerRadius={65}
                startAngle={90}
                endAngle={-270}
                stroke="#fff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {(stats.expenses ? data : [{ color: "#e4e3f9" }]).map(
                  (entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ),
                )}
              </Pie>
              <Tooltip formatter={(value) => euro(Number(value), false)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-label">
            <strong>{euro(stats.expenses, false)}</strong>
            <small>Total spent</small>
          </div>
        </div>
        <div className="category-legend">
          {data.map((c) => (
            <div key={c.name}>
              <span>
                <i style={{ background: c.color }} />
                {c.name}
              </span>
              <strong>{euro(c.value, false)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function CategoryBreakdown() {
  const data = useCategories();
  const stats = useStats();
  const max = Math.max(1, ...data.map((c) => c.value));
  return (
    <section className="card category-breakdown">
      <div className="card-heading">
        <h2>Category breakdown</h2>
        <strong>{euro(stats.expenses, false)}</strong>
      </div>
      <div className="breakdown-list">
        {data.map((c) => (
          <div key={c.name}>
            <div>
              <span>{c.name}</span>
              <span>
                {euro(c.value, false)} <b>·</b>{" "}
                {stats.expenses
                  ? ((c.value / stats.expenses) * 100).toFixed(1)
                  : "0.0"}
                %
              </span>
            </div>
            <div className="category-track">
              <div
                style={{
                  width: `${(c.value / max) * 100}%`,
                  background: c.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
