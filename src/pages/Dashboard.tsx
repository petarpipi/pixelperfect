import { Link } from "react-router";
import { ArrowUpRight, Download } from "lucide-react";
import { CashFlow, IncomeChart, SpendingChart } from "../components/Charts";
import { Metrics, useStats } from "../components/Metrics";
import {
  EmptyState,
  LoadingState,
  MonthSelect,
  TransactionIcon,
} from "../components/UI";
import { displayDate, exportTransactions, signedEuro } from "../lib/finance";
import { useFinance } from "../lib/store";
import { useMobileLayout } from "../lib/useMobileLayout";

export function Dashboard() {
  const mobile = useMobileLayout();
  const { loading } = useFinance();
  const stats = useStats();
  const recent = [...stats.selected]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <h1>Overview</h1>
          <p>A little clarity. A better financial day.</p>
        </div>
        <div className="page-actions">
          <MonthSelect />
          <button
            className="button"
            onClick={() => exportTransactions(stats.selected)}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Metrics />
          <div className="dashboard-grid">
            <CashFlow />
            {!mobile && <IncomeChart />}
            <section className="card recent-card">
              <div className="card-heading">
                <h2>Recent transactions</h2>
                <Link to="/transactions" className="text-link">
                  View all <ArrowUpRight size={12} />
                </Link>
              </div>
              {recent.length ? (
                <>
                  <div className="recent-table-head">
                    <span>Transaction</span>
                    <span>Category</span>
                    <span>Amount</span>
                  </div>
                  <div className="recent-list">
                    {recent.map((t) => (
                      <div className="recent-row" key={t.id}>
                        <TransactionIcon transaction={t} />
                        <div className="recent-name">
                          <strong>{t.name}</strong>
                          <small>
                            {t.category} · {displayDate(t.date, false)}
                          </small>
                        </div>
                        <span className="recent-category">{t.category}</span>
                        <div className="recent-amount">
                          <strong className={t.amount > 0 ? "positive" : ""}>
                            {signedEuro(t.amount)}
                          </strong>
                          {t.status === "Pending" && (
                            <small className="pending-text">Pending</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="No recent transactions" />
              )}
            </section>
            {!mobile && <SpendingChart />}
          </div>
        </>
      )}
    </div>
  );
}
