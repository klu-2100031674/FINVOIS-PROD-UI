# 03 · User flows

Notation: `[Screen]` → action → `[Screen]`. Error paths are part of the flow and must be implemented.

## F0 · Launch and login (both roles)

1. App opens → `[Splash]` reads refresh token from secure-store.
2. No token → `[Login]`. Token present → call `POST /api/mobile/auth/refresh`.
   - Success → route by role (F1 admin or F5 agent).
   - Failure (expired/revoked) → clear session → `[Login]` with message "Your session ended. Sign in again."
3. `[Login]` → enter email + password → `POST /api/mobile/auth/login`.
   - Wrong credentials → "Email or password is incorrect."
   - Role not `admin`/`customer_service` → "This app is for admin and support staff." No session is stored.
   - Inactive account → server message shown as returned (403).
   - Too many attempts (429) → "Too many attempts. Try again in a few minutes."
   - Network down → "You're offline. Check your connection."
4. Success → store refresh token in secure-store, access token in memory only → register push token (F9) → route by role.
5. Logout (Profile) → `POST /api/mobile/auth/logout` (revokes session and device token) → wipe secure-store, query cache, cached PDFs → `[Login]`.
6. Inactivity: after the configured background timeout (default 10 min, Q2) the app shows a lock overlay requiring re-entering the password (or biometrics if enabled). Failing that, logout.

## F1 · Admin: dashboard
`[Dashboard]` → `GET /api/admin-reports/stats` (optional `report_type` filter) → cards: Pending, Under review, Approved, Rejected, Total. Raw values only (D3).
- Pull to refresh; auto-refetch on focus and when a "new DPR submitted" push arrives.
- Tap a card → `[Report list]` pre-filtered to that status (Total = no status filter).
- Error → inline error card with Retry; last good numbers stay visible with "Updated hh:mm".

## F2 · Admin: review a report
`[Report list]` → search / filter by status and report type → tap row → `[Report detail]`.
- **View PDF** → download via `GET /api/admin-reports/:id/pdf` to app cache → open viewer. Missing file → "The PDF isn't available yet."
- **Mark under review** → `PATCH /api/admin-reports/:id/review`.
- **Approve** → confirmation dialog ("Approve this report? The customer service team can then send it.") → `PATCH .../approve`.
- **Reject** → sheet requiring a reason (if the web requires one; follow the existing endpoint's body) → `PATCH .../reject`.
- After any action: toast, refetch detail and dashboard stats, return to detail.
- Approved reports show **Send report** (F4). Non-approved reports do not show it.

## F3 · Admin: assign staff
`[Requests]` tab → `GET /api/govt-forms/requests?status=` → list with workflow pill and current handler.
- Tap a request → `[Request detail]` showing applicant, scheme, workflow, handler, linked report status.
- **Assign** (shown when no owner and not locked) → `[Assign sheet]` → `GET /api/govt-forms/customer-service` → choose agent → confirm → `POST /api/govt-forms/requests/:id/assign {csUserId}`.
- **Unassign** (shown when owned and not in CA validation / generated) → confirm → `POST /api/govt-forms/requests/:id/admin-release` → returns to Pending.
- Server pushes "New DPR assigned" to the agent (F9).
- Locked states (with CA / generated): buttons hidden, explanation text shown.

## F4 · Send a report (admin and agent)
Precondition (enforced server-side and mirrored in UI): report `approved` and payment `completed`.
1. Tap **Send report** → `[Send sheet]`.
2. Choose recipients: **Me**, **Assigned staff**, **Applicant** (any combination; Applicant off by default for admin; on by default for agent).
3. Choose channels: **WhatsApp**, **Email** (any combination, at least one).
4. Applicant phone/email prefilled and editable for the applicant recipient only.
5. **Send** → `POST /api/mobile/reports/:id/send` → per-recipient/per-channel result list shown ("Delivered", "Failed: reason").
6. Not approved → 400 "Report must be approved before it can be sent." Not paid → 402 "Payment must be completed before the report can be sent." UI shows the server message and does not offer a bypass.
7. Partial failure: successes are not retried; the user can retry just the failed ones.
8. Every send is audit-logged server-side with actor, recipients, channels, timestamp.

## F5 · Agent: my work
`[My work]` tabs:
- **Open** → `GET /api/govt-forms/requests?queue=open`
- **Mine** → `queue=assigned` (assigned to me or claimed by me)
- **Done** → `queue=completed`
Each row: applicant, scheme, workflow pill, claim countdown when applicable.

## F6 · Agent: claim / release
- Open item → `[Request detail]` → **Claim** → `POST /api/govt-forms/requests/:id/claim` → moves to Mine, claim timer starts (15 minutes until work starts, per `CLAIM_TTL_MS`).
- Already claimed by someone else (409/400) → "Another agent claimed this request." Refresh list.
- **Release** (only before generation starts) → `POST .../release` → returns to Open.
- If the claim times out server-side, the item silently returns to Open; the app refetches on focus and after the "claim expiring" push.

## F7 · Agent: work a request
`[Request detail]` (Mine):
- Applicant card with **Call** (opens dialer via `tel:`, no permission needed) and **WhatsApp** deep link to the applicant's number.
- **Documents** → `GET /api/govt-forms/requests/:id/documents` → list; open in viewer.
- **Messages** → `GET/POST /api/govt-forms/requests/:id/messages`.
- Communication log toggles per existing `PATCH .../communication` (only if listed in the task).
- Report creation happens on the web. The app shows workflow status only (D7): Initiated → Preparing → With CA → Generated.

## F8 · Agent: deliver the report
When workflow is **Generated** (CA-approved) and payment complete: **Send to applicant** → F4 with Applicant preselected. Success moves the request to Done after refetch.

## F9 · Push notifications
| Event | Recipient | Tap destination |
|---|---|---|
| `dpr_assigned` | assigned agent | agent Request detail |
| `report_approved` | agent owning the request | agent Request detail |
| `claim_expiring` | claiming/assigned agent | agent Request detail |
| `dpr_submitted` | all active admins | admin Requests tab (unassigned filter) |

Flow: login → ask notification permission (Android 13+/iOS) with a one-line rationale → get Expo push token → `POST /api/mobile/push/register` → server stores per user+device. Logout or permission revoked → `POST /api/mobile/push/unregister`. Notification tap while app is closed/backgrounded/foreground routes via `notifications/handlers.ts` after the session is restored; if the session is invalid, login first, then route.

## F10 · Failure and edge flows (all required)
- 401 on any call → one silent refresh attempt → retry once → else logout.
- 403 (role/ownership) → toast with server message, no retry.
- 5xx/network → error state with Retry; no automatic retry loops beyond TanStack defaults (max 2).
- Device time wrong / token invalid → treated as 401.
- Deep link to an item the user can't access → "You don't have access to this request." and land on the list.
- App killed mid-send: the server operation is idempotent per (report, recipient, channel, 60 s window) to avoid duplicate messages.
