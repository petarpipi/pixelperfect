# PixelPerfect — Northstar Finance

An independent React and TypeScript portfolio demonstration implementing the supplied Northstar Finance Figma exports as a working, responsive interface.

**Status:** local implementation. No deployment, bank connection, authentication, or real payment processing. All financial data and account identities are fictional.

## Local preview

Requirements: Node.js 22.12+ and pnpm 11.25.0 (the project was checked with Node.js 24).

```powershell

pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:5174/**. The strict port keeps this project separate from FixLab. Stop the server with Ctrl+C when finished.

| Page                 | Local route     |
| -------------------- | --------------- |
| Overview / Dashboard | `/`             |
| Transactions         | `/transactions` |
| Analytics            | `/analytics`    |

## Features

- Desktop workspace navigation and responsive bottom navigation.
- Interactive cash flow, income/expense, category and comparison charts.
- Transaction search, type/category/status/month filters and custom date/amount filters.
- Date and signed amount sorting, pagination, row details and selection.
- Validated add-transaction dialog; delete one or several demo transactions.
- Financial metrics, comparisons, charts and category totals calculated from transaction data.
- Browser-local persistence for added transactions and deleted demo entries.
- Filtered CSV export and a downloadable analytics CSV report.
- Loading, empty and missing-route states; keyboard focus and accessible dialogs.
- Explicit portfolio demonstration labels and fictional account information.

## Technology

React, TypeScript, Vite, Tailwind CSS (Vite plugin), React Router, Recharts, Lucide React, locally bundled Inter, Vitest, Playwright and axe-core.

## Design references

The implementation follows four supplied PNG design exports for the fictional Northstar Finance interface:

| Export in `docs/reference/` | Original frame | Size       |
| --------------------------- | -------------- | ---------- |
| `01 Desktop Dashboard.png`  | `2:23801`      | 1440 × 900 |
| `02 Transactions.png`       | `2:24067`      | 1440 × 900 |
| `03 Analytics.png`          | `2:24330`      | 1440 × 900 |
| `04 Mobile Dashboard.png`   | `2:24565`      | 390 × 844  |

These PNGs are documentation only. They are never imported into the app, served as page backgrounds, or used as replacement UI. No separate Design System export or SVG assets were supplied. Colors and dimensions were sampled from the PNGs; Inter and Lucide icons reproduce the visible typography and icon treatment. Source font metadata, exact vector paths and Figma component variants cannot be confirmed from raster exports.

Reusable code components include the app shell, metric cards, chart cards, date/category controls, transaction icons, status badges, dialogs, and loading/empty states. Responsive adaptations of Transactions and Analytics follow the supplied mobile Dashboard treatment.

Additional original SVG/PNG assets can be placed in `docs/reference/assets/`; Design System exports can be placed in `docs/reference/design-system/`. Original supplied screens remain unchanged in `docs/reference/`.

## Verification

```powershell
pnpm typecheck
pnpm build
pnpm test
pnpm test:e2e
```

On Windows, browser tests use installed Microsoft Edge. Other platforms use Playwright Chromium (`pnpm exec playwright install chromium`). To choose an existing Chromium executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Browser coverage includes 375, 390, 768, 1024 and 1440px layouts, plus regression tests for every issue fixed in [AUDIT_REPORT.md](AUDIT_REPORT.md). Test screenshots are attached to the ignored `test-results/` and `playwright-report/` directories; test runs never modify the documentation images. See [QA notes](docs/QA.md) for visual verification limits.

To deliberately refresh the documentation screenshots, with the development server running:

```powershell
$env:UPDATE_DOCS_SCREENSHOTS = "1"; pnpm exec playwright test tests/responsive.spec.ts; Remove-Item Env:UPDATE_DOCS_SCREENSHOTS
node scripts/capture.mjs
```

`pnpm preview` serves the production build with the same security headers as `vercel.json`.

Optional raw reference comparison (Python and Pillow required): `python scripts/compare-references.py`. Raw image differences include browser font rasterization and are not a pixel-perfect certification.

## Demo data and storage

October 2026 is the initial selected period, matching the screenshots. It contains 128 transactions, including two income entries. Initial income is €8,500, expenses €3,240 and net cash flow €5,260. The initial balance is €48,562 and the calculated savings rate rounds to 61.9%.

Amounts use integer euro cents. Monthly metrics include both completed and pending entries, matching the displayed demo totals. May–September history supplies the six-month charts. Opening balance is separate from the demo ledger. In an empty period, income-based savings is shown as 0% rather than dividing by zero.

Only user additions and deleted seed IDs are persisted under `pixelperfect:northstar:v1`. Invalid stored records are skipped individually (with a notice), so one bad entry never erases the others; unreadable or incompatible data falls back to the original demo. Clear that key in browser developer tools to restore the initial dataset. Storage failures keep the current visit usable and display a notice.

The greeting, date and account-sync copy reproduce the reference state. They do not represent live banking. October 31, 2026 is the demo's "today": new entries can be dated from January 1, 2000 up to that day. The iOS status bar and home indicator in the mobile reference are device chrome and are not drawn by the app; safe-area insets leave room for the real ones.

## Project layout

```text
src/
  components/      Shell, reusable controls, metrics, charts and dialogs
  lib/             Fictional ledger, calculations, persistence and tests
  pages/           Dashboard, Transactions, Analytics
  styles/          Screenshot-derived theme and responsive layout
tests/             Browser behavior, responsive and axe checks
docs/reference/    Unmodified user-provided Figma PNG exports
docs/screenshots/  Rendered application captures
scripts/           Local capture and optional image comparison
```

See [implementation notes](docs/IMPLEMENTATION.md) and [Upwork portfolio copy](docs/PORTFOLIO.md).

## GitHub and Cloudflare Pages

Prepared as the standalone **pixelperfect** repository. Run all commands from the cloned repository root. The package name is `pixelperfect-northstar`; it is an internal package identifier. `private: true` prevents accidental npm publication and does not make a GitHub repository private.

| Setting | Value |
| --- | --- |
| Framework | React, TypeScript, React Router and Vite |
| Package manager | pnpm 11.25.0 |
| Verified Node.js | 24.22.1 |
| Build command | `pnpm install --frozen-lockfile && pnpm run build` |
| Build output | `dist` |
| Root directory | Leave empty (repository root) |
| Required application secrets | None |

The existing `build` package script also works with `npm run build` after dependencies are installed; pnpm is used for reproducible installation from the committed lockfile. See [CLOUDFLARE_PAGES.md](CLOUDFLARE_PAGES.md) for the build environment and connection instructions.

This repository is a frontend portfolio demonstration. No hosting deployment is performed by these preparation steps.
