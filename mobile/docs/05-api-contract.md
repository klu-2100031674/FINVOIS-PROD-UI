# 05 · API contract

Base URL: `${EXPO_PUBLIC_API_BASE_URL}/api` (routes below are relative to `/api`). Verify the exact mount prefix in `FINVOIS-DEV-API/src/routes/index.js` in task B01 before coding; existing-route paths below are from route files and are relative to their mount.

All requests: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`. Errors use `{ "error": "message" }` or `{ "success": false, "error": "message" }` (existing routes are inconsistent; the client error helper must handle both).

## A. Existing endpoints the app uses (do not change)

| Purpose | Method + path | Role | Notes |
|---|---|---|---|
| Report list | `GET /admin-reports?status&report_type&search&start_date&end_date&page&limit&sort` | admin | `status` values: `pending_validation`, `under_review`, `approved`, `rejected`; default excludes `draft` |
| Report detail | `GET /admin-reports/:id` | admin | |
| Report PDF | `GET /admin-reports/:id/pdf` | admin | blob |
| Mark under review | `PATCH /admin-reports/:id/review` | admin | |
| Approve | `PATCH /admin-reports/:id/approve` body `{validation_notes?, send_email?}` | admin | allowed from `pending_validation` or `under_review`. Server also runs `onReportApproved`, creates an in-app Notification, and emails the report owner (default `send_email=true`). See Q8 |
| Reject | `PATCH /admin-reports/:id/reject` body `{rejection_reason (required), validation_notes?, send_email?}` | admin | |
| List agents | `GET /govt-forms/customer-service` | admin, department | returns `{data:[{_id,name,email}]}` |
| Request list | `GET /govt-forms/requests?status=&queue=` | admin, agent | each item includes `workflow {key,label}`; agent `queue` = `open` \| `claimed` \| `assigned` \| `completed`; completed supports `search`, `workflowStatus`, `startDate`, `endDate` |
| Request counts | `GET /govt-forms/requests/counts` | admin, agent | `{open, assigned, department, completed}` |
| Request detail | `GET /govt-forms/requests/:id` | admin, agent | |
| Assign | `POST /govt-forms/requests/:id/assign` body `{csUserId}` | admin | fails if already owned |
| Unassign | `POST /govt-forms/requests/:id/admin-release` | admin | blocked once with CA or generated |
| Claim | `POST /govt-forms/requests/:id/claim` | agent | |
| Release | `POST /govt-forms/requests/:id/release` | agent | only before generation starts |
| Documents | `GET /govt-forms/requests/:id/documents` | staff | |
| Messages | `GET` / `POST /govt-forms/requests/:id/messages` | staff | |
| Report PDF (agent) | `GET /govt-forms/requests/:id/report/pdf` | staff | approved reports only |

Do NOT use for mobile: `POST /govt-forms/requests/:id/send-email` and `/send-whatsapp` (agent-only, applicant-only, type-your-own address). Do NOT use `POST /admin-reports/:id/email|whatsapp` (now gated on approved + paid, but sends only to the owner or a typed address). The new send endpoint replaces both for the app.

## B. New endpoints (`/mobile/*`, built in Backend tasks)

### B1 `POST /mobile/auth/login` (public, rate limited)
Body `{ "email": string, "password": string, "deviceId": string, "platform": "ios"|"android", "appVersion": string }`
Success 200:
```json
{ "success": true,
  "user": { "id": "...", "name": "...", "email": "...", "role": "admin|customer_service" },
  "accessToken": "<JWT, 15 min>",
  "refreshToken": "<opaque random, 30 days>" }
```
Errors: 400 missing fields; 401 `Invalid credentials`; 403 inactive account or role not allowed (`{ "error": "This app is for admin and support staff.", "code": "ROLE_NOT_ALLOWED" }`); 429 rate limited.
Server logic: reuse the same credential checks as `POST /users/login` (bcrypt compare, `is_active`, email verified, company block, signup approval). Reject roles other than `admin` (after `normalizeRole`) and `customer_service`. Never reveal whether an email exists.

### B2 `POST /mobile/auth/refresh` (public, rate limited)
Body `{ "refreshToken": string, "deviceId": string }`
200 → new `{accessToken, refreshToken}` (rotation: old refresh token is invalidated). If an already-used refresh token is presented, revoke the whole session family and return 401 (`code: "TOKEN_REUSED"`).

### B3 `POST /mobile/auth/logout` (auth)
Revokes the current session family and deletes this device's push token. Always 200 for idempotence.

### B4 `POST /mobile/push/register` (auth)
Body `{ "expoPushToken": string, "deviceId": string, "platform": "ios"|"android" }` → upsert by (userId, deviceId). `POST /mobile/push/unregister` `{deviceId}`.

All three `/mobile/admin/*` routes: admin only (`customer_service` gets 403 `{ error: "Insufficient permissions" }`), plus the usual mobile session checks (401 without a live session; a web token is not accepted). Built in B04, tested by `tests/mobile-admin.test.js`.

### B5 `GET /mobile/admin/stats?report_type=` (admin)
Same numbers as `/admin-reports/stats` but supports `report_type` (existing stats route does not). Response shape identical: `{ success, data: { pending, under_review, approved, rejected, total, today_pending } }`. Raw counts, no offsets. `total` is every report that is not `draft` (so it includes `pending_payment`), exactly like the web route.

`report_type` is optional; empty means all types. It uses the web list's matching (case-insensitive on `report_type` or `templateId`, with the Format CC alias family, so `frcc2`, `Format CC2`, `CC2` are the same filter) and is matched literally, never as a regex. A repeated parameter or a value over 100 characters returns 400 `{ success:false, error }`. The counts for a type equal `pagination.total_count` of `GET /admin-reports?report_type=…&status=…` (asserted in the test).

### B5b `GET /mobile/admin/staff` (admin)
Active customer-service agents with their current load, for the assign sheet: `{ success, data: [{ id, name, email, openCount }] }` sorted by name. `openCount` counts requests the agent owns (`assignedTo` or `claimedBy`) whose status is `assigned` or `claimed`; one request counts once per agent. Inactive agents and other roles are not listed.

### B6 `GET /mobile/admin/reports/:id/context` (admin)
Resolves the DepartmentRequest linked to a report (via `DepartmentRequest.reportId`; newest one if there are several). Used by report detail to show the handler and deep-link to the Requests screen. The fields sit at the top level next to `success` (no `data` wrapper):
```json
{ "success": true,
  "requestId": "<id>" | null,
  "workflow": { "key": "ca_validation", "label": "DPR sent for CA validation" } | null,
  "assignedTo": { "id": "...", "name": "...", "email": "..." } | null,
  "claimedBy":  { "id": "...", "name": "...", "email": "..." } | null,
  "canAssign": false, "canUnassign": false }
```
`workflow` comes from `getDprWorkflowStatus`; `canAssign` / `canUnassign` from `canAdminAssignRequest` / `canAdminUnassignRequest`. A report with no linked request returns `requestId: null`, `workflow`/`assignedTo`/`claimedBy` null and both flags `false`. The flags are computed from the request itself, so a deleted staff account only hides the name (`assignedTo`/`claimedBy` null) and does not change what the admin can do. A malformed id returns 400 and an unknown report 404, both `{ success:false, error }`.

### B7 `POST /mobile/reports/:id/send` (admin, customer_service)
Body:
```json
{ "recipients": ["me","staff","applicant"],
  "channels": ["whatsapp","email"],
  "applicant": { "phone": "optional override", "email": "optional override" } }
```
Rules (all server-side):
1. Report exists and is in caller's allowed scope. Agent must be the owner of the linked request (`isCsOwnerOfRequest`); admin any.
2. `validation_status === 'approved'` else 400.
3. `payment.status === 'completed'` else 402 `error_code: PAYMENT_REQUIRED`. No bypass for any role.
4. `me` = caller's own email/phone on file. `staff` = the linked request's assignee/claimer (400 if none). `applicant` = customer on the request unless overridden.
5. Phone normalized to E.164 (10-digit numbers get `+91`), email validated; max 3 recipients, 2 channels.
6. PDF loaded via existing `resolveReportPdfBuffer`/`downloadReportPdfBuffer`; 404 if missing.
7. Idempotency: same (report, recipient, channel) within 60 s returns the previous result without resending.
8. Audit log entry: actor id, report id, recipients (masked), channels, result, timestamp. No PDF content, no full phone/email in logs.
Response 200: `{ success:true, results:[{ recipient, channel, status:"sent"|"failed", reason? }] }`. Overall 200 even on partial failure; total failure of all → 502 with results.
Side effects: set `request.emailSent` / `whatsAppSent` flags only when the applicant recipient succeeded (parity with the web agent endpoints).

### Existing routes added by D12 (no backend change)
| Call | Who | Notes |
|---|---|---|
| `GET /govt-forms/requests?queue=in-progress`, `?queue=cs-completed` | customer_service | The caller's work, split by the server's work bucket, as on the web. `queue=completed` is no longer used: it left out started requests whose status was still claimed or assigned, and held reports not yet approved |
| `POST /govt-forms/requests/:id/documents` (multipart field `files`), `DELETE .../documents/:docId` | admin, customer_service | Allowed when the list's `meta.canMutate` is true. 5 MB per file, 10 files per request |
| `GET /govt-forms/requests/:id/report/excel` | customer_service, admin | Approved reports only |
| `GET /admin-reports/:id/excel` | admin | Not for theory reports |
| `PATCH /admin-reports/:id/approve` | admin | Now sends `send_email`, optional `validation_notes`, and `amount_to_collect` when `payment.collect_on_download` is true and the report is unpaid (the server answers 400 without it) |
| `PATCH /admin-reports/:id/reject` | admin | Now sends `send_email` |
| `PATCH /admin-reports/:id/re-review` | admin | Moves a rejected report back to under review |
| `GET /admin-reports/whatsapp-status` | admin | Warning in the send sheet |
| `GET /admin-reports?company_id=&start_date=` | admin | Report list filters |
| `GET /company/all` | admin | Company filter options |
| `GET /users/profile` | both | Only `must_change_password` is read |
| `PATCH /users/password`, `POST /users/change-password` | both | Change password, and replace a temporary password. The app signs out afterwards |

### Existing routes added by D13 (no backend change)
All under `/email-automation`, for admin and customer_service on the server. The app uses them for the admin only.

| Call | Notes |
|---|---|
| `GET /requests`, `GET /requests/:id?page=&limit=&validation=` | Requests with `stats`; one request with a page of recipients |
| `PUT /requests/:id/schedule`, `POST /schedules` | `templateId`, `attachmentIds`, and either `scheduledDates` (each inside 10:00 AM to 11:59 PM IST, 120 at most) or `scheduledAt` for send now. Unknown placeholders answer 400 |
| `POST /requests/:id/cancel`, `/clone`, `/retry-failed`, `DELETE /requests/:id`, `DELETE /requests/:id/recipients/:rid` | Allowed by request status, see `requestActions` in `utils/emailAutomation.ts` |
| `GET, POST /templates`, `PUT, DELETE /templates/:id` | The server keeps a plain body as text and turns its line breaks into `<br/>` when sending |
| `GET, POST /folders`, `DELETE /folders/:id`, `GET /folders/:id/contacts`, `DELETE /folders/:id/contacts/:cid`, `GET /folder-emails?folderIds=` | `folder-emails` gives the unique emails a send would reach |
| `POST /folders/:id/upload` | Multipart `file` and `mapping`. 25 MB |
| `POST /attachments`, `GET /attachments/:id/download` | Multipart `file`. 10 files and 10 MB per email, template files included |
| `GET /quota`, `PUT /quota` | `PUT` is admin only |

### B8 Push payload contract
`{ "to": "<expo token>", "title": "...", "body": "...", "data": { "type": "dpr_assigned|report_approved|claim_expiring|dpr_submitted", "id": "<requestId>" }, "sound": "default", "channelId": "default" }`
`data` contains only `type` and `id`. See doc 08.

## C. Contract testing
Every new endpoint has a Jest + supertest test in `FINVOIS-DEV-API/tests/mobile-*.test.js` covering: happy path, wrong role, missing/invalid token, and each rule above. The app's API modules are typed from this document; if the contract changes, update this file first.
