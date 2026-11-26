# A05 · Admin reports list, detail, PDF viewer

**Depends on:** A04 · **Read first:** `docs/03-user-flows.md` F2, `docs/04-wireframes.md` A-S3, A-S4, `docs/05-api-contract.md` §A, `docs/06-security-architecture.md` §5–§6

## Goal
Browse reports by status/type/search and open a report with its PDF.

## Steps
1. `src/api/adminReports.ts`: `list(params)` → `GET /admin-reports` (page, limit 20, status, report_type, search), `get(id)`, `pdf(id)` (blob), and `context(id)` → `GET /mobile/admin/reports/:id/context`. Read the real list/detail response shapes from `adminReports.js` and type them precisely.
2. `ReportList`: infinite scroll (TanStack `useInfiniteQuery`), debounced search (400 ms), status and type filters, StatusPill per doc 01 vocabulary (report statuses), empty and error states.
3. `ReportDetail`: fields, StatusPill, linked handler from `context`, action buttons rendered by state (actions implemented in A06/A08; render disabled-free placeholders only if the task is not done).
4. `PdfViewer` (shared): download to `cacheDirectory/reports/<id>.pdf`; open with a WebView-free approach chosen from Expo-supported options (e.g., `expo-sharing`/system viewer or a maintained PDF component approved in the PR); delete the file when closed; enable `preventScreenCaptureAsync` while open; friendly error when 404.
5. Startup sweep of `reports/` cache directory.
6. Tests: list param building, infinite scroll pagination merging, cache cleanup on close.

## Acceptance checks
- [ ] Deep list (100+ reports) scrolls without duplicates.
- [ ] Search and filters return the same items as the web for the same filters (spot check 3).
- [ ] PDF opens, and the cached file no longer exists after closing (verify with file system listing).
- [ ] Android screenshot attempt on PDF screen is blocked.

## Do not
- Save PDFs to shared storage or the media library.
- Write query cache to disk.
