# Task index

Rules: work one task at a time, in dependency order. Set `Status` to `DONE` (with date) only after every acceptance check in the task file passes. Read `AGENT_RULES.md` first.

Status values: `TODO`, `IN PROGRESS`, `BLOCKED (reason)`, `DONE (yyyy-mm-dd)`.

## Backend (repo: `FINVOIS-DEV-API`, new files under the mobile surface)

| ID | Task | Depends on | Status |
|---|---|---|---|
| B01 | Mobile router scaffold, min-version gate, rate limits, headers, test harness | — | DONE (2026-09-30, covered by tests/mobile-auth.test.js) |
| B02 | Mobile auth: login, refresh rotation, logout, sessions | B01 | DONE (2026-09-30) |
| B03 | Device push tokens: register / unregister | B02 | DONE (2026-10-01, tests/mobile-push-token.test.js; evidence in docs/security-signoff-backend.md section 7) |
| B04 | Admin stats with report-type filter, report→request context | B02 | DONE (2026-10-01, tests/mobile-admin.test.js) |
| B05 | Send-report endpoint (recipients × channels, gated, audited) | B02 | DONE (2026-10-01, tests/mobile-send.test.js) |
| B06 | Push service and event triggers | B03 | DONE (2026-10-01, tests/mobile-push.test.js) |
| B07 | Backend end-to-end verification, env docs, security review | B04, B05, B06 | IN PROGRESS (e2e test, sign-off doc and env docs done 2026-10-01; one acceptance check open: edits to existing files go beyond the expected list, owner to accept or remove them, see docs/security-signoff-backend.md section 5) |

## App (folder: `finovis-mobile/app`)

Reviewed 2026-11-03 against each task's acceptance checks and `docs/security-signoff-app.md`. Last e2e run 2026-10-01 (not re-run; needs the local API on port 5100). Device, real-contact and cross-app web checks are open until someone records them.

| ID | Task | Depends on | Status |
|---|---|---|---|
| A01 | Expo project scaffold, tooling, config | — | IN PROGRESS (typecheck, lint, jest green 2026-11-03; open: boot on an Android emulator and iOS simulator not recorded; doc 02 structure not re-checked; `app.config.ts` name is "Finvois" but this task and the docs say "Finovis", owner to confirm; package ids still TODO owner) |
| A02 | API client, secure session, refresh interceptor | A01, B02 | IN PROGRESS (jest green 2026-11-03, including the concurrent-401 single-refresh test; open: kill and reopen restores the session, and a server-side revoke returns to login, not yet run on a device or simulator) |
| A03 | Login screen, role routing, logout, splash | A02 | DONE (2026-09-30, Playwright 10/10) |
| A04 | Admin dashboard | A03, B04 | DONE (2026-11-03, unit+lint verified; e2e last run 2026-10-01) |
| A05 | Admin reports list, detail, PDF viewer | A04 | IN PROGRESS (unit and e2e pass; open: on device, cached PDF gone after close (file listing), and Android screenshot blocked on the PDF screen) |
| A06 | Admin review actions: review, approve, reject | A05 | IN PROGRESS (e2e covers status rules and the already-approved case; open: web UI cross-check of review, approve and reject) |
| A07 | Admin requests list, assign / unassign | A05, B04 | IN PROGRESS (unit and e2e pass; open: web Requests screen shows the same handler; assigned agent's device receives `dpr_assigned`, needs A11) |
| A08 | Shared send-report sheet | A05, B05 | IN PROGRESS (e2e covers gating, double tap, partial failure and retry; open: all four messages arrive on real test contacts, since e2e captures messages and sends none) |
| A09 | Agent My work: tabs, claim, release | A03 | DONE (2026-11-03, unit+lint verified; e2e last run 2026-10-01) |
| A10 | Agent request detail: documents, messages, call, send | A09, A08 | IN PROGRESS (e2e covers access denied, send gating, documents and messages; open: dialer and WhatsApp open on a device, cached documents removed on device, messages checked in the web UI) |
| A11 | Push notifications client and deep links | A03, B06 | IN PROGRESS (unit and web e2e pass; open: all device checks in the task: permission prompt, real token registration, tap routing from killed, background and foreground, malformed payload, no push after logout, permission denied) |
| A12 | Client security hardening | A06, A10 | IN PROGRESS (client checks in `docs/security-signoff-app.md` passed 2026-10-01; 2026-11-03: integrity header sent from `api/client.ts`, `SendReportSheet` gated by `useSendBlockedByIntegrity`, R8/resource shrinking and `blockedPermissions` in `app.config.ts`, doc 07 lists `USE_BIOMETRIC`/`USE_FINGERPRINT`/`VIBRATE`; tsc, jest 415/415, eslint 0 errors, audit:storage green. Open: every section 6 device item (lock, app switcher, rooted device, release build incl. R8 smoke test and merged manifest), backend logging of `X-Device-Integrity`, owner to accept the npm audit moderates, decide section 5 findings 3 and 4, and confirm Q2 and Q5) |
| A13 | Store readiness: assets, metadata, builds | A12, A11 | BLOCKED (owner inputs: final name and package id, privacy-policy URL, support email, store accounts, Q3 and Q4 listing decision, real API URLs in `eas.json`; also A11 and A12 not DONE) |
| A14 | Full QA, security checklist, release | A13, B07 | TODO (depends on A13 and B07) |

## Web parity (D12)

| ID | Task | Depends on | Status |
|---|---|---|---|
| P01 | Close the gaps found comparing the app with the web (doc 01 item 9, doc 05 "Existing routes added by D12") | A03 to A11 | IN PROGRESS (2026-11-04: unit, browser and Android emulator checks pass against the seeded local API; open: sign in with real accounts on Azure dev, a real workbook download and real cloud storage upload, iOS not run) |
| P02 | Email automation for the admin (D13, doc 01 item 10, doc 05 "Existing routes added by D13") | P01 | IN PROGRESS (2026-11-04: unit, browser and Android emulator checks pass against the seeded local API, including a real .xlsx through the Android picker and one pass of the real sender with mail captured; open: real Azure account, real mail delivery and Azure attachment storage (stubbed locally), attachment upload and open through the picker on a device (mocked in the browser test), iOS not run. Admin only, by owner decision) |

## Critical path
B01 → B02 → (B03, B04, B05 in parallel) → B06 → B07; app A01 can start with B01; A02 needs B02.

## Definition of done (every task)
1. All acceptance checks in the task file pass, with real command output recorded in the PR notes.
2. Typecheck, lint, and tests pass (app: `npm run typecheck && npm run lint && npm test`; API: `npm test -- mobile`).
3. No rule in `AGENT_RULES.md` violated; no out-of-scope files changed.
4. Docs updated if behavior or contract changed.
5. Index updated.
