# TPM History and Reports — Iterations 2 & 3

**Date:** 2026-10-20  
**Preview:** [History job #990100](https://brandoncouey.github.io/tpm-preview/overview-ops.html?view=history&job=990100) · [Reports directory](https://brandoncouey.github.io/tpm-preview/reports-preview.html)

## Scope and evidence

These are **GitHub Pages styling/functionality prototypes** based on the real Laravel + Vue Composition API archive (`Archive(1).zip`) and the `TPM-Production-Questions-and-Reports.md` production audit. They do not modify the Laravel source, production database, report calculations, policies, or permissions.

### Real Vue component ownership

| Preview view | Production source owner | What must be kept in Vue |
| --- | --- | --- |
| History milestones | `resources/js/components/job/JobHistoryTab.vue`, `JobJourney.vue` | `/api/jobs/{job}/key-events`, status truthfulness, retry/loading states |
| History issue digest | `JobKeyEvents.vue` and `useJobKeyEvents` | Source grouping and exception counts; no synthetic "routine tube" events |
| Complete activity | `JobHistoryTab.vue`, `JobHistoryFeed.vue`, `useJobHistory.ts` | **Lazy mount after click**, cached after collapse, real server history count and error states |
| All job tube tables | `JobTubeTables.vue` | **General information, Mesh timeline, Scrap timeline, Tube timeline**, pagination, CSV, Excel and Print from the original per-job endpoint |
| Reports hub | `resources/js/pages/Reports.vue` | Search old aliases, five category tabs, employee search picker, authorized PDF Generator, real SPA links, job number validation |
| Report destinations | Existing `OrderHistory.vue`, `MillComparisonPanel.vue`, `ShopTimingPanel.vue`, `ScrapExplorer.vue`, `InspectionReport.vue`, and other report pages | Their own loader/filter, calculations, date-range defaults, exports, role checks, and service responses remain untouched |

## Iteration 2 — History

GitHub files:
- `history-vue-parity-v2.js`
- `history-vue-parity-v2.css`
- `overview-ops.html` references

### UX changes

1. Use the common white/gray/plum TPM style and descriptive headings.
2. Surface lifecycle milestones as the primary progression. Pending stages remain **pending**, not falsely completed.
3. Group notable events and scrap into a searchable digest with event-type filters. Keep group counts distinct from individual tube or scrap counts.
4. Hide detailed activity behind an explicit **View complete activity** button for the design preview, following the real Vue hierarchy.
5. Preview the four existing detailed-table sections without pretending the snapshot includes the complete live database. A separate source worker-session sample is shown only on expansion.
6. **No fabricated CSV/Excel/Print implementation.** Real exports remain on `JobTubeTables.vue` and must not be moved or deleted.
7. Explicitly show absent mesh processing timing instead of interpreting allocated roll count as a completed timeline.
8. Keep shortcuts to Production, Scrap, Job Report, and the Reports directory.

### Tested

- Published History page renders source-only counts and doesn't expose status simulator / volume test selectors.
- Browser click of **View complete activity** revealed all four detailed sections and exactly **5 sampled tubes**.
- Event-type filter logic wired to the six source groups; extended interactive check timed out, so end-to-end filtering has not been conclusively confirmed in the browser.

## Iteration 3 — Reports directory

GitHub files:
- `reports-preview.html`
- `reports-hub-preview.js`
- `reports-hub-preview.css`
- Main preview shell's **Reports** sidebar now navigates to the new page.

### Functional layout

The standalone directory reproduces the existing **five categories + All reports**:

| Category | Actual destinations | Important distinction |
| --- | --- | --- |
| Jobs & orders | Order History | Named open/in-progress/shipped presets are links within one report, not separate copies |
| Production | Mill Performance, Shop Timing | Comparisons over time use real shop-wide services, not a single job fixture |
| Scrap | Scrap Events, Tube Scrap Summary, Mesh Scrap Summary | Different data and rate formulas; Q50 retains legacy feet rate headline in the Tube Scrap Summary |
| People | Employee Report, Inspection Pass Rates, Training Report | People need real employee identity and attribution; no fake picker |
| Printouts & lists | Steel Receive, Audit Report, Standard Prices | PDF Generator is admin-only and **intentionally omitted** from the public-facing directory prototype |

Actual links are prefixed with `http://localhost:8000`. This design preview does not load those pages or their data itself; the links open only if the user runs TPM locally.

Search follows the original Reports.vue "all terms in title / description / former names / category" behavior, and category tab counts reflect the current search results. Keyboard arrow/Home/End navigation is included. Job-number entry enforces numeric input and opens the real `/orders?job=…` path.

### Known source issue retained/flagged

`Reports.vue` exposes **In progress** and **Shipped** Order History presets with status-only URLs. Current archived `OrderHistory.vue` / controller validates additional narrowing for those statuses. Do not silently change the backend query contract during a styling merge; resolve this separately.

### Tested

- Published directory loads **12 non-admin report destinations** across 5 categories.
- Browser search `Mill Operator Reports` returns exactly **Order History (1)**.
- Browser selecting the Scrap category after clearing search displays **Scrap Events, Tube Scrap Summary and Mesh Scrap Summary** (3) and hides Order History.
- GitHub Pages deploy successful for latest refs. Existing Orders, Production, Materials, Scrap, Report and History remain in the preview.

## Safety and merge constraints

1. **No code deleting** existing components or business operations.
2. Keep `JobHistoryTab` disclosure and source `useJobHistory` caching (avoid huge eager data loads on 10,000-tube jobs).
3. Preserve real `JobTubeTables` four tables, pagination, CSV, Excel and Print actions and their tests.
4. Preserve all native Reports.vue query handling, route URLs, alias searching, category counts, employee lookups, isAdmin gating.
5. Retain original staff/time/scrap calculations in Laravel, not duplicate in JavaScript.
6. Do not interpret absent fixture timestamps as failed tests or absent work.
7. Preserve responsive mobile/table overflow and keyboard tab navigation.
8. Keep the separate individual **job Report tab** on Orders, not confuse it with the shop-wide Reports directory.
9. Audit all real report destinations individually before styling their own forms, charts, tables and filters; this iteration only covers the directory.

## Next iterations

- **Iteration 4:** History `JobTubeTables.vue` exact presentation with source-safe pagination and all four real sections (Vue integration design only, backend logic kept).
- **Iteration 5:** Report-specific UI concepts starting with Order History and Shop Timing; design first with current filters/queries as immutable contracts.
- **Iteration 6:** Scrap and Materials harmonization with the same shared components and station-appropriate priorities.

**Do not merge the static HTML/JS directly into production Vue.** Translate presentational structure into small `<script setup>` components and reuse the real composables, APIs and permissions in the TPM codebase.
