import { useState } from "react";
import type { FormEvent } from "react";
import {
  categories,
  DEMO_DATE,
  MIN_DATE,
  validateTransaction,
} from "../lib/finance";
import type { Category, Status, TransactionForm } from "../lib/finance";
import { useFinance } from "../lib/store";
import { Modal } from "./UI";

export function AddTransaction({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (month: string) => void;
}) {
  const { addTransaction } = useFinance();
  const [form, setForm] = useState<TransactionForm>({
    name: "",
    description: "",
    amount: "",
    date: DEMO_DATE,
    category: "Food & groceries",
    type: "expense",
    status: "Completed",
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateTransaction>>(
    {},
  );
  function field(name: keyof TransactionForm, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateTransaction(form);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.modal [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    addTransaction({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim() || "Demo transaction",
      date: form.date,
      category: form.category as Category,
      status: form.status as Status,
      amount:
        Math.round(Number(form.amount) * 100) *
        (form.type === "income" ? 1 : -1),
    });
    onAdded(form.date.slice(0, 7));
    onClose();
  }
  const error = (name: keyof TransactionForm) =>
    errors[name] ? (
      <span className="field-error" id={`${name}-error`}>
        {errors[name]}
      </span>
    ) : null;
  return (
    <Modal title="Add Transaction" onClose={onClose}>
      <p className="modal-subtitle">
        Add a fictional transaction to your personal demo.
      </p>
      <form onSubmit={submit} noValidate className="transaction-form">
        <fieldset className="type-switch">
          <legend className="sr-only">Transaction type</legend>
          {["expense", "income"].map((type) => (
            <label key={type}>
              <input
                type="radio"
                name="type"
                value={type}
                checked={form.type === type}
                onChange={() => {
                  setForm((f) => ({
                    ...f,
                    type,
                    category: type === "income" ? "Income" : "Food & groceries",
                  }));
                  setErrors({});
                }}
              />
              <span>{type === "income" ? "Income" : "Expense"}</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="transaction-name">
          <span id="transaction-name-label">Transaction name</span>
          <input
            id="transaction-name"
            data-autofocus
            aria-labelledby="transaction-name-label"
            name="name"
            autoComplete="off"
            placeholder="e.g. Weekly groceries"
            maxLength={80}
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {error("name")}
        </label>
        <div className="form-grid">
          <label htmlFor="transaction-amount">
            <span id="transaction-amount-label">Amount (EUR)</span>
            <input
              id="transaction-amount"
              aria-labelledby="transaction-amount-label"
              name="amount"
              inputMode="decimal"
              type="text"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => field("amount", e.target.value)}
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-error" : undefined}
            />
            {error("amount")}
          </label>
          <label htmlFor="transaction-date">
            <span id="transaction-date-label">Date</span>
            <input
              id="transaction-date"
              aria-labelledby="transaction-date-label"
              name="date"
              type="date"
              min={MIN_DATE}
              max={DEMO_DATE}
              value={form.date}
              onChange={(e) => field("date", e.target.value)}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? "date-error" : undefined}
            />
            {error("date")}
          </label>
        </div>
        <div className="form-grid">
          <label htmlFor="transaction-category">
            Category
            <select
              id="transaction-category"
              name="category"
              value={form.category}
              onChange={(e) => field("category", e.target.value)}
              aria-invalid={!!errors.category}
            >
              {categories
                .filter((c) =>
                  form.type === "income" ? c === "Income" : c !== "Income",
                )
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>
            {error("category")}
          </label>
          <label htmlFor="transaction-status">
            Status
            <select
              id="transaction-status"
              value={form.status}
              onChange={(e) => field("status", e.target.value)}
            >
              <option>Completed</option>
              <option>Pending</option>
            </select>
          </label>
        </div>
        <label htmlFor="transaction-description">
          Description <span className="muted">(optional)</span>
          <input
            id="transaction-description"
            maxLength={120}
            placeholder="A note for this transaction"
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
          />
          {error("description")}
        </label>
        <p className="demo-badge">Demo only · No real money is moved</p>
        <div className="modal-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            Add transaction
          </button>
        </div>
      </form>
    </Modal>
  );
}
