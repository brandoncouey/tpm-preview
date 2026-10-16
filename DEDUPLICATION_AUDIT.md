# TPM Job #990100 — Deduplication audit

Scope: static GitHub Pages prototype only. Real TPM Laravel/Vue data, API operations, and production records were not changed. Generated scale-test records remain fictional and excluded from real job totals.

| Tab | Removed redundant presentation | Preserved / primary source of detail |
|---|---|---|
| **Overview** | Repeated inspection KPI and footer count; second scrap summary; cloned Scrap log; quick links that duplicated global tabs; section-summary values repeated from header and fields | Three distinct operational metrics, stage progress, all **26 editable Order Record fields**, all editing and status actions, notes, collapsed specifications |
| **Production** | Repeated source-record KPI strip and duplicate scale-test notices | Stage cards; operator contribution cards; **108 mock operator sessions**, **96 mock tube-stage checks**, original records; filters, pagination, drill-down; stage fields `mill_check`, `cutoff_check`, `insp_check` |
| **Scrap** | Second totals strip and embedded History activity register | **One** searchable Scrap record table with original source and **48 mock** entries; scrap count, distinct tubes, steel and mesh loss; correct source fixture mesh-loss value **12.5 LF** |
| **Materials** | Allocated-stock tables repeated under the main allocator; process count strip; second set of usage history tables and a duplicate mock history appendix; repeated top LF totals | Steel/Mesh shared allocator, search/filter/sort, batch allocation/deallocation, view/edit state, one read-only paginated usage register per selected material type (**45 mock coils / 40 mock mesh rolls**, original first), collapsed tube-to-coil linkage (**75 mock traces**), additional weight fields |
| **Job Report** | Second set of summary KPIs; repeated job identity heading; duplicate full production/scrap/material searchable registers | One consolidated **printable** report of job/order/timing/specification/material summary data, Print action, links to authoritative detail registers |
| **History** | Second milestone/group KPI strip and duplicated Scrap register | Five original milestone records and **one** paginated searchable event group register (**72 mock / six original**) |

## Canonical locations

- Job identity, commercial details, lifecycle dates, assignments, notes, part and setup specs: **Overview**. The Job Report intentionally repeats selected field-level information for printing.
- Production stations, employees, sessions, tube-stage check states and timestamps: **Production**. A recorded stage check does not mean quality pass/fail.
- Scrap cause/reason, event/tube counts and losses: **Scrap**.
- Steel/mesh allocation, consumption records and source-coil linkage: **Materials**. Allocated stock is not equivalent to used material; finished-tube LF is not necessarily raw coil LF consumed.
- Job milestones and grouped work activity: **History**.
- Printable cross-section summary without cloned detail registers: **Job Report**.

## Regression checks

- All six tabs tested at 1440 px and 390 px: no horizontal page overflow and no JavaScript errors.
- All 26 Overview data fields remained present; editing modal Save/Cancel controls remained available.
- Materials Viewing mode disabled selection; Edit allocations unlocked checkboxes; Done editing locked them again. Steel/Mesh switched which used-material register was shown. Original records selected by default, mock dataset optionally selectable.
- Scrap text search and Original recorded dataset, Morales session pagination, and Job Report links back to detail tabs tested.
- Original TPM database and API remain untouched. This is an interactive prototype using fictional sample data, not proof of backend behavior.

The main design principle is **one primary table per type of operational record**. Repetition is intentional only for small context summaries and the one-job printable report.