# Quality assurance

Verified locally on 25 October 2026. This report describes checks actually run against the implementation; it is not a pixel-perfect certification.

## Automated results

| Check                                                         | Result                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`                                              | Passed                                                                                                                   |
| `pnpm build`                                                  | Passed; production assets generated in `dist/`                                                                           |
| `pnpm test`                                                   | 17 / 17 unit tests passed (v1.1)                                                                                         |
| `pnpm test:e2e`                                               | 48 passed, 1 mobile-only check skipped on desktop by design (v1.1, includes `tests/regression.spec.ts`)                  |
| Production build under CSP (`pnpm preview`)                   | No Content-Security-Policy violations or console errors on the three routes                                              |
| axe-core checks                                               | No violations of the selected WCAG 2 A/AA and WCAG 2.1 AA rules on the three routes at five widths, or in the add dialog |
| Browser runtime exceptions during route checks                | None                                                                                                                     |
| Horizontal overflow                                           | None at 375, 390, 768, 1024 or 1440px                                                                                    |

Browser execution used Microsoft Edge's Chromium engine on Windows. Firefox, Safari and actual physical devices were not tested. Automated accessibility checks do not replace manual assistive-technology evaluation.

Version 1.1 fixes every HIGH and MEDIUM finding from the independent audit plus the LOW findings selected for release (L-1 to L-5, L-12, L-16); see [AUDIT_REPORT.md](../AUDIT_REPORT.md) for details and regression coverage.

Functional coverage includes navigation, combined search/category/status filters, month and custom date filters, empty state recovery, signed amount sorting, pagination, validation messages, creation, localStorage reload persistence, deletion, metric recalculation, CSV download, dialog accessibility/focus restoration, and chart interaction with pointer and touch input.

The tests exposed and led to fixes for negative-zero empty totals, dialog focus restoration, input accessible names changing with validation messages, and small color contrast failures. Hidden desktop charts no longer mount in the mobile dashboard. Production route splitting removes the initial oversized single-bundle warning.

## Visual verification

All four original PNG exports were opened and compared with rendered screenshots at their exact original dimensions. SHA-256 checks confirm the saved references are unchanged copies of the supplied files.

The primary screenshots are:

- `screenshots/dashboard-desktop-1440.png`
- `screenshots/dashboard-desktop-tooltip.png` (the reference's hover state)
- `screenshots/transactions-desktop-1440.png`
- `screenshots/analytics-desktop-1440.png`
- `screenshots/dashboard-mobile-390.png`

Additional route screenshots cover the remaining requested widths. Measured application element bounds are recorded in `screenshots/measurements.json`.

The desktop Overview metric cards start at x=248, 542, 836 and 1130, y=192, with dimensions 278 × 120px. The main chart row starts at y=336 with approximately 736 × 272px and 400 × 272px cards; the lower cards begin at y=632 and are 244px high. The Transactions panel is 1160 × 684px at x=248, y=192. These match the principal reference geometry.

Visual corrections included sampled surface/accent/border colors, mobile metric controls, table column widths and row heights, chart bar spacing, comparison chart scale, metric number baselines, the mobile recent-transactions heading and row spacing, and sidebar footer alignment.

The optional image-comparison script records raw mean RGB differences in `screenshots/reference-comparison.json`. This includes text antialiasing, vector/icon rendering, chart details and hover-state differences. It is deliberately not presented as an accuracy percentage or a pass/fail threshold.

## Remaining fidelity limits

Only the four raster exports were available. The separate Design System page, original SVG assets, exact font metadata, hidden states and chart source values were not supplied. Inter and Lucide provide close visual matches; the Northstar mark is recreated as a small vector. Some glyph rasterization, icon geometry, chart tick placement and historical chart details differ. Minor muted-text/initials colors were adjusted for contrast.

Transactions and Analytics at mobile widths, and all modal/filter/detail states, consistently extend the supplied design but have no separate original frame for direct comparison. Historical entries are fictional data chosen to reproduce the visible trends and exact October totals. No assertion of absolute pixel identity is made.

## Delivery checks

- Original PNG references remain documentation assets, never application backgrounds or replacement interfaces.
- FixLab has no tracked changes; its pre-existing untracked local folder was left untouched.
- Vercel configuration is prepared only. No deployment, GitHub push, hosted project creation or online publication occurred.
- The development server is local and uses port 5174.
