# 09 · Testing and release

## Test layers
| Layer | Tool | Where | Covers |
|---|---|---|---|
| API unit/integration | Jest 30 (+ supertest if already present; otherwise add as devDependency with justification) | `FINVOIS-DEV-API/tests/mobile-*.test.js` | Every new endpoint: happy path, wrong role, missing token, gating rules, rate limits, refresh reuse |
| App unit | Jest + React Native Testing Library | `app/src/**/__tests__` | api modules (mock axios), session/refresh logic, notification allow-list, role routing, formatters |
| App component | RNTL | same | Sheets, StatusPill, error/empty/loading states |
| Manual device QA | Checklist below | Physical Android + iPhone + emulators | Full flows, push, PDF, lock, offline |
| Security | Checklist in doc 06 §11 | curl + device | Before each release |

## Coverage expectations
- New backend mobile code: every branch in the send rules and auth rotation covered.
- App: session/refresh, role guard, and notification routing ≥ 90% lines. UI screens: smoke test each renders in loading/error/empty/data states.
No coverage number replaces the acceptance checks in each task.

## Manual QA matrix
Devices: Android 10+ low-end, Android latest (Pixel), iPhone with current iOS and one older supported iOS. Test on real devices for push and PDF.

Admin script: login → dashboard counts equal `/admin-reports/stats` raw values → tap each card → open report → view PDF → mark under review → approve → send to me + staff via WhatsApp and email → check receipt → reject a different report with a reason → Requests tab → assign → unassign → logout → confirm login required.

Agent script: login → Open tab → claim → confirm in Mine → wait for claim expiry push → release → get assigned by admin (push arrives, tap opens request) → documents → messages → call → after CA approves: push → open → send to applicant → appears in Done.

Negative: wrong password; non-allowed role; offline at every screen; airplane mode mid-send; expired refresh token; revoked user; tap push for inaccessible request; deny notification permission; rotate device; font scale 1.3; screenshot attempt on PDF screen; background 10 min → lock.

## CI (recommended)
On every push: install with lockfile, typecheck, lint, tests, `npm audit --omit=dev` (fail on high/critical). On tag: EAS build (staging profile) and upload artifacts.

## Environments
| Env | API base | EAS profile | Purpose |
|---|---|---|---|
| dev | local/tunnel | development | developer builds |
| staging | staging API + non-production data | preview | QA, store reviewers' demo accounts |
| production | production API | production | store release |
Profiles set `EXPO_PUBLIC_API_BASE_URL`. No runtime environment switcher in release builds.

## Release procedure
1. All tasks in the index `DONE`; open questions resolved.
2. Bump `version`; EAS increments build numbers.
3. `eas build --profile production --platform all`.
4. Internal testing track (Play) and TestFlight; run full QA matrix and security checklist on those exact builds.
5. Submit for review with store assets and demo credentials (doc 07).
6. Stage rollout on Play (e.g., 10% → 50% → 100%); watch crashes and 401/5xx rates.
7. Tag the release in git; store the mapping/symbol files privately.

## Rollback
- Play/App Store cannot recall installs; halt staged rollout, ship a fixed build.
- Server-side kill-switch: `/mobile/*` returns 426 `{ "error": "Update required" }` when an app version is below a configured minimum (`MOBILE_MIN_APP_VERSION`), letting the API force upgrades. Implemented in task B01 as a middleware reading the `X-App-Version` header.
