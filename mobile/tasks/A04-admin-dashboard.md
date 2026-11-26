# A04 · Admin dashboard

**Depends on:** A03, B04 · **Read first:** `docs/03-user-flows.md` F1, `docs/04-wireframes.md` A-S2, `docs/05-api-contract.md` §B5, `DECISIONS.md` D3–D4

## Goal
Five raw-count cards with a report-type filter.

## Steps
1. `src/api/adminStats.ts`: `getStats({reportType?})` → `GET /mobile/admin/stats`. `src/api/reportTypes.ts`: fetch options from the existing `GET /admin-reports/meta/report-types`; if the response shape is unclear, read that route first and type it accordingly.
2. `Dashboard`: StatCard ×5 (Pending, Under review, Approved, Rejected, Total), report-type dropdown (default All), pull-to-refresh, refetch on focus, "Updated hh:mm", skeleton, error card with Retry that keeps last data.
3. Card press → navigate to Reports tab with `status` param (`pending_validation`, `under_review`, `approved`, `rejected`, none for Total).
4. Show numbers exactly as returned (locale-formatted, no offsets).
5. Tests: renders values from a mocked response; filter changes the query key; error state keeps stale data.

## Acceptance checks
- [ ] Numbers equal `/api/mobile/admin/stats` output (compare with curl).
- [ ] Approved shows the raw count (not +4492).
- [ ] Filtering by a type changes the numbers to match B04.
- [ ] Offline shows stale data plus an error banner.

## Do not
- Add charts or extra metrics (`today_pending` stays unused in v1).
