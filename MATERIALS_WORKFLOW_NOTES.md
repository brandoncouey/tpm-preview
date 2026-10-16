# TPM Materials — legacy workflow audit and redesign handoff

The TPM Materials UI redesign is a **static offline preview**, not a replacement for the working Laravel/Vue workflow. Original code was inspected from `Archive.zip` (`resources/js/pages/Orders.vue`, `components/CoilAllocation.vue`, `MeshAllocation.vue`, `job/JobMaterialsUsed.vue`) and verified against the captured original Materials page in `TPM_APPLICATION_CAPTURE.zip`.

## Existing allocation/deallocation behavior

**Coils:** Browse Allocated / All material widths / Part-specific widths; filter All/Blank/Perforated, search coil or work number, sort columns, select rows or select all visible. Existing edit mode is passed into the component via `:is-editing`. Selection can be multiple IDs. Allocation posts to `POST /api/update_data` with `{type:1,id:[coilIds],job}`, deallocation with `type:2`. On success, refetch the list and weight summary; errors (including stale inventory assigned elsewhere) must be surfaced, not silently ignored.

**Mesh:** Browse Allocated / All Mesh / Part Specific Mesh. Filter All / Top Filter / Bottom Filter / Inner Drainage / Outer Drainage; search and select multiple rolls. Mesh allocation uses `POST /api/update_data` `type:4`; deallocation uses `type:5`. Re-query mesh inventory and `/api/meshtotal_show?jobno=` afterward. The original mesh recommendation/combination builder is not replicated in this mock; preserve it in the production migration.

**Enter as Used:** For an eligible selected allocated coil, the legacy control takes an LF value no greater than available LF, computes an approximate equivalent weight `LF × width(in) × 12 × gauge(in) × 0.29`, then calls `POST /api/Enter_as_Used` with `{newval,coil,oldone}`. This is a weight-update workflow: **do not interpret it as a trustworthy independent raw-consumption LF ledger**. The redesign previews the conversion without writing stock or usage history.

**Usage history:** `JobMaterialsUsed.vue` is **read only**, queried from `GET /api/material-search?job=`. It shows allocated coils, used coils with tube ranges, mesh allocated/used, and tube traceability. The used history must remain intact after an allocation is released.

## LF and footage source of truth

- `GET /api/weight_show?job=` provides **required LF**, **perforated allocated LF**, **blank allocated LF**, shortages and required lbs. Required footage is an **order-wide estimate with a 10% allowance**, not automatically remaining work. LF per coil depends on available weight, width and gauge.
- `GET /api/meshtotal_show?jobno=` provides mesh allocated, used and required length.
- Preview Job #990100 fixture contains `lf_mat=16,125` (labeled **order LF reference**), `total_tube=12,096` (labeled **produced tube footage**), and `scrap.totals.feet=84.6` (scrap LF separately). These do **not** establish raw steel inventory consumption. The original allocated-coil fixture lacks sufficient measurements for credible LF conversion, so it shows **Not recorded**, not a false zero or estimate.
- Display actual consumed LF only after a real, validated backend source is identified or a new raw-consumption ledger is approved.

## Refined UI behavior

The preview provides a single high-volume allocation workspace with distinct **Steel coils / Mesh rolls**, **Allocated / Part match / All** scopes, search, blank/perforated filter or mesh role, sort, page sizes 20/50/100, and checkbox bulk selection. Selections survive pagination within the same filter but clear when the filter/scope changes; confirmation dialogs list affected IDs, known/unknown LF, and optional **preview-only** notes. Both allocation and deallocation simulate immediate, atomic changes and update the mock counters, never the production database.

The inventory catalog includes **186 fictional coils and 82 fictional mesh rolls** to test scale and scrolling. Below the allocator, keep used-coil/mesh history and tube traceability read-only. A separate collapsed coverage panel mirrors the original blank/perforated and mesh totals without inventing missing data.

## Laravel + Vue 3 Composition API integration

Implement a `JobMaterialWorkspace.vue` using Vue 3 `<script setup>`: `ref()` for active material type, scope, filters, selected IDs, paging, loading, permissions and dialog state; `computed()` for selected LF and permitted actions; `watch()` for job/part/quantity invalidation. Extract `MaterialInventoryTable.vue`, `MaterialsFootageSummary.vue`, `MaterialAllocationToolbar.vue`, and `MaterialUsageHistory.vue`. Reuse existing `CoilAllocation`, `MeshAllocation` service calls and `JobMaterialsUsed` data semantics; do not substitute mock filtering for production server pagination unless supported by the real endpoint.

For each bulk action: verify edit permission and current job state; submit the exact `type,id[],job` payload; handle failures, stale rows, and double submissions; refetch inventory + totals; preserve historical usage. Review actual server pagination support and the mesh combination/recommendation workflow before migration. Add tests for large datasets, multi-page selection, allocation conflicts, failed mutations, missing LF, used-history immutability, mobile overflow and keyboard operation.

**Prototype limitations:** no Laravel API writes, no true stock reservation, no authorization, no production audit log, no validated raw-consumed LF aggregation; browser storage is an offline demonstration only.
