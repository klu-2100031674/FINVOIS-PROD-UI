# 08 · Push notifications

## Provider
Expo Push Service (Q6 recommendation). The API sends to `https://exp.host/--/api/v2/push/send`; Expo forwards to FCM (Android, HTTP v1 credentials) and APNs (iOS). Credentials (FCM service account key, APNs key) are uploaded to EAS, never committed. Optionally enable Expo "enhanced push security" and set `EXPO_PUSH_ACCESS_TOKEN` on the API.

## Data model
`DeviceToken` collection: `{ userId, deviceId, platform, expoPushToken, createdAt, lastSeenAt, disabledAt }`, unique index on `(userId, deviceId)`. One user may have several devices. Tokens are deleted on logout/unregister and when Expo returns `DeviceNotRegistered`.

## Events, recipients, triggers
| Type | Recipient query | Trigger location (existing code) | Payload data |
|---|---|---|---|
| `dpr_assigned` | the `csUserId` assigned | after `request.save()` in `POST /govt-forms/requests/:id/assign` | `{type, id: requestId}` |
| `report_approved` | `claimedBy` or `assignedTo` of the DepartmentRequest whose `reportId` equals the report | after `onReportApproved(report)` in `PATCH /admin-reports/:id/approve` | `{type, id: requestId}` |
| `claim_expiring` | current owner of a `claimed`/`assigned` request with no generation started and `claimedAt` between `TTL-5min` and `TTL` | new pass inside `claimExpiryService.expireStaleClaims` (job runs every 15 s) | `{type, id: requestId}` |
| `dpr_submitted` | all active `admin` users with a device token | where a new DepartmentRequest is created (`ensure*DepartmentRequest` services) | `{type, id: requestId}` |

Rules:
- Pushing must never block or fail the primary action. Call `pushService.*` fire-and-forget with `.catch(log)`.
- `claim_expiring` must be sent at most once per claim: store `expiryPushSentAt` on the request (new optional field) or keep an in-memory set keyed by `requestId+claimedAt`. Use the DB field so it survives restarts. This adds one optional field to `DepartmentRequest`; flagged in task B06 as the only schema touch on an existing model.
- Batch tokens in chunks of ≤100 per Expo request; retry with backoff on 429/5xx; prune tokens on `DeviceNotRegistered`.

## Payload and privacy
- Titles/bodies are generic, no applicant names, amounts, phones, or report titles:
  - `dpr_assigned`: "New DPR assigned" / "Open the app to view it."
  - `report_approved`: "Report approved" / "A report is ready to send."
  - `claim_expiring`: "Claim expiring soon" / "A request will be released soon."
  - `dpr_submitted`: "New DPR submitted" / "Open the app to view pending requests."
- `data` = `{type, id}` only. The app re-fetches details with its own authenticated call; if the fetch returns 403/404 it shows "You don't have access to this request."
- Never trust `data` for authorization decisions.

## Client behavior (`app/src/notifications`)
1. After login and role routing, show the rationale screen once; if allowed, call `Notifications.requestPermissionsAsync()`.
2. Android: create channel `default` (importance high) before requesting a token (required on Android 8+).
3. Get token with `getExpoPushTokenAsync({ projectId })` (projectId from EAS config, not a secret).
4. `POST /mobile/push/register`. Re-register on app start if the token changed.
5. Foreground: show in-app banner and refetch dashboard/list queries; do not show duplicate system alert.
6. Tap handling (`addNotificationResponseReceivedListener` and `getLastNotificationResponseAsync` for cold start): wait for session restore → validate `type` against the allow-list → navigate: agent types → Request detail `id`; `dpr_submitted` → admin Requests tab.
7. Logout: `unregister`, cancel scheduled/local notifications, clear badge.

## Failure behavior
- Permission denied: app works normally; Profile shows "Notifications are off" with a link to OS settings.
- Token registration fails: log (no PII), retry on next launch.
- Push is best-effort. Every push-driven screen must also refresh on focus/pull-to-refresh so nothing depends on push delivery.

## Tests
- API: unit tests for `pushService` with mocked fetch (chunking, pruning), and trigger tests asserting `pushService` is called with the right recipients and that a `pushService` failure does not fail the assign/approve request.
- App: handler unit tests for allow-list routing and invalid payload rejection; manual device test matrix in doc 09.
