import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  House,
  Layers,
  Music2,
  ShoppingBag,
  ShoppingBasket,
  TramFront,
  X,
} from "lucide-react";
import { categories, DEFAULT_MONTH, monthLabel } from "../lib/finance";
import type { Category, Transaction } from "../lib/finance";
import { useFinance } from "../lib/store";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M12 1.5 14.5 9.5 22.5 12 14.5 14.5 12 22.5 9.5 14.5 1.5 12 9.5 9.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {!compact && (
        <span className="brand-word">
          northstar<small>FINANCE</small>
        </span>
      )}
    </span>
  );
}
export function TransactionIcon({
  transaction,
}: {
  transaction: Pick<Transaction, "category" | "name">;
}) {
  const icons = {
    Income:
      transaction.name === "Freelance project"
        ? ArrowDownLeft
        : BriefcaseBusiness,
    Housing: House,
    "Food & groceries": ShoppingBasket,
    Shopping: ShoppingBag,
    Transport: TramFront,
    Subscriptions: transaction.name === "Spotify" ? Music2 : Layers,
  };
  const Icon = icons[transaction.category];
  return (
    <span
      className={`transaction-icon ${transaction.category === "Income" ? "is-income" : ""}`}
    >
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function MonthSelect({
  compact = false,
  allowAll = false,
  monthLabel: monthOnly = false,
  customRange,
  onSelect,
}: {
  compact?: boolean;
  allowAll?: boolean;
  /** Shows "October 2026" instead of the full date range, for narrow screens. */
  monthLabel?: boolean;
  /** Label of an active custom From/To range, shown as the selected option. */
  customRange?: string;
  onSelect?: (month: string) => void;
}) {
  const { month, setMonth, transactions } = useFinance();
  const months = [
    ...new Set([DEFAULT_MONTH, ...transactions.map((t) => t.date.slice(0, 7))]),
  ]
    .sort()
    .reverse();
  return (
    <label className={`select-wrap month-select ${compact ? "compact" : ""}`}>
      <CalendarDays size={15} aria-hidden="true" />
      <span className="sr-only">Date range</span>
      <select
        value={customRange ? "custom" : month}
        onChange={(e) => {
          setMonth(e.target.value);
          onSelect?.(e.target.value);
        }}
      >
        {customRange && (
          <option value="custom" disabled>
            {customRange}
          </option>
        )}
        {months.map((m) => (
          <option key={m} value={m}>
            {compact || monthOnly
              ? monthLabel(m)
              : `${new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`))} 1 – ${new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`))} ${new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate()}, ${m.slice(0, 4)}`}
          </option>
        ))}
        {(allowAll || month === "all") && <option value="all">All time</option>}
      </select>
      <ChevronDown size={13} aria-hidden="true" />
    </label>
  );
}
export function CategorySelect({
  value,
  onChange,
  includeAll = false,
  income = false,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
  income?: boolean;
  id?: string;
}) {
  return (
    <span className="select-wrap">
      <select
        id={id}
        aria-label={id ? undefined : "Category"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {includeAll && <option value="all">All categories</option>}
        {categories
          .filter(
            (c) => includeAll || (income ? c === "Income" : c !== "Income"),
          )
          .map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" />
    </span>
  );
}
export function StatusBadge({ status }: { status: Transaction["status"] }) {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      <span aria-hidden="true">•</span> {status}
    </span>
  );
}
export function LoadingState() {
  return (
    <div
      className="loading-state"
      role="status"
      aria-label="Loading demo finances"
    >
      <div className="skeleton h-24" />
      <div className="skeleton h-64" />
      <span>Loading demo finances…</span>
    </div>
  );
}
export function EmptyState({
  title = "No transactions found",
  onClear,
}: {
  title?: string;
  onClear?: () => void;
}) {
  return (
    <div className="empty-state">
      <ShoppingBag size={30} aria-hidden="true" />
      <h3>{title}</h3>
      <p>Try a different date range or add a demo transaction.</p>
      {onClear && (
        <button className="button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
export function CategoryName({ category }: { category: Category }) {
  return <span>{category}</span>;
}
