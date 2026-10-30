import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_MONTH,
  emptyStore,
  readStore,
  seedTransactions,
  STORAGE_KEY,
} from "./finance";
import type { Transaction } from "./finance";

type FinanceContext = {
  transactions: Transaction[];
  loading: boolean;
  month: string;
  setMonth: (month: string) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransactions: (ids: string[]) => void;
  toast: string;
  notify: (message: string) => void;
};
const Context = createContext<FinanceContext | null>(null);
function loadStore() {
  try {
    const { data, discarded, reset } = readStore(
      localStorage.getItem(STORAGE_KEY),
    );
    return {
      data,
      message: reset
        ? "Saved demo data could not be read and was reset."
        : discarded
          ? `${discarded} saved ${discarded === 1 ? "entry" : "entries"} could not be read and ${discarded === 1 ? "was" : "were"} skipped.`
          : "",
    };
  } catch {
    return { data: emptyStore(), message: "" };
  }
}
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadStore);
  const [stored, setStored] = useState(initial.data);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [toast, notify] = useState(initial.message);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 180);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      notify(
        "Browser storage is unavailable. Changes will last for this visit.",
      );
    }
  }, [stored]);
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => notify(""), 5000);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);
  const transactions = useMemo(
    () =>
      [...seedTransactions, ...stored.created].filter(
        (t) => !stored.deletedIds.includes(t.id),
      ),
    [stored],
  );
  function addTransaction(transaction: Transaction) {
    setStored((s) => ({ ...s, created: [...s.created, transaction] }));
    notify("Transaction added.");
  }
  function deleteTransactions(ids: string[]) {
    setStored((s) => ({
      ...s,
      created: s.created.filter((t) => !ids.includes(t.id)),
      deletedIds: [
        ...new Set([
          ...s.deletedIds,
          ...ids.filter((id) => seedTransactions.some((t) => t.id === id)),
        ]),
      ],
    }));
    notify(
      ids.length === 1
        ? "Transaction deleted."
        : `${ids.length} transactions deleted.`,
    );
  }
  return (
    <Context
      value={{
        transactions,
        loading,
        month,
        setMonth,
        addTransaction,
        deleteTransactions,
        toast,
        notify,
      }}
    >
      {children}
    </Context>
  );
}
export function useFinance() {
  const context = useContext(Context);
  if (!context) throw new Error("FinanceProvider is required.");
  return context;
}
