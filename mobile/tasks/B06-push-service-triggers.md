# B06 · Push service and event triggers

**Depends on:** B03 · **Repo:** `FINVOIS-DEV-API` · **Read first:** `docs/08-push-notifications.md` (entire), `docs/10-verified-backend-facts.md` (Department requests, Claim expiry job)

## Goal
Send the four push events without ever affecting the primary request's success.

## Steps
1. Create `src/services/pushService.js`:
   - `sendToUsers(userIds, {title, body, data})`: look up enabled `DeviceToken`s, chunk ≤100, POST to Expo push endpoint with optional `Authorization: Bearer EXPO_PUSH_ACCESS_TOKEN`, handle receipts/errors, delete tokens reporting `DeviceNotRegistered`, log failures without token values.
   - Named helpers: `notifyDprAssigned(csUserId, requestId)`, `notifyReportApproved(report)` (resolve owner via `DepartmentRequest.reportId` → `claimedBy || assignedTo`), `notifyClaimExpiring(request)`, `notifyDprSubmitted(request)` (all active admins). Use the generic copy from doc 08. `data` is `{type, id}` only.
   - Use Node's built-in `fetch` if the Node version supports it; otherwise use an existing HTTP dependency. Do not add a new dependency without justification.
2. Hooks (each a single fire-and-forget line with `.catch`; place after the primary save succeeded):
   - `POST /requests/:id/assign` in `src/routes/govtForms.js` → `notifyDprAssigned`.
   - `PATCH /:id/approve` in `src/routes/adminReports.js` → after `await onReportApproved(report)` → `notifyReportApproved`.
   - New DepartmentRequest creation points (`ensure*DepartmentRequest` services: find them under `src/services/`) → `notifyDprSubmitted`.
3. Claim expiring: in `src/services/claimExpiryService.js` add an `notifyExpiringClaims()` pass inside `expireStaleClaims`, selecting requests with `claimedAt` in `[now-TTL, now-(TTL-5min)]`, no generation/draft/report, and `expiryPushSentAt` unset; send and set `expiryPushSentAt`. Add optional field `expiryPushSentAt: Date` to `src/models/DepartmentRequest.js` (only allowed schema edit on an existing model). Reset it when `claimedAt` is reset (assign/claim) — verify where `claimedAt` is written and clear the field there too, or compare `expiryPushSentAt < claimedAt`.
4. Tests: `tests/mobile-push.test.js` (mock fetch): chunking, pruning, recipient resolution per event, once-only claim expiry, and that a thrown `pushService` error does not change the HTTP status of assign/approve.

## Acceptance checks
- [ ] Assign → exactly one push to the assigned agent's devices.
- [ ] Approve → push to the owning agent only; approving a report with no linked request sends nothing and still succeeds.
- [ ] New request → push to all active admins with devices.
- [ ] Claim in its last 5 minutes → one push; second job run → none.
- [ ] Mock Expo returns `DeviceNotRegistered` → token removed.
- [ ] Forcing `pushService` to throw leaves assign/approve responses unchanged (200).
- [ ] Payload contains only `type` and `id` in `data`; generic title/body.
- [ ] Existing suite results unchanged.

## Do not
- Put names, amounts, phones, or report titles in payloads.
- `await` push inside the request path.
