# A07 · Admin requests list, assign / unassign

**Depends on:** A05, B04 · **Read first:** `docs/03-user-flows.md` F3, `docs/04-wireframes.md` A-S5, A-S6, `docs/10-verified-backend-facts.md` (Department requests), `OPEN_QUESTIONS.md` Q1

## Goal
CA can view department requests and assign or unassign staff.

## Steps
1. `src/api/requests.ts`: `list({status?})` → `GET /govt-forms/requests`, `get(id)`, `agents()` → `GET /govt-forms/customer-service`, `assign(id, csUserId)`, `adminRelease(id)`.
2. `RequestList` (admin): segmented Pending/Assigned/All (filter client-side by `workflow.key` and handler; server list is not paginated, so add client search and cap render with FlatList windowing). StatusPill uses **workflow** labels (doc 01).
3. `RequestDetail` (admin): applicant, scheme, workflow, handler, linked report status; **Assign** when `canAdminAssignRequest` logic holds (no owner and workflow not `ca_validation`/`generated`); **Unassign** when owned and not locked; locked message otherwise. Port the predicate logic from `FINVOIS-DEV-UI/src/utils/dprWorkflowStatus.js` into `src/utils/workflow.ts` with unit tests that mirror it (read-only reference, do not import from web).
4. `AssignSheet` (shared component): load agents, single-select, show open-count if returned (if not returned by the API, omit — do not invent counts), confirm.
5. Handle errors: 400 "Unassign first…" surfaced; refresh list and detail after success.
6. From report detail (A05), link to this request detail using the context endpoint's `requestId`.
7. Tests: predicate parity table tests; sheet flow with mocked API.

## Acceptance checks
- [ ] Assign moves the request to Assigned; the web Requests screen shows the same handler.
- [ ] Unassign returns it to Pending; blocked when with CA or generated (button hidden and server refusal handled).
- [ ] Predicate unit tests match the web behavior for all workflow keys.
- [ ] After assign, the assigned agent's test device receives `dpr_assigned` (once B06 is done; otherwise mark this check pending in the PR).

## Do not
- Invent an "open count" if the API does not provide it.
- Import code from the web project.
