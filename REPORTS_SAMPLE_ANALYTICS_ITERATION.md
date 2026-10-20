# TPM sample analytics — continuation of original preview

**Implemented:** October 20, 2026  
**Preview:** `overview-ops.html?view=reports`

## Intent

This is **the original TPM preview** with the same dark-plum navigation, header, tabs, and shared `tabPanel` cards. The Reports directory and all 12 report pages are routed through `overview-ops.html`. No standalone new look and feel is introduced.

The preview now contains a **deterministic fictional dataset** in `reports-demo-data.js` and interactive presentation in `reports-demo-ui.js` / `reports-demo-analytics.css`.

- 2,628 fictional mill/day rows, January 1, 2025 through October 19, 2026.
- Four mills, eight example employee/inspector names, seven fabricated customer names.
- Sample data fields: mill production, inspections, passed/failed checks, scrap tube counts, scrap events, lost LF, mesh LF, setup/run/idle hours, jobs/shipments/late shipments, coil receipts and received pounds, audit counts, training examples and sample prices.
- These are deliberately **not TPM production records or copied real customer/employee data**.
- The dataset is reproducible (seeded); every visual and detail record uses the same filtered dataset.
- No network calls, database writes, permission bypasses or PDF/CSV exports.

## Working controls

Each report offers its own realistic question presets, plus:

1. **Day by day:** last 14 complete calendar-day buckets.
2. **Week by week:** last 12 complete Monday–Sunday weeks.
3. **Month by month:** last 12 completed calendar months.
4. **Quarter by quarter:** last six completed calendar quarters.
5. **Earlier / Later** moves the date window through synthetic history.
6. **Mill + employee/inspector filters**, including inclusive matches on assigned worker or inspector.
7. Question-specific **current vs previous period** comparison, window total and underlying filtered sample counts.
8. **Clickable chart bars** that drill down to a selected period.
9. **Breakdown by mill or person** calculated from the same filtered rows.
10. Searchable, paginated source-like sample register with job, customer, mill, operator and inspector context.
11. Directory shop pulse for quick context; Reports and department pages stay in the same app shell.

## Questions by team

| Department / report | Example questions |
| --- | --- |
| Order desk / Order History | How many orders shipped? Are they on time? Is workload increasing? |
| Production / Mill Performance | Which mills produced most? Is run time increasing? Which loses the most steel footage? |
| Mill leads / Shop Timing | Where is idle time increasing? How much time is running vs setup? |
| Quality / Scrap Events | Are scrap incidents rising? How many distinct tubes? Where is footage lost? |
| Quality / Tube Scrap | What is lost LF, example LF loss rate or scrapped-tube count? |
| Mesh / Mesh Scrap | What sample mesh footage was lost? |
| People / Employee Report | Who was credited with production? What run time? What scrap association? |
| Inspection | Is first-pass yield improving? How many passes and fails? |
| Training | How many example entries? How is production activity distributed? |
| Receiving / Steel Receive | How many receipts? How many pounds received? |
| Auditing | How many example checks? What receiving volume? |
| Pricing | How is fictional weighted unit price trending? |

## Critical interpretation boundaries

- **No computed demo metric replaces an official Laravel metric.** These examples show desired UI and interactions only.
- The **illustrative footage loss rate** in the demo is lost LF / fictional produced LF; it is **NOT** the historic `Tube Scrap Summary` legacy feet-rate formula (Q50). Preserve the actual backend definition.
- Scrap *events*, *distinct scrapped tubes*, *scrap footage*, and *mesh loss* have different units and denominators.
- **Running, attended, elapsed and idle** have distinct production service definitions. The demo summarizes synthetic run/idle/setup hours. It does not simulate historical `MillTimeService` thresholds, break intervals, or future Conroe shift-calendar rules.
- Mill attribution in actual reports must be based on tube-production source credit, not the current order-mill assignment.
- Training examples are **not proof of training certification**, employee assignment alone is not tube production credit, and sample employee/inspector names are fictional.
- Receiving quantities do not prove allocation or consumption.
- Do not infer report permissions from the static preview; actual `Reports.vue` retains its `isAdmin` gating, employee lookup, and report route validation.

## Real Laravel + Vue Composition API merge

Keep the existing Vue 3 `<script setup>` source components, APIs, authorization, and report calculations. Replace these offline demonstration fixtures with server responses **only after** mapping each report's accepted filters, response shape, error states and export contract.

Suggested small presentation components:

- `ReportQuestionPicker.vue`
- `ReportPeriodSelector.vue`
- `ReportKpiGrid.vue`
- `ReportTrendChart.vue`
- `ReportBreakdownTable.vue`
- `ReportRecordTable.vue`

Use `ref` for selected report filters and `computed` for presentation state. In production, only backend-confirmed metric definitions and filtering should populate the chart and comparison. Keep existing server pagination, retries, CSV/Excel/Print and 10,000-tube History lazy loading.

## QA completed

- Parsed and rendered all 12 report types against the deterministic sample data.
- Confirmed 2,628 rows, four mills, eight staff names, and all four period generators (14 daily, 12 weekly, 12 monthly, six quarterly buckets).
- Checked data aggregation equals the source row sum.
- Live browser QA on published GitHub Pages confirmed:
  - Original plum sidebar maintained.
  - 12 weekly bars and 12 monthly bars; six quarterly bars; 14 daily bars.
  - Selecting question changes metric and detailed table.
  - Selecting Aug 2026 bar changes period and detail rows.
  - Mill and person filters narrow counts, and Steel Receive loads its material-specific question with records.
- Mobile-specific browser QA timed out and should be repeated before declaring breakpoint parity.
- A successful GitHub Pages deployment validates static publishing, **not** parity with live Laravel queries or exports.
