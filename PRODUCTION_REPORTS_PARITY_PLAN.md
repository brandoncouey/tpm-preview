# Production ↔ Reports: parity audit and implementation plan

**Date:** 2026-10-20
**Target preview:** `overview-ops.html?view=production&job=990100`
**Context:** User-supplied `TPM-Production-Questions-and-Reports.md` (20 Oct), real archived Laravel + Vue Reports implementation, and current `tpm-preview` source.
**Scope:** Read-only redesign of Production, no Laravel business logic mutation.

## Findings before the styling pass

1. **High — station filters did not filter the actual table rows.** `prodDeptSidebar` updates `prodState.stationView`, but `prodPeopleRows` and `prodStageRows` did not apply this field. Cards and heading changed while the row tables could still show other stations.
2. **High — demo rows selected by default.** `prodState.dataset='demo'` and `stageDataset='demo'`, with a preselected operator. The Production page opened with fabricated sessions / checkmarks, while source evidence was behind a selector. Not acceptable for the eventual production presentation.
3. **High — test-only selectors on the Production page.** Synthetic-scale datasets and the global Preview Tools status simulator create confusion with actual operations. Retain test harness code in preview but exclude from production-facing surface.
4. **Medium — cross-report interpretation not exposed.** Job-specific timing, shop-wide timing, scrap attempt rate, legacy footage rate, employee attribution, and mill attribution have distinct definitions. The preview needed explicit links and scoping to prevent contradictory interpretations.
5. **Medium — ring/weld/final inspection steps.** Mill/Cutoff/Inspection are primary production stations, but a ring/tack/final check may apply to some parts. **No source-backed checkpoint counts in the fixture**; render informational caveat, not fictitious statuses.
6. **Medium — sampled rows not totals.** The job has stage-level totals but only five sampled tube records. A missing sample checkpoint is not a failed or incomplete order.
7. **Not part of this view — real /reports.** In the user's archived Vue app, `pages/Reports.vue` is a report directory; the job report remains on the order job page. `ShopTimingPanel.vue`, `MillComparisonPanel.vue`, `ScrapExplorer.vue`, `InspectionReport.vue` and employee/detail views own their own APIs. Do not duplicate their aggregate data or claim this single-job fixture represents shop-wide metrics.

## Confirmed report contract (from user source and archived code)

| Area | Production view may show | Reports owner / nuance |
| --- | --- | --- |
| Job station totals | `history.stages[*].done` vs `job.quantity` | Counts must not be recomputed by summing fixture sample rows |
| Running time | `timing.run.active_seconds` | `MillTimeService.IDLE_GAP_MINUTES = 20`. Timestamp-derived gap sum, not manually logged work |
| Attended time | `timing.run.attended_seconds` | `MillTimeService.ATTENDED_GAP_MINUTES = 270`, overlaps running time; don't add them |
| Elapsed time | `timing.elapsed_seconds` | Wall-clock span, includes nights and inactive gaps; not runtime |
| Scrap events and loss | `scrap.totals` | Event count vs distinct tubes vs feet differ. Q50 keeps **legacy feet-rate headline in Tube Scrap Summary**; do not relabel job's tube-attempt rate as legacy rate |
| Mill attribution | Current job mill in `job.device` is assignment only | Mill Performance uses mill credited to each tube and historic mill assignments, not current job mill for all historical production |
| Inspection pass | Job inspection completions | Inspector Pass Rate report uses inspector-attributed pass and failed tube events, not the job's overall inspection count as a person's rate |
| Material | Selected allocated coil / mesh count | Allocated ≠ used; row count cannot support footage / shortage unless material-specific numeric source exists |

## Active decisions — do NOT bake into UI as enforced rules

- Q1: material check block point (assignment, first tube, warning, both).
- Q3: occupied-mill replacement vs refuse vs confirmation.
- Q14: missing gage/material blocks, warns, or permits.
- Q18: delayed same-number rework return vs immediate.
- Q22: missing mill/cutoff tolerance blocks or not.
- I2: Geo Form scrapped rings shouldn't count as good completed rings — still unresolved.
- I8: mesh PO/used-roll number validation; unanswered.
- I18: reusing old job number warn vs refuse.
- Q38/Q49: future **Conroe shift-calendar** timing and 20-min inactivity; do not pretend historical source data has shift-adjusted values.
- Q50: user chose legacy scrap feet rate as headline for Tube Scrap Summary.
- Q15/Q19/Q20/Q23/Q25/Q26/Q57/Q58: change requests require backend/real station validation, not front-end-only completion badges.

## Implementation sequence

### A. Fix data scope and remove demo-only UI from Production (this pass)
- Default to original fixture tube checks and employee sessions, all operators.
- Filter both row sources by selected station.
- Remove synthetic dataset pickers from production-facing record subviews.
- Exclude status simulator from Production screen. Retain original harness for internal test fixtures.

### B. Add scoped reporting context (this pass)
- Collapsible, compact job-level reporting crosswalk. Clearly distinguish running, attended, elapsed and scrap counts; explain non-additivity.
- Relevant navigation to existing *job-specific* Scrap, Materials, Report and History tabs; don't invent a public `/reports` mirror.
- Show report-owner explanations for Mill Performance, Shop Timing, Inspection Pass Rates, Scrap Analysis. They require other live API sources and cannot be generated from this one fixture.
- Clarify conditional ring/weld/final checks have **no supplied tube evidence**.

### C. Live app merge — future, requires source integration and runtime regression
- Vue 3 Composition API: preserve existing station/order data loaders and API response objects; presentation-only components.
- Mirror real `/reports` source definitions and filters; don't replace with the preview's static values.
- Keep real status/permission logic, manufacturing screens and material assignment untouched.
- Resolve source policy questions separately with production users before implementing hard block rules.
- Regression: station switch scopes counts and rows, filter + pagination + operator selection, no simulated rows, job report links, sample-record disclaimer, print, mobile/table overflow, and no change to job/source metrics.

## QA

Automated static JS compilation and published DOM/interaction checks should be run after deployment. A passing Pages deploy verifies only static publication, not real Laravel integration.
