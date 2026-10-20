# TPM Report UX — Iterations 4–6

**Date:** 2026-10-20  
**Scope:** GitHub Pages source-aligned UX prototypes, not the Laravel production app.

## Where to review

- Job History, job #990100: `overview-ops.html?view=history&job=990100`
- Reports directory: `reports-preview.html`
- Report layouts: `report-workspace-preview.html?report=order-history`, `shop-timing`, `scrap-events`, `steel-receive`, `employee-report`

## Iteration 4 — History traceability

**Existing owner:** `resources/js/components/job/JobHistoryTab.vue`, `JobHistoryFeed.vue`, `JobTubeTables.vue`.

- Keeps lifecycle and grouped notable events above the opt-in Complete activity disclosure.
- Complete activity now links between worker sessions (Production), general job information (Order desk), mesh (Materials), scrap (Quality), and tubes (Shop floor).
- Source sample tube register now supports search, numeric-aware sorting (tube ID/coil), timestamp sorting, ascending/descending order, 10/25/50/100 page sizes, counts, Previous/Next and horizontal scrolling.
- The sample is source-only, and its total is explicitly **not** the live job's tube total.
- Still keeps real four tube-table sections, server pagination, History loading/errors/retry, lazy mounting, CSV/Excel/Print within the real Vue components. The preview does **not** implement those exports.
- No new materials timestamps, scrap totals or per-tube events were fabricated.

## Iteration 5 — Reports organized around users' work

**Existing owner:** `resources/js/pages/Reports.vue`.

- The 12 real non-admin report destinations and five source categories remain intact.
- Added a **suggested work area** filter: Order desk, Production, Quality, Materials, Supervisors, People & training. Reports may belong to more than one area.
- Work-area filtering is independent of authorization. The real isAdmin check and employee picker must remain intact.
- Category tabs and search results now respond to the work-area filter; existing legacy name search still works.
- Corrected the directory's saved views: keep the known Open orders link; do not promote the status-only In progress/Shipped links, as the archived controller requires additional narrowing for those requests.

## Iteration 6 — Department-specific report layouts

Five *presentation-only* views are now available:

| Preview layout | Real route | Primary users |
| --- | --- | --- |
| Order History | `/reports/order-history` | Order desk, supervisors |
| Shop Timing | `/reports/shop-timing` | Mill leads, supervisors, people |
| Scrap Events | `/mill-management/scrap?view=events` | Quality, production, supervisors |
| Steel Receive Report | `/reports/steel-receive` | Materials and receiving |
| Employee Report | `/reports/employee` | People and supervisors |

All five share the TPM graphite/plum/white design language, compact hero, team context, filter/control shell, accessible keyboard tabs, horizontal-table layout, empty state, plain-language definitions, and cross-links back to Reports.

**Important:** columns and filter shells are design proposals to be reconciled with the exact corresponding Vue source. The static pages deliberately show no fabricated database rows, aggregates, employee IDs, or export behavior. Their selectors do not apply server filters; live-link buttons take users to their actual local TPM routes.

### Report definitions to preserve

1. Shop Timing: 20-minute idle and 270-minute attended gap rules from the current `MillTimeService`; attended overlaps run; elapsed is wall time, not work time.
2. Scrap: event count, distinct tubes, footage/weight loss, and scrap rates are different denominators. Keep the legacy feet-rate headline for Q50 Tube Scrap Summary (not Scrap Events).
3. Order History: current assigned mill does not override historical tube-level mill attribution; avoid invalid status-only query presets.
4. Receiving: received, allocated and consumed material are three distinct records. Do not infer mesh processing timestamps from roll allocation.
5. Employee: use recorded worker/tube attribution; assignment alone is not evidence of performed work.
6. Authorization: preserve the live PDF Generator admin check, server-provided employee IDs and all query/service validations.

## Merge guidance — Laravel + Vue 3 Composition API

1. Keep each production Vue page and current API/composable as the **data owner**; transplant only presentational structure/styles and aria labels.
2. Use small `<script setup>` components (entry-level maintainable): `ReportHero.vue`, `ReportFilterBar.vue`, `ReportTable.vue`, `ReportEmptyState.vue` and department-specific content wrappers. Prefer props/emits over HTML string interpolation.
3. For the directory, create a derived `computed` report list filtered by department + search text; filter the actual `Reports.vue` catalog rather than manually recreating definitions from this preview.
4. For complete History, continue existing lazy mounting and caching. Wire sorting/search/page inputs to actual `JobTubeTables.vue` state and server data. Never use sample fixture counts for live totals.
5. Keep actual loading, authorization, retry, empty, sorting, pagination and CSV/Excel/Print code intact. Proposed filter labels must be checked against the real API's supported values before binding.
6. No new backend query statuses, permission changes or scrap/timing calculations in presentation code.

### Suggested Composition API pattern (pseudocode)

```vue
<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  reports: { type: Array, required: true },
})
const search = ref('')
const workArea = ref('all')
const visibleReports = computed(() => props.reports.filter((report) => {
  const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const text = [report.title, report.description, ...(report.formerNames ?? [])].join(' ').toLowerCase()
  const matchesArea = workArea.value === 'all' || (report.workAreas ?? []).includes(workArea.value)
  return matchesArea && terms.every((term) => text.includes(term))
}))
</script>
```

This pattern does **not** replace `Reports.vue`'s category keyboard handling or access rules.

## Smoke tests done

- JS syntax parse for directory, five report layouts and History enhancement.
- DOM shim: 12 report destinations, seven work-area choices, five layout links.
- Legacy keyword `Mill Operator Reports` filters to **Order History**; Quality area matches five relevant report destinations.
- All five report layouts render distinct source-safe table column shells, tabs and explicit unconnected-data states.
- History with 24 test-only source rows renders three pages at 10 rows/page; source snapshot data remains untouched in the repository.

## QA still required before real TPM merge

- Browser screenshots at large desktop, tablet and small phone breakpoints.
- Validate real `Reports.vue`, `OrderHistory.vue`, `ShopTimingPanel.vue`, `ScrapExplorer.vue`, `JobTubeTables.vue` interfaces one-by-one with real runtime data.
- Test filters against authorized backend APIs, pagination at 10,000+ tubes, router back/forward, empty/loading/errors, and export golden tests.
- Confirm published Pages deployment. A green Pages build validates static hosting only, **not** the Laravel integration.

## Next iteration

Complete direct source-to-UI parity for the five real report pages, resolving actual filter names/data fields from the Laravel/Vue code before any production merge. Then harmonize Materials, Scrap and Inspection around the same reusable visual components without changing their distinct workflows.
