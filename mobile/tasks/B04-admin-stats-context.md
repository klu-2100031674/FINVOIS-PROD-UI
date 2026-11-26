# B04 · Admin stats with report-type filter, report→request context

**Depends on:** B02 · **Repo:** `FINVOIS-DEV-API` · **Read first:** `docs/05-api-contract.md` §B5–B6, `docs/10-verified-backend-facts.md`

## Goal
Dashboard counts filterable by report type (decision D4) and a lookup that connects a Report to its DepartmentRequest for assignment info.

## Steps
1. Read `GET /stats` and `GET /` in `src/routes/adminReports.js`, especially `buildReportTypeOrFilter`, `getCompanyScopeFilter`, `getCompanyIdFilter`. Do not modify that file. If helpers are not exported, extract them into a shared util with **unchanged behavior** and re-import in the original file only if the diff is trivial; otherwise duplicate the minimal logic and note it.
2. Add `GET /mobile/admin/stats?report_type=` (admin only via `requireRole(['admin'])`): same six counts as the web route using the same `validation_status` filters plus the report-type filter. **No offsets.**
3. Add `GET /mobile/admin/reports/:id/context` (admin only): load Report; find `DepartmentRequest` with `reportId`; return `{requestId, workflow (via getDprWorkflowStatus), assignedTo{name,email}, claimedBy{name,email}, canAssign, canUnassign}` using `canAdminAssignRequest` / `canAdminUnassignRequest`. If no linked request return `{requestId:null}`.
4. Tests: `tests/mobile-admin.test.js` with seeded reports of several types and statuses.

## Acceptance checks
- [ ] Without filter, numbers equal `/admin-reports/stats` for the same DB (assert in test).
- [ ] With `report_type`, counts equal the number returned by `/admin-reports?report_type=…&status=…` totals.
- [ ] Approved count is the raw DB count (no +4492).
- [ ] Non-admin (including `customer_service`) → 403.
- [ ] Context for a report with no request → `requestId:null`; with request → correct handler and flags.

## Do not
- Add offsets or any presentation logic to counts.
- Alter the existing `/admin-reports` routes.
