export const categories = [
  "Income",
  "Housing",
  "Food & groceries",
  "Shopping",
  "Transport",
  "Subscriptions",
] as const;
export type Category = (typeof categories)[number];
export type Status = "Completed" | "Pending";
export type Transaction = {
  id: string;
  name: string;
  description: string;
  date: string;
  category: Category;
  amount: number;
  status: Status;
};
// DEMO_DATE is the fixed "today" of the demo; new entries cannot be dated after it.
export const DEMO_DATE = "2026-10-31";
export const MIN_DATE = "2000-01-01";
export const DEFAULT_MONTH = "2026-10";
export const STORAGE_KEY = "pixelperfect:northstar:v1";
export const categoryColors = [
  "#5357d8",
  "#8c8fe2",
  "#b2b4ec",
  "#d0d1f5",
  "#e4e4f9",
];

const recent: Transaction[] = [
  {
    id: "oct-1",
    name: "Studio North",
    description: "October salary",
    date: "2026-10-30",
    category: "Income",
    amount: 580000,
    status: "Completed",
  },
  {
    id: "oct-2",
    name: "Whole Foods Market",
    description: "Card •• 4291",
    date: "2026-10-29",
    category: "Food & groceries",
    amount: -8640,
    status: "Completed",
  },
  {
    id: "oct-3",
    name: "ARKET",
    description: "Card •• 4291",
    date: "2026-10-28",
    category: "Shopping",
    amount: -12900,
    status: "Pending",
  },
  {
    id: "oct-4",
    name: "Spotify",
    description: "Monthly subscription",
    date: "2026-10-27",
    category: "Subscriptions",
    amount: -1099,
    status: "Completed",
  },
  {
    id: "oct-5",
    name: "Metro Copenhagen",
    description: "Card •• 4291",
    date: "2026-10-26",
    category: "Transport",
    amount: -2400,
    status: "Completed",
  },
  {
    id: "oct-6",
    name: "Freelance project",
    description: "Invoice NS-024",
    date: "2026-10-25",
    category: "Income",
    amount: 270000,
    status: "Completed",
  },
  {
    id: "oct-7",
    name: "Nordic Living",
    description: "October rent",
    date: "2026-10-24",
    category: "Housing",
    amount: -145000,
    status: "Completed",
  },
  {
    id: "oct-8",
    name: "Adobe",
    description: "Creative Cloud",
    date: "2026-10-23",
    category: "Subscriptions",
    amount: -5999,
    status: "Completed",
  },
];
const merchants: Record<Exclude<Category, "Income">, string[]> = {
  Housing: ["Nordic Living"],
  "Food & groceries": [
    "Green Basket",
    "Local Market",
    "Corner Bakery",
    "Harbour Coffee",
  ],
  Shopping: [
    "Nordic Books",
    "Everyday Studio",
    "Paper & Co.",
    "City Outfitters",
  ],
  Transport: ["Metro Copenhagen", "City Bike", "Regional Rail"],
  Subscriptions: [
    "Cloud Studio",
    "Reading Club",
    "Design Tools",
    "Music Library",
  ],
};
// Integer cents keep every generated category total exact, including rounding remainders.
const additional = (
  [
    ["Food & groceries", 63360, 40],
    ["Shopping", 35100, 30],
    ["Transport", 32600, 25],
    ["Subscriptions", 16902, 25],
  ] as const
).flatMap(([category, total, count]) =>
  Array.from({ length: count }, (_, i): Transaction => ({
    id: `oct-${category}-${i}`,
    name: merchants[category][i % merchants[category].length],
    description: "Card •• 4291",
    date: `2026-10-${String(22 - (i % 22)).padStart(2, "0")}`,
    category,
    amount: -(Math.floor(total / count) + (i < total % count ? 1 : 0)),
    status: "Completed",
  })),
);
const history = [
  ["05", 720000, 310000],
  ["06", 760000, 330000],
  ["07", 740000, 300000],
  ["08", 810000, 360000],
  ["09", 800000, 348000],
] as const;
const historical = history.flatMap(([month, income, expenses]) => {
  const weights = [0.4475, 0.2222, 0.1481, 0.108, 0.0742];
  const split = weights.map((w) => Math.floor(expenses * w));
  split[0] += expenses - split.reduce((sum, value) => sum + value, 0);
  return [
    {
      id: `${month}-income`,
      name: "Studio North",
      description: "Monthly income",
      date: `2026-${month}-28`,
      category: "Income" as Category,
      amount: income,
      status: "Completed" as Status,
    },
    ...split.map((amount, i): Transaction => ({
      id: `${month}-${i}`,
      name: merchants[categories[i + 1] as Exclude<Category, "Income">][0],
      description: "Monthly demo expenses",
      date: `2026-${month}-24`,
      category: categories[i + 1],
      amount: -amount,
      status: "Completed",
    })),
  ];
});
export const seedTransactions = [...recent, ...additional, ...historical];
export const openingBalance =
  4856200 - seedTransactions.reduce((sum, t) => sum + t.amount, 0);
// Negative values use the typographic minus (−), matching signedEuro and the chart ticks.
export const euro = (cents: number, decimals = true) => {
  const text = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(Math.abs(cents) / 100);
  // A value that rounds to zero is shown unsigned ("€0", not "−€0").
  return cents < 0 && /[1-9]/.test(text) ? `−${text}` : text;
};
export const signedEuro = (cents: number) =>
  `${cents >= 0 ? "+" : "−"}${euro(Math.abs(cents))}`;
export const displayDate = (date: string, year = true) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(year ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
export const monthLabel = (month: string) =>
  month === "all"
    ? "All time"
    : new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${month}-15T12:00:00Z`));
export function previousMonth(month: string) {
  const date = new Date(`${month}-15T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}
export function totals(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum - t.amount, 0);
  return {
    income,
    expenses,
    net: income - expenses,
    savings: income > 0 ? ((income - expenses) / income) * 100 : 0,
  };
}
export const percentageChange = (current: number, previous: number) =>
  previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;
export function monthlySeries(
  transactions: Transaction[],
  endMonth: string,
  length = 6,
) {
  let month = endMonth === "all" ? DEFAULT_MONTH : endMonth;
  const months: string[] = [];
  for (let i = 0; i < length; i++) {
    months.unshift(month);
    month = previousMonth(month);
  }
  return months.map((period) => {
    const stats = totals(transactions.filter((t) => t.date.startsWith(period)));
    return {
      month: new Intl.DateTimeFormat("en", {
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${period}-15T12:00:00Z`)),
      income: stats.income / 100,
      expenses: stats.expenses / 100,
      net: stats.net / 100,
    };
  });
}
// Keeps the Figma scale (€0 / €3k / €6k) for positive data and extends below zero only when needed.
export function cashFlowScale(values: number[], step = 3000, minimum = 6000) {
  const max = Math.max(
    minimum,
    Math.ceil(Math.max(0, ...values) / step) * step,
  );
  const lowest = Math.min(0, ...values);
  if (lowest >= 0) return { domain: [0, max], ticks: [0, max / 2, max] };
  const min = Math.floor(lowest / step) * step;
  return { domain: [min, max], ticks: [min, 0, max] };
}
// A custom From/To range replaces the month filter; an inverted range is ignored.
export function dateScope(month: string, from = "", to = "") {
  const invalid = !!from && !!to && from > to;
  const custom = !invalid && !!(from || to);
  return {
    month: custom ? "all" : month,
    from: custom ? from : "",
    to: custom ? to : "",
    custom,
    invalid,
  };
}
export type Filters = {
  query: string;
  category: string;
  month: string;
  status: string;
  type: string;
  sort: string;
  from?: string;
  to?: string;
  minimum?: string;
};
export function filterTransactions(
  transactions: Transaction[],
  filters: Filters,
) {
  const q = filters.query.trim().toLocaleLowerCase();
  return transactions
    .filter(
      (t) =>
        (filters.month === "all" || t.date.startsWith(filters.month)) &&
        (filters.category === "all" || t.category === filters.category) &&
        (filters.status === "all" || t.status === filters.status) &&
        (filters.type === "all" ||
          (filters.type === "income" ? t.amount > 0 : t.amount < 0)) &&
        (!q ||
          `${t.name} ${t.description} ${t.category}`
            .toLocaleLowerCase()
            .includes(q)) &&
        (!filters.from || t.date >= filters.from) &&
        (!filters.to || t.date <= filters.to) &&
        (!filters.minimum ||
          Math.abs(t.amount) >= Number(filters.minimum) * 100),
    )
    .sort((a, b) => {
      if (filters.sort === "amount-desc") return b.amount - a.amount;
      if (filters.sort === "amount-asc") return a.amount - b.amount;
      return filters.sort === "date-asc"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });
}
export type TransactionForm = {
  name: string;
  description: string;
  amount: string;
  date: string;
  category: string;
  type: string;
  status: string;
};
export function validateTransaction(form: TransactionForm) {
  const errors: Partial<Record<keyof TransactionForm, string>> = {};
  if (!form.name.trim() || form.name.trim().length > 80)
    errors.name = "Enter a name between 1 and 80 characters.";
  if (
    !/^\d+(\.\d{1,2})?$/.test(form.amount) ||
    Number(form.amount) <= 0 ||
    Number(form.amount) > 10000000
  )
    errors.amount =
      "Enter an amount from €0.01 to €10,000,000 with up to 2 decimals.";
  const parsed = new Date(`${form.date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(form.date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== form.date
  )
    errors.date = "Choose a valid date.";
  else if (form.date < MIN_DATE || form.date > DEMO_DATE)
    errors.date = `Choose a date between ${displayDate(MIN_DATE)} and ${displayDate(DEMO_DATE)}.`;
  if (
    !categories.includes(form.category as Category) ||
    (form.type === "income") !== (form.category === "Income")
  )
    errors.category = "Choose a category matching the transaction type.";
  if (!["income", "expense"].includes(form.type))
    errors.type = "Choose income or expense.";
  if (!["Completed", "Pending"].includes(form.status))
    errors.status = "Choose a valid status.";
  if (form.description.length > 120)
    errors.description = "Use 120 characters or fewer.";
  return errors;
}
export type StoredData = {
  version: 1;
  created: Transaction[];
  deletedIds: string[];
};
export const emptyStore = (): StoredData => ({
  version: 1,
  created: [],
  deletedIds: [],
});
function storedTransaction(value: unknown, ids: Set<string>) {
  if (typeof value !== "object" || value === null) return null;
  const t = value as Partial<Transaction>;
  if (
    typeof t.id !== "string" ||
    !t.id ||
    ids.has(t.id) ||
    seedTransactions.some((s) => s.id === t.id) ||
    typeof t.amount !== "number" ||
    !Number.isSafeInteger(t.amount) ||
    t.amount === 0 ||
    typeof t.name !== "string" ||
    typeof t.description !== "string" ||
    typeof t.date !== "string" ||
    typeof t.category !== "string" ||
    typeof t.status !== "string" ||
    Object.keys(
      validateTransaction({
        name: t.name,
        description: t.description,
        date: t.date,
        category: t.category,
        status: t.status,
        amount: String(Math.abs(t.amount) / 100),
        type: t.amount > 0 ? "income" : "expense",
      }),
    ).length
  )
    return null;
  ids.add(t.id);
  const { id, name, description, date, category, amount, status } =
    t as Transaction;
  return { id, name, description, date, category, amount, status };
}
// Invalid records are skipped one by one so a single bad entry never erases the rest.
export function readStore(raw: string | null): {
  data: StoredData;
  discarded: number;
  reset: boolean;
} {
  if (!raw) return { data: emptyStore(), discarded: 0, reset: false };
  let data: Partial<StoredData>;
  try {
    data = JSON.parse(raw);
  } catch {
    return { data: emptyStore(), discarded: 0, reset: true };
  }
  if (
    typeof data !== "object" ||
    data === null ||
    data.version !== 1 ||
    !Array.isArray(data.created) ||
    !Array.isArray(data.deletedIds)
  )
    return { data: emptyStore(), discarded: 0, reset: true };
  const ids = new Set<string>();
  const created = data.created
    .map((t) => storedTransaction(t, ids))
    .filter((t): t is Transaction => t !== null);
  const deletedIds = [
    ...new Set(
      data.deletedIds.filter(
        (id): id is string => typeof id === "string" && !!id,
      ),
    ),
  ];
  return {
    data: { version: 1, created, deletedIds },
    discarded:
      data.created.length -
      created.length +
      data.deletedIds.filter((id) => typeof id !== "string" || !id).length,
    reset: false,
  };
}
export const parseStore = (raw: string | null) => readStore(raw).data;
export function csvCell(value: string | number) {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r\n]/.test(text))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob(
    ["\uFEFF", rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportTransactions(transactions: Transaction[]) {
  downloadCsv("northstar-demo-transactions.csv", [
    ["Portfolio demonstration — fictional transactions"],
    [
      "Transaction",
      "Description",
      "Date",
      "Category",
      "Status",
      "Amount (EUR)",
    ],
    ...transactions.map((t) => [
      t.name,
      t.description,
      t.date,
      t.category,
      t.status,
      t.amount / 100,
    ]),
  ]);
}
