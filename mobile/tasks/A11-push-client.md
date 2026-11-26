# A11 · Push notifications client and deep links

**Depends on:** A03, B06 · **Read first:** `docs/08-push-notifications.md` (client behavior), `docs/03-user-flows.md` F9, `docs/06-security-architecture.md` (deep-link threat)

## Goal
Register for push, show alerts, and route taps safely.

## Steps
1. `src/notifications/register.ts`: rationale screen once (persist "seen" in secure-store or a non-sensitive flag), request permission, Android channel `default` (importance high) created first, get Expo token with `projectId` from config, call `POST /mobile/push/register`; re-register on launch when token differs. Add API `src/api/push.ts`.
2. Wire A02's logout hook to `POST /mobile/push/unregister` and clear badge/local notifications.
3. `src/notifications/handlers.ts`: foreground handler (banner + invalidate dashboard/list queries), response listener plus `getLastNotificationResponseAsync` for cold start. Validate `data.type` against the allow-list `dpr_assigned | report_approved | claim_expiring | dpr_submitted` and `data.id` against `^[a-f0-9]{24}$`; ignore anything else. Wait for session restore; if none, route after login.
4. Navigation targets: agent types → agent `RequestDetail(id)`; `dpr_submitted` → admin Requests tab. A role mismatch (agent receives admin type or vice versa) is ignored.
5. Profile shows notification status with "Open settings" when denied.
6. Tests: allow-list and id validation, role mismatch ignored, cold-start routing waits for session.

## Acceptance checks
- [ ] Real devices (Android 13+, iOS): permission prompt appears after rationale; token registered (verify server record).
- [ ] Assign in web/app → agent device receives push; tap opens the correct request from killed, background, and foreground states.
- [ ] Malformed payload (send via Expo push tool) does nothing harmful.
- [ ] After logout no pushes arrive on that device.
- [ ] Denying permission leaves the app fully working.

## Do not
- Put PII into local notifications or navigation params.
- Trust the payload for authorization.
