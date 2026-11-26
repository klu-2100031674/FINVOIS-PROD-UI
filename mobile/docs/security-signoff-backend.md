# Backend security sign-off (task B07)

Date: 2026-10-01. Scope: the `/api/mobile/*` surface and every hook it adds to existing backend code, in `FINVOIS-DEV-API`. Checked against `docs/06-security-architecture.md` sections 9 and 11, `docs/05-api-contract.md`, and the acceptance checks of tasks B03 to B07.

Legend: **Verified** means a command was run and its result is recorded here. **Unverified** means it was not checked, with the reason. Nothing is marked verified from reading code alone unless the row says so.

## 0. Method and environment

- Machine: Windows 11, Node v22.20.0 (the production Dockerfile uses Node 20, not exercised). No `.env` exists in the checkout, so tests set their own `JWT_SECRET`.
- Code under test: the working tree of `FINVOIS-DEV-API` on top of HEAD `9f5ebfb`. The project work is uncommitted, and `src/routes/users.js` is still unmerged in the git index (the user's merge). Nothing in this task touched git state.
- Baseline: no pre-project suite result was recorded in B01, so the baseline is a snapshot of HEAD (`git archive HEAD`, extracted outside the repo, `node_modules` linked), run with the same commands.
- Offline: every full-suite run used a preload that refuses any non-loopback TCP connection and logs the attempt (a copy of the technique in `scripts/mobile-e2e-server.js`, kept outside the repo). Across both baseline and current runs the only attempted outbound connection was `tests/promotional-lead-email.test.js` to `example.com`; it was refused in both and that test passes in both. The new e2e test carries its own guard and fails if any connection is attempted. `tests/whatsapp-api-live.test.js` was never run (see section 1).
- Black-box checks used `curl` against the real Express app (`src/app`) served by `scripts/mobile-e2e-server.js` on an in-memory MongoDB with its seeded throwaway accounts, on port 5199 (outside the 5100 to 5130 slot range), started with `MOBILE_LOGIN_LIMIT_MAX=5` so the real limit applies. The seed password was read from `/__e2e/state` into a shell variable and never printed. Mail, WhatsApp and Expo push were captured, not sent; `/__e2e/blocked` stayed empty. No remote host and no real credential was used.

Reproduce:

```
cd FINVOIS-DEV-API
NODE_ENV=test node tests/mobile-e2e.test.js        # the new end-to-end test
npm test                                           # node-runtime suite (tests/run-all.js)
npm run test:jest                                  # jest suites
PORT=5199 MOBILE_LOGIN_LIMIT_MAX=5 node scripts/mobile-e2e-server.js &   # local server, seeded throwaway accounts
PORT=5199 bash scripts/mobile-curl-checks.sh                             # the curl checks quoted in section 2
```

`scripts/mobile-curl-checks.sh` is the curl run from this sign-off, kept so it can be repeated before each release. It prints status codes and short non-secret fields only.

## 1. Test results against the baseline

| Command | Baseline (HEAD) | Now |
|---|---|---|
| `npm test` | 22 passed, 3 failed (25 files) | 31 passed, 3 failed (34 files) |
| `npm run test:jest` | 6 suites passed, 1 failed, 60 tests passed | identical |
| `NODE_ENV=test node tests/mobile-e2e.test.js` | file does not exist | `mobile-e2e: OK` (5 consecutive runs, stable) |

The nine added files are `login-rate-limit`, `mobile-admin`, `mobile-auth`, `mobile-e2e`, `mobile-e2e-server`, `mobile-push-token`, `mobile-push`, `mobile-send`, `token-revocation`. Each also passes when run alone (`NODE_ENV=test node tests/<name>.test.js`, 1 to 26 s each).

The failures are the same four in both runs, none caused by the mobile work, none fixed here (task rule):

| File | Failure |
|---|---|
| `tests/customer-otp-rate-limit.test.js` | assertion `default max must be 2 requests` fails |
| `tests/dual-auth-integration.test.js` | `jest is not defined` (a jest-style file that `run-all.js` runs with plain node) |
| `tests/pending-report-reminder.test.js` | `expected yesterdayPending 3, got: undefined` |
| `tests/ai-report-integration.test.js` (jest) | `JWT_SECRET is required` (no `.env` in this checkout) |

Could not run:

- `tests/whatsapp-api-live.test.js`: excluded by `run-all.js`; it calls the live WhatsApp gateway.
- `npm run test:rag`, `test:rag:unit`, `test:benchmark`, `test:all`, `test:pmegp-upgrade`, `test:cmep-rag`: the files they name (for example `hybrid-retrieval.test.js`, `policy-rag-benchmark.test.js`, `cmep-rag.integration.test.js`, `excelCalculationService.test.js`) are not in this checkout's `tests/`.

### Negative controls for the e2e test

The test was also run with one security rule broken in memory (a preload outside the repo; nothing on disk changed). Each run must fail, and did:

| Broken rule | Result |
|---|---|
| `reportSendBlocked` always passes | fails: `customer_service send before approval -> 200` |
| `isCsOwnerOfRequest` always true | fails: `an agent cannot send another agent's report` |
| `requireRole` lets everyone through | fails: `agent on /mobile/admin/stats -> 200` |
| `isSessionActive` always true | fails: `its access token stops working at once, not at expiry` |
| `mobileAgentMayView` always true | fails: `an agent cannot open another agent's request` |
| login limit raised to 1000 | fails: `login is limited to 5 attempts a minute` (exit code 1) |

## 2. Checklist from doc 06 section 11

Curl evidence below uses `API=http://127.0.0.1:5199/api`, `PW` for the seed password, and the seeded accounts `ca@`, `anita@`, `meena@`, `suresh@`, `partner@`, `inactive@e2e.test`.

- [ ] **1. Token only in secure-store; no token in AsyncStorage or logs.** Backend half **verified**; client half **unverified** (A12/A13). Evidence: `tests/mobile-e2e.test.js` hooks every logger method and asserts that none of the 10 issued access and refresh tokens, the password, or the applicant's phone and email appears in any log line. After the curl session, `grep -c -F <token>` over `FINVOIS-DEV-API/logs/*.log` returned 0 for every access token, refresh token (including rotated ones), the web token, and the seed password. A login with malformed JSON containing a marker string returned 400 and the marker was found 0 times in the logs. Code review of every `logger` call in the mobile files found two weak spots, see F5 and F7.
- [ ] **2. Release APK/IPA strings contain no secrets.** **Unverified**, client-only (A13). Backend note: the API returns no secret to the app; login returns the user's id, name, email, role and the token pair only.
- [x] **3. Non-admin/agent account cannot log in; agent cannot call admin routes.** **Verified.** Tests: `mobile-auth` (partner is `403 ROLE_NOT_ALLOWED`), `mobile-admin`, `mobile-e2e`. Curl: `POST $API/mobile/auth/login` for `partner@` returned `403` with `code: ROLE_NOT_ALLOWED` and no token; `inactive@` returned `403`; a wrong password returned `401`; missing fields `400`. With Anita's token: `GET /mobile/admin/stats`, `/mobile/admin/staff`, `/mobile/admin/reports/<id>/context`, `GET /admin-reports/stats`, `PATCH /admin-reports/<id>/approve`, `POST /govt-forms/requests/<id>/assign` all returned `403 {"error":"Insufficient permissions"}`. No token returned `401`, a garbage token `401`, and a web token from `POST /users/login` returned `401 Your session ended. Sign in again.` on both `/mobile/admin/stats` and `/mobile/reports/<id>/send`. The admin control call returned `200` with raw counts.
- [x] **4. Agent cannot open or send another agent's request.** **Verified** for mobile sessions. Curl: Meena `GET /govt-forms/requests/<Anita's request>` returned `403`; Meena `POST /mobile/reports/<Anita's report>/send` returned `403`; Meena's request list contained 0 matches for Anita's request id. The e2e test also covers the documents, messages (read and post) and report PDF routes of another agent's request (all `403`, owner `200`), and Suresh and Anita crossing in both directions. Note F9: a web session keeps the pre-existing wider view rule, unchanged by design.
- [x] **5. Reused refresh token revokes the session.** **Verified.** Tests: `mobile-auth`, `mobile-e2e` (the access token of the revoked family stops working at once). Curl: login, refresh (`200`, new token differs), replay of the old token `401 TOKEN_REUSED`, the newer token of the same family `401`, its access token `401`, while the admin's other device session stayed `200`. A probe with four concurrent refreshes of one token (4 rounds): exactly one `200`, three `401`, and the winner's new token was dead afterwards, see F8.
- [x] **6. Not-approved and not-paid reports cannot be sent by any role.** **Verified.** Tests: `mobile-send`, `mobile-e2e` (admin and agent, before approval `400`, approved but unpaid `402 PAYMENT_REQUIRED`, nothing delivered while blocked, allowed once approved and paid). Curl: admin send of a `pending_validation` report `400 Report must be approved before it can be sent.`; Anita on her pending report `400`; admin and Suresh on an approved, unpaid report `402 PAYMENT_REQUIRED`; `/__e2e/sent` held 0 deliveries. Then Anita on her approved, paid report `200`, four deliveries captured, a repeat within 60 s `200` with the delivery count unchanged (4 and 4), unknown channel `400`, extra field `400`.
- [ ] **7. Cleartext HTTP fails on both platforms.** **Unverified**, client and infrastructure (A12/A13; TLS termination is not part of this repo).
- [ ] **8. Screenshots blocked on the PDF screen, blur in app switcher.** **Unverified**, client-only (A12).
- [x] **9. Push payloads contain only type and id.** **Verified.** Tests: `mobile-push` (every event), `mobile-e2e` (`data` keys are exactly `id` and `type`, no title, name or contact in the message). Curl: after approving Anita's report and assigning a request to Suresh, `/__e2e/pushes` held `{"title":"Report approved","body":"A report is ready to send.","data":{"type":"report_approved","id":"<requestId>"},"sound":"default","channelId":"default"}` and the matching `dpr_assigned` message with the generic title `New DPR assigned`.
- [ ] **10. Release build has no console output and cannot open the dev menu.** **Unverified**, client-only (A12/A13).
- [ ] **11. `npm audit --omit=dev` clean of high/critical.** **Unverified.** The command needs the npm registry, a remote host that this task may not contact. The mobile work added no dependency: `git diff HEAD -- package.json package-lock.json` is empty, so the audit position of the API is unchanged from baseline. Run the audit in CI or locally before release.
- [x] **12. Rate limits trigger (429) in tests.** **Verified.** Login: `mobile-auth`, `mobile-e2e` (five `401`, then `429`), curl (`401 401 401 401 401 429`). Send, 10 per minute per user: `mobile-send` (11th is `429`, another user unaffected). Refresh, 30 per minute per device: added to `mobile-e2e` (30 `401`, the 31st `429`); no earlier test covered it. All three limiters keep counts per process, see F1.

## 3. Backend requirements from doc 06 section 9

- [x] Rate limits: login 5 per minute per IP and email, refresh 30 per minute per device, send 10 per minute per user. Verified, see item 12. Per-process caveat in F1.
- [x] Security headers on `/api/mobile/*` only. Verified by curl on `/mobile/health`: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`; the e2e test asserts `no-store` on health and stats. No `helmet`; global behavior unchanged (`src/app.js`, `src/config/cors.js`, `package.json` have no diff).
- [x] Input validation on every new route. Verified by tests and review: login, refresh, push register and unregister, stats `report_type` (400 on repeated or over 100 characters, matched literally), report id (400), send (strict schema: unknown fields, recipients, channels, applicant overrides all rejected without echoing the value). Operator bodies (`{"$ne":null}`) are rejected because every field must be a string.
- [ ] Structured audit logging: login success and failure, refresh reuse, assign, unassign, send are logged with user id and no token or full contact (verified). **Gaps:** logout writes no log line (F7); approve and reject write no log line, the actor and time are stored on the report as `validated_by` and `validated_at` (existing behavior, unchanged).
- [x] CORS not loosened: `src/config/cors.js` has no diff.

## 4. Code review of the new code (step 5)

No high-severity finding. Nothing below was fixed in this task: the files belong to other tasks, or are existing files that may not be edited (AGENT_RULES 9).

| ID | Severity | Finding | Evidence | Recommended action |
|---|---|---|---|---|
| F1 | Medium | The three rate limiters use express-rate-limit's in-memory store, so counts are per process. `ecosystem.config.js` declares PM2 cluster mode with `instances: 'max'`, which multiplies each limit by the worker count (login 5 per minute becomes 5 per worker). The login limiter is also keyed by IP plus email, as specified, so one address can try any number of different emails. The Dockerfile runs a single `node server.js`; the Windows VM `deploy.ps1` was not available, so which mode production uses is unverified. | `src/middleware/mobileGuards.js`, `ecosystem.config.js` | Owner to confirm how production runs. If clustered, back the limiters with a shared store, or add a per-account failure counter in the database. |
| F2 | Medium | `DepartmentRequest.reportId` has no index. The report context lookup, the send flow and the approve push all query it, and the query plan is a collection scan. | Query plan on an in-memory database: `DepartmentRequest {reportId}` is `COLLSCAN`; `MobileSession` (`familyId`, `refreshTokenHash`, `userId`), `DeviceToken` (`userId`, `expoPushToken`) and the report stats counts all use an index. | Add `departmentRequestSchema.index({ reportId: 1 })`. An edit to an existing model, so owner approval is needed. |
| F3 | Low | No cap on device tokens per user. Any signed-in session can create unlimited `DeviceToken` rows by registering new device ids, and every push to that user then fans out to all of them. `/push/register` has no limiter. | `src/routes/mobilePush.js` | Cap at about 10 devices per user (replace the oldest) and add a limiter. |
| F4 | Low | Two reads have no `.limit()`: `GET /mobile/admin/staff` (all active agents) and the claim-expiring candidate query. Both are bounded only by business size. | `src/routes/mobileAdmin.js`, `src/services/claimExpiryService.js` | Add `.limit(500)`. |
| F5 | Low | `maskEmail` masks only values that contain an `@`. A failed login whose email field holds anything else (for example a password typed in the wrong box) is logged in full, up to 200 characters. A value like `p@ssw0rd` is logged as `p***@ssw0rd`. | `src/services/mobileAuthService.js` lines 26 and 72; checked in node | Log a short hash, or nothing, for the unknown-user path. |
| F6 | Low | Timing side channel on login. An unknown email returns before any bcrypt comparison, a known one after, so response time can reveal whether an email exists, against the doc 05 rule "never reveal whether an email exists". Found by reading code; not measured. | `mobileAuthService.login` | Compare against a fixed dummy hash when the user is not found. |
| F7 | Low | Logout writes no log line although doc 06 section 9 lists it. | `src/routes/mobile.js` logout | Add one `logger.business` line with the user id. |
| F8 | Info | Two concurrent refreshes with the same token: exactly one wins, then the loser's reuse detection revokes the family, so the winner's new token is dead too. Correct for the threat model, but a client that fires two refreshes at once signs itself out. | probe, 4 rounds of 4 concurrent calls: `200/401/401/401`, then the new token `401` | The app's refresh must be single-flight (A02 notes the concurrent-401 unit test as pending). |
| F9 | Info | The mobile-only rule that an agent sees only open work and their own (`viaMobile`) does not apply to web sessions. An agent's credentials used through the web login still list and open other agents' requests. Sending stays owner-only on every path. This predates the project and is outside the mobile surface (doc 06 section 10). | `src/utils/departmentRequestAccess.js`, `govtForms.js` | Decide with the owner whether the web should get the same rule. |
| F10 | Info | `resolveReportPdfBuffer` downloads any `http(s)` host that is not R2 or Azure storage, and forwards the bytes only if they start with `%PDF`. Whether a non-staff user can set `pdf_file_url` on a report was not checked. | `src/utils/reportPdfBuffer.js` | Restrict to known storage hosts if customers can influence the field. |
| F11 | Info | The agent PDF route `GET /govt-forms/requests/:id/report/pdf` does not send `Cache-Control: no-store` (the admin PDF route does). | `src/routes/govtForms.js` | The app must not rely on the HTTP cache for PDFs (A12), or the route should add the header. |
| F12 | Info | `docs/10-verified-backend-facts.md` says `token_version` is bumped on both change-password routes. The code does not bump it there: it signs the user's phones out (`revokeAllForUser`) and returns a freshly signed web token in the response. Only forgot-password reset and `logout-all` bump it. | `src/routes/users.js` | Update doc 10, or change the code, per AGENT_RULES 3. |

Reviewed and found in order: role checks on every route (`/admin` admin only, `/reports` admin and customer service, `/push` any live mobile session, auth routes public by design); refresh tokens stored only as SHA-256 hashes with a unique index; atomic refresh claim; audit rows holding masked contacts and HMAC keys only; send claims and audit rows with TTL indexes; indexes on `MobileSession` (`userId`, `familyId`, unique `refreshTokenHash`, TTL), `DeviceToken` (unique `userId` plus `deviceId`, `expoPushToken`), `MobileSendLog`, `MobileSendClaim`; no secret ever logged (the Expo access token is only placed in a request header).

## 5. Changes to existing files (step 6)

Measured with `git diff HEAD` against `9f5ebfb`. The expected list in the task is: mount line, assign hook, approve hook, request-creation hooks, claim expiry pass, optional field. Rows marked **E** are on that list. Every other hunk is listed with its origin so the owner can accept or reject it.

Key: **E** expected; **D** documented in doc 10 (the 2026-09-30 login rate limit, token revocation and send-gate work, or B02 session handling); **M** a mobile-session-only rule that no B task names; **L** log hygiene; **R** refactor with the same behavior.

| File | Hunk | Class |
|---|---|---|
| `src/routes/index.js` | `router.use('/mobile', require('./mobile'))` | E |
| `src/routes/govtForms.js` | `firePush` import; `firePush('notifyDprAssigned', …)` after assign | E |
| `src/routes/govtForms.js` | request list: for a mobile agent session add `status open OR assignedTo me OR claimedBy me` to every queue | M |
| `src/routes/govtForms.js` | request detail: `403` for a mobile agent who neither owns the request nor sees it open (`mobileAgentMayView`) | M |
| `src/routes/adminReports.js` | `firePush` import; `firePush('notifyReportApproved', report)` after `onReportApproved` | E |
| `src/routes/adminReports.js` | approved-and-paid gate on `POST /:id/email` and `/:id/whatsapp` (`400` and `402`) | D |
| `src/routes/reportHelp.js` | same gate on `/:id/linked-report/email` and `/whatsapp`, for mobile tokens only | M |
| `src/routes/users.js` | `loginRateLimit` on `/login`; `generateToken(…, token_version)` at four sites; new `POST /logout-all`; `/reset-password` bumps `token_version` and revokes mobile sessions | D |
| `src/routes/users.js` | `/change-password` and `PATCH /password` revoke mobile sessions and now also return `token` in the JSON (additive field on two web responses) | M, see F12 |
| `src/routes/leads.js`, `src/routes/salesAuth.routes.js` | `loginRateLimit` on login | D |
| `src/middleware/auth.js` | `tv` claim and `tokenVersionMatches`; mobile tokens rejected when their session is revoked; `req.mobileSid` and `req.user.viaMobile` set | D |
| `src/middleware/authMiddleware.js`, `src/middleware/leadManagerAuth.js` | reject on `token_version` mismatch (error text for a missing user changes from `User not found` to `Invalid token`) | D |
| `src/models/User.js` | `token_version` field | D |
| `src/models/DepartmentRequest.js` | optional `expiryPushSentAt` | E |
| `src/services/claimExpiryService.js` | `notifyExpiringClaims` pass inside `expireStaleClaims` | E |
| `src/services/claimExpiryService.js` | the "nothing started yet" predicate moved into a shared `NOT_STARTED` constant (same conditions) | R |
| `src/services/ensureDprRequestDepartmentRequest.js`, `ensureMepmaDepartmentRequest.js`, `ensureMsmeDepartmentRequest.js` | `firePush('notifyDprSubmitted', request)` when a request is created | E (3 hunks) |
| `src/controllers/customerController.js` | `firePush('notifyDprSubmitted', request)` at five creation sites | E (5 hunks) |
| `src/controllers/customerController.js` | `generateToken(…, token_version)` at four sites | D |
| `src/utils/departmentRequestAccess.js` | `mobileAgentMayView`; documents and messages view rule for agents uses it | M |
| `src/services/whatsappService.js` | logging only: phone masked, gateway responses and file names no longer logged | L |

Not touched: `src/app.js`, `src/config/cors.js`, `package.json`, `package-lock.json`, the web app. New files (all under the mobile surface or supporting it): the four `src/routes/mobile*.js`, `src/middleware/mobileGuards.js`, `mobileSession.js`, `loginRateLimit.js`, the models `MobileSession`, `DeviceToken`, `MobileSendLog`, `MobileSendClaim`, the services `mobileAuthService`, `mobileSendService`, `pushService`, the utils `firePush`, `reportPdfBuffer`, `reportSendGate`, the two e2e scripts, `scripts/mobile-curl-checks.sh`, and the tests listed in section 1.

Result: the hunks in existing files do **not** exactly match the expected list. The M hunks (and the added `token` field) change behavior beyond what B-tasks name, and AGENT_RULES 9 allows only the mount line and the B05/B06 hooks. All M hunks apply to mobile sessions only, except the additive `token` field. They need the owner's explicit acceptance, or removal.

## 6. Environment documentation (step 4)

The API repo has no `.env.example`, so the variables are documented in `docs/02-architecture.md`, section "Environment configuration": `MOBILE_ACCESS_TOKEN_TTL`, `MOBILE_REFRESH_TOKEN_TTL_DAYS`, `MOBILE_MIN_APP_VERSION`, `EXPO_PUSH_ACCESS_TOKEN`, plus the four others the code reads (`MOBILE_LOGIN_LIMIT_MAX`, `MOBILE_LOGIN_LIMIT_WINDOW_MS`, and the test hooks `EXPO_PUSH_ENDPOINT`, `EXPO_PUSH_RETRY_BASE_MS`). The minimum-version gate is exercised by `mobile-auth` and `mobile-e2e`, the 15 minute access lifetime by `mobile-auth` (`exp - iat === 900`) and the Expo access token header by `mobile-push`. The refresh lifetime (`MOBILE_REFRESH_TOKEN_TTL_DAYS`) is not asserted by any test; its default and TTL index were checked by reading `mobileAuthService.js` and `MobileSession.js` only.

## 7. Acceptance results

| Task | Check | Result |
|---|---|---|
| B03 | register twice, one record, latest token | met: `mobile-push-token` ("still one record for the device", "latest token and platform win") |
| B03 | two devices, two records | met ("two devices, two records") |
| B03 | invalid token is 400 | met (`register rejects …`, nothing stored) |
| B03 | user A cannot unregister user B's device | met ("A dev-2 record untouched by B unregister") |
| B03 | unauthenticated is 401 | met |
| B03 | logout removes the device record | met; also covered by `mobile-e2e` and curl |
| B04 | counts equal `/admin-reports/stats`; typed counts equal the web list totals; approved is raw | met: `mobile-admin`, `mobile-e2e` |
| B04 | non-admin (including customer service) is 403 | met: `mobile-admin`, `mobile-e2e`, curl |
| B04 | context with and without a request | met: `mobile-admin`, `mobile-e2e` |
| B05 | unapproved 400, unpaid 402, for admin and agent | met: `mobile-send`, `mobile-e2e`, curl |
| B05 | other agent's request 403; staff with no assignee 400; partial 200; all failed 502 | met: `mobile-send` |
| B05 | duplicate within 60 s sends nothing again | met: `mobile-send`, `mobile-e2e`, curl |
| B05 | masked audit, no PDF bytes, invalid contact 400, unknown recipient or channel 400, flags only on applicant success | met: `mobile-send`; flags and audit also in `mobile-e2e` |
| B06 | one push per assign; approve pushes the owner only; no linked request sends nothing and still succeeds; new request pushes active admins | met: `mobile-push` |
| B06 | claim in its last 5 minutes pushes once, a second run pushes none; `DeviceNotRegistered` prunes the token; a throwing push service leaves assign and approve at 200 | met: `mobile-push` |
| B06 | `data` holds only type and id; existing suite unchanged | met: `mobile-push`, curl; section 1 |
| B07 | full suite green or identical to baseline | met: identical 3 plus 1 pre-existing failures, section 1 |
| B07 | e2e test passes | met |
| B07 | sign-off complete, no unchecked high-severity item | backend complete; no high finding. Unverified rows are client or network items (section 2 items 1, 2, 7, 8, 10, 11) |
| B07 | diff hunks exactly match the expected list | **not met**, see section 5 |

Verdict: B03, B04, B05 and B06 meet their acceptance checks. B07 does not yet: one acceptance check (the diff hunks) needs an owner decision, and the open findings F1 and F2 should be triaged before release.
