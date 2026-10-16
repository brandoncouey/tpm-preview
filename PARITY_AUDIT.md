# TPM Orders — Premium preview functional parity audit

Source compared: `resources/js/pages/Orders.vue`, `components/job/JobActionBar.vue`, `JobStageProgress.vue`, `JobSetupSheet.vue`, `JobMaterialsUsed.vue`, `CoilAllocation` and `MeshAllocation` integration. This source archive is a snapshot, **not live localhost**. Source repository does not contain the full database or routes folder.

## Carried over into interactive mock
- Edit / Save / Cancel with only eligible existing fields editable. Edit PO number, part, quantity, price, date ordered, due, planned ship, container, shipping method, mill and repair weld specs, cutoff operator, inspector, and repair welder. Customer, job number, calculated total, dates after production, die number, etc. stay read-only.
- Separate Change Mill / Change Mill Operator dialogues (example search roster), not generic order save.
- Conditional actions for job status: started, completed, shipped, not started. Mark shipped / Not completed / Unmark shipped / Delete only appear as allowed; Unstart only if no processed tubes.
- Confirmation dialog pattern, mock saves and cancel. A Preview Tools disclosure simulates the four job states for inspection. This does **not** change actual production stage totals.
- Stage progress click opens a mock station details dialog with true fixture counts and timestamps.
- Quick actions for report, scrap, materials and history; print browser preview; admin-only shop forms explained without fake PDF action.
- Editable coil / mesh allocation in Materials when in editing mode; used materials and tube records remain read-only. **Demo inventory list** only.
- All six previous page views; records displayed in high-quality read-only styling; edit inputs appear in place.
- Sample state saved in **browser localStorage** on Save / allocation changes, with Reset fictional job tool. Never any network writes.

## Not fully reproducible without a live TPM backend
- Live validated part list, specific employee/role filtering, parts-derived pricing/specs, real server validation and permissions.
- Mill and operator assignment APIs, active mill conflicts, duplicate job protection, actual coil and mesh allocation validation and DB changes.
- Full `JobProgressModal` station/part/tube details, tube drilldowns, scrap explorer navigation, entity drilldowns to customers, employees, coils and parts.
- `PDFGeneration` admin-only printing and actual shop PDF generation; original PDF generator unchanged.
- Job list: filters, search, pagination, To Start/Started/Finished/Shipped/All counts and active mill chips are **outside this selected-job prototype**.
- Real audit trail, persisted historical edits, server status transitions, server role checks. Mock state changes do not append backend history.

## Noneditable/source-derived information
Original Orders.vue retains read-only job number, customer, part description, die, calculated revenue total, status dates, part specs, setup, material/weight values, MFG notes. The actual page only exposes Change Mill and Change Operator through separate dialogs. Use Laravel backend as source of truth for enforcing permissions and field validity.

## Safety
Fake Atlas Filtration fixture; no actual TPM customer data. Mock user data saved to localStorage only; no fetch, mutation, or real endpoint call. The `Print preview` button invokes the browser print dialog only.