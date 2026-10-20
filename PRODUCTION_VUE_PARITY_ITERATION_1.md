# TPM Production — GitHub Iteration 1: Source-aligned job progress

**Date:** 2026-10-20  
**Preview URL:** https://brandoncouey.github.io/tpm-preview/overview-ops.html?view=production&job=990100  
**Scope:** Static preview only. No changes to Laravel, database, APIs, permissions or shop-floor workflow.

## Goal

Bring the Production **presentation** into alignment with actual archived Vue 3 Composition API source without replacing its behavior.

### Actual Vue owners

| Application file | Real responsibility | New preview component | Migration requirement |
| --- | --- | --- | --- |
| `components/job/JobProductionTab.vue` | Loads `useJobHistory`, error/retry, required and optional stage grouping, timing and people | `production-vue-parity-v1.js` + CSS | Keep existing parent loaders, error states, optional-stage grouping and mounted component behavior |
| `components/JobTimingStrip.vue` | Elapsed, running, attended, setup, ramp-up and stops | `timingStrip()` | Preserve server elapsed-time base and 60-second client tick for running jobs, no parsing timezone-less dates in browser |
| `components/JobStageFunnel.vue` | Stage count/progress, explicit `applies:false` N/A, capped percentage bar, source start/end | `stagePanel()` | Preserve counts > quantity, clamp only graphic bar, show missing percent as unknown, optional stages collapsible |
| `components/JobPeopleList.vue` | Worker summary, individual credited tubes/scrap, per-department sessions, office-assigned-only workers | `workersSummary()` and improved operator cards | Keep all workers, distinguish assigned-only/no tubes, retain source credited totals |
| `components/job/JobHistoryTab.vue` + `JobTubeTables.vue` | Complete tube records, heavy history loaders, CSV/Excel/print | **No migration in this iteration** | Keep detailed table owner and lazy-load/export behaviors; Production explorer remains preview-only |
| `composables/useJobHistory.ts` | Deduped fetch at `/api/job-report/history?job=…`; shared per-job cache; reload | **No migration in static preview** | Must remain unchanged in real application |

### Committed preview behavior

1. Six job-level timing measures displayed **above** station progress, including source thresholds for running/attended and a definitions disclosure.
2. Applicability-aware stage funnel: **required** means `applies !== false`; `applies === false` goes into closed **Additional manufacturing stages** with N/A and **no** fraction/bar/remaining claim.
3. Source count (e.g., 398/50) is never truncated even if `percent > 100`; only graphic width caps at 100% and label follows actual Vue behavior (`>100%`).
4. Stage cards link to existing station filters. Sidebar shows only stages needing attention, with actual count not a hard-coded “3.”
5. Worker summary records total workers including attached-only, counted tube credits (not distinct tubes), sessions and worker-attributed scrap. Attached-only cards explicitly say no tube production.
6. The source-dataset default stays on original sampled rows, with demo selectors and simulator absent in Production.
7. Separate reporting crosswalk discusses scrap event count versus distinct tubes, steel vs mesh LF, and attribution limitations.
8. Job tabs and existing source records remain available.

### Intentional omissions

- Static fixture only has three stage objects: Mill, Cutoff, Inspection. **There are no optional stage objects in the fixture**. So optional-stage UI is supported and verified with synthetic **unit inputs**, but no optional stage is invented for sample job #990100.
- Actual Vue `JobTimingStrip` elapsed seconds **ticks once a minute** while work is open. The frozen GitHub Pages fixture does not and must not claim live time.
- The preview's worker breakdown is summarized; it does not replace all session tables in `JobPeopleList.vue`.
- No backend enforcement added for material approval timing, occupied mill replacement, missing specifications, ring rework, other open Q/I decisions.
- `Shop Timing` and `Mill Performance` are **shop-wide Reports** with separate API owners. They are not reconstructed from this single-job fixture.

### Acceptance tests

| Case | Expected |
| --- | --- |
| Initial `?view=production&job=990100` | six timing cells, three real source stage cards, worker summary; stage table defaults to original fixture |
| Select Mill stage card | `Mill` selected, both tube and session views scoped to Mill |
| Select Cutoff / Inspection | counts, operator cards, and recorded table rows scoped to selected work center |
| Select all stations | stage table returns original 15 check rows; original sessions return 7 rows |
| Source stage with `applies:false` | hidden under closed optional disclosure and shows N/A only |
| Source `percent:796, done:398, quantity:50` | card shows 398/50, percent label >100%, graphic width 100% |
| Source null stage `percent` | no fabricated percentage; display — |
| Attached-only worker with no departments | worker card stays visible, does not claim tube production, no JavaScript error |
| Job timing `setup.changeover_seconds === null` | render missing value rather than zero |
| Production → Job report/Scrap/Materials/History | existing job tabs and URL context preserved |
| Return to Production | no altered job, station, employee, scrap or materials data |
| Live Vue merge | preserve `useJobHistory` caching/reload, optional applicability, timezone-safe elapsed ticking and full History exports |

### Test coverage and limits

- Preview source JavaScript parsed successfully; stage-model executable assertions cover optional applicability, overproduction, unknown percent and normal progress.
- Static GitHub Pages publication verifies the page; it is not a substitute for Laravel integration tests.
- Follow-up real app test should use existing `JobStageFunnel`, `JobTimingStrip`, `JobPeopleList`, `JobProductionTab` component tests rather than rewriting APIs.

## Next iteration

Expand History styling with **source-owned complete activity** and all existing export controls, then begin the separate real `/reports` directory. No copy of production application code has been written to the preview repository.
