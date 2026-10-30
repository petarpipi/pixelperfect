import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLocation, useSearchParams } from "react-router";
import {
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  MoveVertical,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { AddTransaction } from "../components/AddTransaction";
import {
  CategorySelect,
  EmptyState,
  LoadingState,
  Modal,
  MonthSelect,
  StatusBadge,
  TransactionIcon,
} from "../components/UI";
import {
  categories,
  dateScope,
  displayDate,
  euro,
  exportTransactions,
  filterTransactions,
  signedEuro,
} from "../lib/finance";
import type { Transaction } from "../lib/finance";
import { useFinance } from "../lib/store";

// Every filter lives in the URL so a reload or a shared link restores the same view.
const defaults = {
  q: "",
  category: "all",
  status: "all",
  type: "all",
  sort: "date-desc",
  from: "",
  to: "",
  min: "",
  page: "1",
  size: "8",
};
type Param = keyof typeof defaults;
const allowed: Partial<Record<Param, readonly string[]>> = {
  category: ["all", ...categories],
  status: ["all", "Completed", "Pending"],
  type: ["all", "income", "expense"],
  sort: ["date-desc", "date-asc", "amount-desc", "amount-asc"],
  size: ["8", "16", "32"],
};
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function readFilters(params: URLSearchParams) {
  const read = (key: Param) => {
    const value = params.get(key) ?? defaults[key];
    if (allowed[key] && !allowed[key].includes(value)) return defaults[key];
    if ((key === "from" || key === "to") && value && !isoDate.test(value))
      return "";
    if (key === "min" && value && !(Number(value) >= 0)) return "";
    if (key === "page") return String(Math.max(1, Math.floor(Number(value)) || 1));
    return value;
  };
  return Object.fromEntries(
    Object.keys(defaults).map((key) => [key, read(key as Param)]),
  ) as Record<Param, string>;
}
function serializeFilters(filters: Record<Param, string>) {
  const params = new URLSearchParams();
  for (const key of Object.keys(defaults) as Param[])
    if (filters[key] && filters[key] !== defaults[key])
      params.set(key, filters[key]);
  return params.toString();
}

// The header search navigates here with fresh state; remounting re-reads the URL.
export function Transactions() {
  const location = useLocation();
  const state = location.state as { search?: number } | null;
  return <TransactionsView key={state?.search ?? "page"} />;
}

function TransactionsView() {
  const { transactions, month, setMonth, loading, deleteTransactions } =
    useFinance();
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();
  // Local state is the source of truth; the URL mirrors it without racing fast successive edits.
  const [filters, setFilters] = useState(() => readFilters(params));
  const serialized = serializeFilters(filters);
  const current = params.toString();
  useEffect(() => {
    if (serialized !== current)
      setParams(new URLSearchParams(serialized), { replace: true, state });
  }, [serialized, current, setParams, state]);
  const {
    q: query,
    category,
    status,
    type,
    sort,
    from,
    to,
    min: minimum,
  } = filters;
  const pageSize = Number(filters.size);
  const page = Number(filters.page);
  function update(patch: Partial<Record<Param, string>>) {
    setFilters((current) => ({
      ...current,
      ...patch,
      page: patch.page ?? "1",
    }));
  }
  const [advanced, setAdvanced] = useState(() => !!(from || to || minimum));
  const [addOpen, setAddOpen] = useState(false);
  const [details, setDetails] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string[]>([]);
  const scope = dateScope(month, from, to);
  // A new search or filter starts a new selection, so hidden rows are never deleted by accident.
  const selectionKey = JSON.stringify([
    query,
    category,
    status,
    type,
    scope,
    minimum,
  ]);
  const [selectionScope, setSelectionScope] = useState(selectionKey);
  if (selectionScope !== selectionKey) {
    setSelectionScope(selectionKey);
    setSelected([]);
  }
  const filtered = filterTransactions(transactions, {
    query,
    category,
    month: scope.month,
    status,
    type,
    sort,
    from: scope.from,
    to: scope.to,
    minimum,
  });
  const periodTransactions = filterTransactions(transactions, {
    query: "",
    category: "all",
    month: scope.month,
    status: "all",
    type: "all",
    sort,
    from: scope.from,
    to: scope.to,
  });
  const selectedRows = filtered.filter((t) => selected.includes(t.id));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pages);
  const rows = filtered.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  const allSelected =
    rows.length > 0 && rows.every((t) => selected.includes(t.id));
  function clear() {
    setFilters({ ...defaults, size: String(pageSize) });
  }
  function toggle(id: string) {
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }
  const visiblePages = [
    ...new Set([
      1,
      ...(activePage <= 3
        ? [2, 3]
        : [activePage - 1, activePage, activePage + 1]),
      pages,
    ]),
  ]
    .filter((p) => p > 0 && p <= pages)
    .sort((a, b) => a - b);
  const deletingRows = transactions.filter((t) => deleting.includes(t.id));
  return (
    <div className="transactions-page">
      <div className="page-heading">
        <div>
          <h1>Transactions</h1>
          <p>Every movement, all in one place.</p>
        </div>
        <div className="page-actions">
          <button
            className="button"
            onClick={() => exportTransactions(filtered)}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button className="button primary" onClick={() => setAddOpen(true)}>
            <Plus size={17} />
            Add Transaction
          </button>
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <section className="card transactions-card" aria-label="Transactions">
          <div className="transactions-toolbar">
            <div className="transaction-tabs-row">
              <div
                className="transaction-tabs"
                role="group"
                aria-label="Transaction type"
              >
                {[
                  {
                    key: "all",
                    label: "All transactions",
                    count: periodTransactions.length,
                  },
                  {
                    key: "income",
                    label: "Income",
                    count: periodTransactions.filter((t) => t.amount > 0)
                      .length,
                  },
                  {
                    key: "expense",
                    label: "Expenses",
                    count: periodTransactions.filter((t) => t.amount < 0)
                      .length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    aria-pressed={type === tab.key}
                    onClick={() => update({ type: tab.key })}
                  >
                    {tab.label} · {tab.count}
                  </button>
                ))}
              </div>
              <small>All amounts in EUR (€)</small>
            </div>
            <div className="transaction-filters">
              <label className="search-field">
                <Search size={17} strokeWidth={1.4} />
                <input
                  aria-label="Search transactions"
                  placeholder="Search transactions..."
                  value={query}
                  onChange={(e) => update({ q: e.target.value })}
                />
              </label>
              <CategorySelect
                includeAll
                value={category}
                onChange={(v) => update({ category: v })}
              />
              <MonthSelect
                allowAll
                customRange={
                  scope.custom
                    ? `${from ? displayDate(from) : "Any date"} – ${to ? displayDate(to) : "Any date"}`
                    : undefined
                }
                onSelect={() => update({ from: "", to: "" })}
              />
              <label className="select-wrap">
                <span className="sr-only">Status</span>
                <select
                  value={status}
                  onChange={(e) => update({ status: e.target.value })}
                >
                  <option value="all">All statuses</option>
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
                <ChevronDown size={13} />
              </label>
              <button
                className={`button filters-button ${advanced ? "is-active" : ""}`}
                aria-expanded={advanced}
                aria-controls="advanced-filters"
                onClick={() => setAdvanced((v) => !v)}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
            </div>
            {advanced && (
              <div className="advanced-filters" id="advanced-filters">
                <label>
                  From date
                  <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    aria-invalid={scope.invalid}
                    aria-describedby={scope.invalid ? "range-error" : undefined}
                    onChange={(e) => update({ from: e.target.value })}
                  />
                </label>
                <label>
                  To date
                  <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    aria-invalid={scope.invalid}
                    aria-describedby={scope.invalid ? "range-error" : undefined}
                    onChange={(e) => update({ to: e.target.value })}
                  />
                </label>
                <label>
                  Minimum amount (€)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minimum}
                    onChange={(e) => update({ min: e.target.value })}
                  />
                </label>
                <button className="text-link" onClick={clear}>
                  Clear filters
                </button>
                {scope.invalid && (
                  <p className="field-error" id="range-error" role="alert">
                    From date must be on or before To date. The date range is
                    not applied.
                  </p>
                )}
              </div>
            )}
          </div>
          {selectedRows.length > 0 && (
            <div
              className="bulk-bar"
              role="region"
              aria-label="Selected transactions"
            >
              <span>
                {selectedRows.length} selected
                {selectedRows.length > rows.filter((t) => selected.includes(t.id)).length &&
                  " · includes other pages"}
              </span>
              <button className="text-link" onClick={() => setSelected([])}>
                Clear selection
              </button>
              <button
                className="button danger"
                onClick={() => setDeleting(selectedRows.map((t) => t.id))}
              >
                <Trash2 size={14} />
                Delete selected ({selectedRows.length})
              </button>
            </div>
          )}
          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th className="checkbox-cell">
                    <input
                      type="checkbox"
                      aria-label="Select all visible transactions"
                      checked={allSelected}
                      onChange={() =>
                        setSelected((ids) =>
                          allSelected
                            ? ids.filter((id) => !rows.some((t) => t.id === id))
                            : [...new Set([...ids, ...rows.map((t) => t.id)])],
                        )
                      }
                    />
                  </th>
                  <th>Transaction</th>
                  <th
                    aria-sort={
                      sort.startsWith("date")
                        ? sort === "date-desc"
                          ? "descending"
                          : "ascending"
                        : "none"
                    }
                  >
                    <button
                      onClick={() =>
                        update({
                          sort: sort === "date-desc" ? "date-asc" : "date-desc",
                        })
                      }
                    >
                      Date{" "}
                      <ArrowDown
                        size={11}
                        className={sort === "date-asc" ? "rotate-180" : ""}
                      />
                    </button>
                  </th>
                  <th>Category</th>
                  <th>Status</th>
                  <th
                    className="amount-cell"
                    aria-sort={
                      sort.startsWith("amount")
                        ? sort === "amount-desc"
                          ? "descending"
                          : "ascending"
                        : "none"
                    }
                  >
                    <button
                      className="amount-sort"
                      onClick={() =>
                        update({
                          sort:
                            sort === "amount-desc"
                              ? "amount-asc"
                              : "amount-desc",
                        })
                      }
                    >
                      Amount <MoveVertical size={11} />
                    </button>
                  </th>
                  <th>
                    <span className="sr-only">Actions</span>
                    <span className="actions-mark" aria-hidden="true" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${t.name}`}
                        checked={selected.includes(t.id)}
                        onChange={() => toggle(t.id)}
                      />
                    </td>
                    <td>
                      <div className="table-transaction">
                        <TransactionIcon transaction={t} />
                        <div>
                          <button
                            className="transaction-detail-button"
                            onClick={() => setDetails(t)}
                          >
                            {t.name}
                          </button>
                          <small>{t.description}</small>
                          <small className="mobile-row-date">
                            {displayDate(t.date, false)} · {t.category}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="date-cell">{displayDate(t.date)}</td>
                    <td className="category-cell">{t.category}</td>
                    <td className="status-cell">
                      <StatusBadge status={t.status} />
                    </td>
                    <td
                      className={`amount-cell ${t.amount > 0 ? "positive" : ""}`}
                    >
                      {signedEuro(t.amount)}
                      <span className="mobile-row-status">
                        <StatusBadge status={t.status} />
                      </span>
                    </td>
                    <td className="row-actions">
                      <RowMenu
                        name={t.name}
                        onView={() => setDetails(t)}
                        onDelete={() => setDeleting([t.id])}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <EmptyState onClear={clear} />}
          </div>
          <div className="transactions-footer">
            <div className="pagination-summary">
              <span>
                Showing {filtered.length ? (activePage - 1) * pageSize + 1 : 0}–
                {Math.min(activePage * pageSize, filtered.length)} of{" "}
                {filtered.length} transactions
              </span>
              <label>
                <span className="sr-only">Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => update({ size: e.target.value })}
                >
                  <option value={8}>8 per page</option>
                  <option value={16}>16 per page</option>
                  <option value={32}>32 per page</option>
                </select>
                <ChevronDown size={9} />
              </label>
            </div>
            <nav className="pagination" aria-label="Transaction pages">
              <button
                className="button"
                disabled={activePage === 1}
                onClick={() => update({ page: String(activePage - 1) })}
              >
                <ChevronLeft size={13} />
                <span>Previous</span>
              </button>
              {visiblePages.map((p, index) => (
                <span className="page-number-wrap" key={p}>
                  {index > 0 && p - visiblePages[index - 1] > 1 && (
                    <span className="ellipsis">...</span>
                  )}
                  <button
                    aria-label={`Page ${p}`}
                    aria-current={p === activePage ? "page" : undefined}
                    onClick={() => update({ page: String(p) })}
                  >
                    {p}
                  </button>
                </span>
              ))}
              <button
                className="button"
                disabled={activePage === pages}
                onClick={() => update({ page: String(activePage + 1) })}
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </nav>
          </div>
        </section>
      )}
      {addOpen && (
        <AddTransaction
          onClose={() => setAddOpen(false)}
          onAdded={(m) => {
            clear();
            setMonth(m);
          }}
        />
      )}
      {details && (
        <Modal title="Transaction details" onClose={() => setDetails(null)}>
          <div className="details-heading">
            <TransactionIcon transaction={details} />
            <div>
              <h3>{details.name}</h3>
              <p>{details.description}</p>
            </div>
          </div>
          <dl className="details-list">
            <div>
              <dt>Amount</dt>
              <dd className={details.amount > 0 ? "positive" : ""}>
                {signedEuro(details.amount)}
              </dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{displayDate(details.date)}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{details.category}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={details.status} />
              </dd>
            </div>
          </dl>
          <p className="demo-badge">
            Fictional transaction · Amount in EUR (
            {euro(Math.abs(details.amount))})
          </p>
          <div className="modal-actions">
            <button
              className="button danger"
              onClick={() => {
                setDeleting([details.id]);
                setDetails(null);
              }}
            >
              Delete transaction
            </button>
            <button className="button" onClick={() => setDetails(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {deleting.length > 0 && (
        <Modal title="Delete demo transaction?" onClose={() => setDeleting([])}>
          <p>
            This removes{" "}
            {deleting.length === 1
              ? "this transaction"
              : `${deleting.length} selected transactions`}{" "}
            from this browser's demo data and updates your financial metrics.
          </p>
          <ul className="delete-list">
            {deletingRows.slice(0, 5).map((t) => (
              <li key={t.id}>
                <span>{t.name}</span>
                <span>{signedEuro(t.amount)}</span>
              </li>
            ))}
            {deletingRows.length > 5 && (
              <li className="muted">and {deletingRows.length - 5} more</li>
            )}
          </ul>
          <div className="modal-actions">
            <button className="button" onClick={() => setDeleting([])}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                deleteTransactions(deleting);
                setSelected((s) => s.filter((id) => !deleting.includes(id)));
                setDeleting([]);
              }}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RowMenu({
  name,
  onView,
  onDelete,
}: {
  name: string;
  onView: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menu.current?.contains(target) &&
        !trigger.current?.contains(target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focus = (i: number) =>
      items[(i + items.length) % items.length]?.focus();
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focus(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focus(items.length - 1);
    } else if (event.key === "Tab") setOpen(false);
  }
  // Focus returns to the trigger first so a dialog opened next restores focus there.
  const choose = (action: () => void) => () => {
    setOpen(false);
    trigger.current?.focus();
    action();
  };
  return (
    <>
      <button
        ref={trigger}
        className="icon-button"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          ref={menu}
          id={id}
          className="row-menu"
          role="menu"
          aria-label={`Actions for ${name}`}
          onKeyDown={keyDown}
        >
          <button role="menuitem" tabIndex={-1} onClick={choose(onView)}>
            View details
          </button>
          <button
            role="menuitem"
            tabIndex={-1}
            className="negative"
            onClick={choose(onDelete)}
          >
            <Trash2 size={13} aria-hidden="true" />
            Delete transaction
          </button>
        </div>
      )}
    </>
  );
}
