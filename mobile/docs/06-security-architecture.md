# 06 · Security architecture

Goal: the app handles financial-loan documents and can send them to third parties. Design assuming the phone can be lost, the app binary can be reverse-engineered, and the network is hostile. Baseline: OWASP MASVS v2 Level 1 in full plus the Level 2 items marked (L2). "Hack-free" is not a real guarantee; the goal is that no single client compromise exposes other users' data or bypasses server rules.

## 1. Principles
1. **The server is the only authority.** The app can be modified by an attacker, so it holds no rules that matter. Role checks, ownership checks, approval/payment gates, and recipient limits are enforced in the API.
2. **Nothing secret in the binary.** Reverse engineering the APK/IPA must yield only the public API URL.
3. **Short-lived credentials, revocable server-side.**
4. **Least data on the device, least time on the device.**
5. **Fail closed.** Unknown role, expired token, integrity failure → deny.

## 2. Threat model (summary)
| Threat | Impact | Control |
|---|---|---|
| Lost/stolen unlocked phone | Access to reports and send | Inactivity lock, re-auth, remote revoke, tokens in Keystore/Keychain |
| Stolen refresh token | Long-term account takeover | Rotating refresh tokens with reuse detection, device binding by `deviceId`, revoke-all on reuse |
| Token theft from device storage | Same | `expo-secure-store` only; access token memory-only |
| MITM on hostile Wi-Fi | Credential and document theft | TLS only, no cleartext, ATS on iOS, Android `cleartextTrafficPermitted=false` |
| Reverse-engineered app calls API directly | Abuse | Server authz on every route, rate limits, per-user throttles; app is not trusted |
| Privilege escalation (agent calls admin route) | Data breach | Existing `requireRole` + new mobile routes with explicit role allow-lists; tests per route |
| IDOR (agent opens another agent's request) | Data breach | Ownership check on every request-scoped route (`isCsOwnerOfRequest`); new send route re-checks |
| Credential stuffing / brute force | Account takeover | Login rate limit per IP and per email, lockout/backoff, generic errors |
| Malicious send (spam applicant, exfiltrate PDF to attacker number) | Data leak | Recipient allow-list: only me / assigned staff / applicant-on-record; override of applicant contact audited and limited |
| Push payload leaks PII on lock screen | Privacy | Payload carries only `type` and `id`; generic titles |
| Screenshot / screen recording of reports | Leak | `FLAG_SECURE` on Android, blur on iOS app-switcher, capture detection on iOS PDF screen |
| Malicious deep link / notification payload | Unauthorized navigation | Allow-list of routes; ids re-fetched with auth; never trust payload for authorization |
| Rooted/jailbroken device | Runtime tampering | Detect, warn, log; block send-report on compromised device (Q5, L2) |
| Compromised dependency | Supply-chain | Pinned versions, lockfile, `npm audit` in CI, minimal deps, Expo SDK modules first |
| Leaked build credentials | Malicious release | Secrets only in EAS/CI secret store, Play App Signing, 2FA on Google/Apple/Expo accounts |
| Malicious OTA update | Code injection | OTA disabled unless code signing is configured; updates signed with a key held in EAS |

## 3. Authentication and session
- Dedicated mobile auth (B1–B3). Web login is unchanged.
- **Access token:** JWT, 15 min, contains `userId`, `typ: "mobile"`, `sid` (session id). Held in memory only.
- **Refresh token:** 256-bit random, stored server-side only as a SHA-256 hash with `familyId`, `deviceId`, `expiresAt` (30 days), `usedAt`. Rotated on every refresh. Reuse of a used token revokes the family.
- **Client storage:** refresh token in `expo-secure-store` with `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Nothing else sensitive is persisted.
- **Server verification per request:** the existing `verifyToken` re-reads the user from DB, so deactivating a user takes effect immediately for existing routes. New mobile routes additionally check the session `sid` is not revoked.
- **Logout everywhere:** revoke family; delete device push token.
- **Inactivity lock:** background > timeout → overlay; unlock with password re-entry (calls login) or biometrics gated by a secure-store item requiring authentication (L2).
- **Passwords never stored** on device. No "remember password".
- Account state changes (deactivated, role changed) are respected on next request because the server re-reads the user.

## 4. Transport
- HTTPS only. Android `network_security_config` with `cleartextTrafficPermitted="false"`; iOS App Transport Security defaults; no `NSAllowsArbitraryLoads`.
- **Certificate pinning: deferred** (decision). Hard-pinning risks locking out every user if certs rotate. If adopted later: pin SPKI of the CA intermediate plus a backup pin, ship via signed OTA, and add a kill-switch. Revisit at owner request.
- Timeouts: 15 s connect/read. No automatic retry of non-idempotent POSTs.

## 5. Data on device
- Persisted: refresh token (secure-store), device id (random UUID in secure-store), optional biometric flag.
- Never persisted: access token, passwords, report data in AsyncStorage, query cache to disk (TanStack Query persistence is **not** enabled).
- PDFs: downloaded to `FileSystem.cacheDirectory/reports/`, opened, deleted on viewer close, on logout, and on app start (sweep).
- No copy to shared/external storage; sharing only through explicit user action via share sheet.
- Clipboard: never write sensitive values programmatically.
- Backups: `android:allowBackup="false"`; iOS: exclude cache directory from backup; nothing sensitive to back up anyway.

## 6. UI-level protections
- Android: `FLAG_SECURE` on report/PDF/documents screens (via `expo-screen-capture` `preventScreenCaptureAsync`).
- iOS: `expo-screen-capture` blocks capture on the PDF screen; overlay blur when app enters background (app switcher).
- Inputs: `secureTextEntry` for password, `autoComplete` set appropriately, no autofill of unrelated fields.
- No sensitive values in navigation params or URLs beyond opaque ids.

## 7. Device integrity (L2, Q5)
- Detect root/jailbreak/debugger/emulator with a maintained library approved in task A11 (candidate: `jail-monkey` or equivalent; must support the New Architecture and be actively maintained).
- Behavior: show a warning banner, send `integrity: "suspect"` in the `X-Device-Integrity` header (informational), block **Send report** for suspect devices. Never rely on this alone; attackers can bypass client checks.
- Play Integrity / App Attest: optional hardening for a later release; document only.

## 8. Build and release hardening
- Hermes engine; Android release builds with R8 minification and resource shrinking enabled; no source maps in the shipped bundle (upload to the crash tool privately).
- `debuggable=false`, no dev menu, no `console.*` in release (strip via babel plugin `transform-remove-console`).
- No test credentials, feature flags exposing admin functions, or alternate API URLs selectable at runtime.
- Signing: Google Play App Signing; upload key protected; iOS distribution cert managed by EAS.
- Dependency policy: exact versions in `package.json` (or lockfile committed), `npm audit --omit=dev` must show no high/critical before release, review changes to native modules.
- Reproducible CI build via EAS with secrets in EAS environment variables.

## 9. Backend requirements for the mobile surface
- Rate limits (express-rate-limit is already a dependency): login 5/min per IP+email, refresh 30/min per device, send 10/min per user.
- Helmet-style security headers on `/api/mobile/*` responses (`X-Content-Type-Options`, `Cache-Control: no-store` for auth and report routes). Do not change global behavior of existing routes.
- Input validation (schema validation) on every new route; reject unknown fields for send.
- Structured audit logging for: login success/failure, refresh reuse, logout, assign/unassign, approve/reject (existing), send report. Include user id and request id; exclude tokens, passwords, full contact details.
- CORS is irrelevant to native apps; do not loosen the existing CORS config for mobile.

## 10. Existing backend observations (relevant, out of scope to fix in this project unless owner agrees)
- Web tokens are 7-day JWTs with no revocation list; mobile deliberately does not reuse this model.
- `POST /users/login` had no rate limiter; fixed 2026-09-30 with `loginRateLimit` (see doc 10). The mobile login still gets its own stricter limiter (B01/B02).
- `POST /admin-reports/:id/email|whatsapp` has no approved/paid gate; the app does not call it.

## 11. Security acceptance checklist (used in task A13 and before every release)
- [ ] Token only in secure-store; grep shows no token in AsyncStorage/logs.
- [ ] Release APK/IPA strings contain no secrets (run `strings`/`apkleaks`-style scan).
- [ ] Non-admin/agent account cannot log in; agent cannot call admin routes (tested with curl).
- [ ] Agent cannot open or send another agent's request.
- [ ] Reused refresh token revokes the session.
- [ ] Not-approved and not-paid reports cannot be sent by any role.
- [ ] Cleartext HTTP fails on both platforms.
- [ ] Screenshots blocked on PDF screen (Android) and blur in app switcher (both).
- [ ] Push payloads contain only type and id.
- [ ] Release build has no console output and cannot open the dev menu.
- [ ] `npm audit --omit=dev` clean of high/critical.
- [ ] Rate limits trigger (429) in tests.
