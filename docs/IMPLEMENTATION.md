# Implementation notes

## Source and reconstruction

The four user-provided Figma PNGs are the visual reference. The MCP connection could list page names, but its read quota prevented inspecting screen layers or the component library. This implementation does not claim that Figma variables or Code Connect mappings were extracted.

Measured reference colors include `#f8f9fb` for the page background, `#ffffff` for surfaces, `#e9ebf1` for borders, `#5357d8` for the main accent, `#eeeefc` for pale accent fills and `#171b26` for primary text. Muted copy and avatar initials receive very small contrast adjustments to pass automated WCAG AA checks.

Desktop: 216px sidebar, 88px top bar, 32px horizontal content padding, 16px metric gaps and 24px card-grid gaps. Overview metric cards are 120px tall; Analytics metrics are 104px. The desktop card columns follow the original 736px / 400px split at 1440px.

Mobile: 390px source width, 20px content gutters, 110px balance card, 96px secondary metrics, 174px cash-flow card and 76px bottom navigation. The supplementary desktop bar and donut cards are omitted on mobile as in the supplied frame. Mobile Transactions and Analytics are consistent adaptations; they have no separate supplied Figma reference.

Inter is bundled locally. Icons use individual Lucide exports; the Northstar mark is a small inline vector recreated from the visible four-point star. Supplied screenshots are not executable assets. Exact source typography and icon paths require the unavailable Design System or SVG exports.

## Structure and state

React Router owns `/`, `/transactions`, `/analytics` and the missing-route fallback. Page modules are loaded separately. The shared shell contains desktop/mobile navigation and informational demo dialogs for the visible Accounts, Settings, Help, profile, workspace and notification controls.

FinanceProvider owns browser-local edits and the selected month. The immutable seed ledger contains 128 October entries plus monthly history. Stored data is versioned and validated before use. Added records and deleted seed IDs are stored separately, avoiding persistence of the entire seed dataset.

All financial amounts use integer cents. Totals, category splits, savings rates, month-over-month changes and chart series derive from the current ledger. Filters and sorting are pure functions. The reference's pending ARKET expense is included in total expenses; this is an explicit demo accounting convention.

## Interaction and accessibility

Native select controls have visible or screen-reader labels. Tables retain semantic headers and announce the active sort. Row selection, pagination, type controls and action buttons expose their current state. Native modal dialogs provide focus containment, Escape dismissal and focus restoration. Form validation associates messages with invalid inputs. The modal's type switch enforces compatible expense/income categories.

Charts are real Recharts SVGs with tooltips and descriptive accessible labels. Small comparison charts scale to their own data range. Mobile-only chart omission avoids measuring display:none containers. Reduced-motion preference disables UI animation.

CSV text is quoted and formula-like strings are neutralized. No networking, credentials, financial APIs or external fonts are used at runtime. The analytics report is CSV, not a PDF.

## Scope limits

This is a fictional portfolio demonstration. There is no live bank connection, sign-in, payment flow, backend or synchronization between devices. Values persist only in the current browser's origin. Changing the preview origin (for example, from 127.0.0.1 to localhost) uses separate browser storage.

Raster references cannot reveal hidden interaction states. Modals, filtering states, detail views and other unpictured states extend the observed design language. The implementation was visually compared with the supplied exports; absolute pixel identity is not claimed.
