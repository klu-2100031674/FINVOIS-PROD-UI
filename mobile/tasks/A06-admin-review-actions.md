# A06 · Admin review actions: under review, approve, reject

**Depends on:** A05 · **Read first:** `docs/03-user-flows.md` F2, `docs/05-api-contract.md` §A (approve/reject rules), `OPEN_QUESTIONS.md` Q8

## Goal
CA can mark under review, approve, and reject reports from detail.

## Steps
1. Extend `adminReports.ts`: `markUnderReview(id)` → `PATCH /admin-reports/:id/review`; `approve(id, {validation_notes?})` → `PATCH …/approve`; `reject(id, {rejection_reason, validation_notes?})` → `PATCH …/reject`.
2. `send_email` on approve/reject: follow the web default (server default true) unless Q8 is answered otherwise; do not send the field unless decided.
3. Button visibility: review/approve/reject only when status is `pending_validation` or `under_review`; Mark under review only when `pending_validation`.
4. Approve: confirmation dialog. Reject: bottom sheet with required reason (min 5 chars, max 500), then confirm.
5. On success: toast, invalidate `report`, `reports`, and `stats` queries, stay on detail. On 400 status errors show the server message.
6. Prevent double submit (disable while pending); retry-safe because server rejects invalid transitions.
7. Tests: visibility matrix by status; reject requires reason; query invalidation.

## Acceptance checks
- [ ] Each action updates status on the web app too (verify in web UI).
- [ ] Reject without a reason cannot be submitted client-side, and server 400 is shown if bypassed.
- [ ] Approving an already approved report shows the server message and no crash.
- [ ] Dashboard counts change after an action and pull-to-refresh.

## Do not
- Show approve/reject for non-admin roles (the screen is admin-only) and do not rely on hiding for security.
