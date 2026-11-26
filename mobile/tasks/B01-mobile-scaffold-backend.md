# B01 · Mobile router scaffold, min-version gate, rate limits, headers, test harness

**Depends on:** none · **Repo:** `FINVOIS-DEV-API` · **Read first:** `docs/02-architecture.md`, `docs/05-api-contract.md`, `docs/06-security-architecture.md` §9, `docs/10-verified-backend-facts.md`

## Goal
Create the isolated `/api/mobile` surface with cross-cutting protections, so later tasks only add routes.

## Steps
1. Read `src/routes/index.js`, `src/app.js`, `src/config/cors.js`, existing tests in `tests/` (note how Jest and any HTTP test helper are set up; `jest.config.js`).
2. Create `src/routes/mobile.js` exporting an Express router. Mount it in `src/routes/index.js` at `/mobile` (one added line). Confirm the resulting full path is `/api/mobile/*`.
3. Create `src/middleware/mobileGuards.js` with:
   - `mobileSecurityHeaders`: sets `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`. Applied only to the mobile router.
   - `mobileMinVersion`: reads `X-App-Version` header; if `MOBILE_MIN_APP_VERSION` env is set and header version is lower (semver compare) respond 426 `{error:"Update required"}`. Missing header → allow only when env is unset.
   - Rate limiter factories using `express-rate-limit`: `loginLimiter` (5/min keyed by IP+lowercased email), `refreshLimiter` (30/min per deviceId), `sendLimiter` (10/min per user id). Return 429 `{error:"Too many attempts. Try again later."}`.
4. Add `GET /mobile/health` (public) returning `{ok:true}` for connectivity checks; it must not reveal versions.
5. Add a small `tests/mobile-guards.test.js`.

## Files
Create: `src/routes/mobile.js`, `src/middleware/mobileGuards.js`, `tests/mobile-guards.test.js`. Edit: `src/routes/index.js` (mount only).

## Acceptance checks
- [ ] `GET /api/mobile/health` returns 200 and has the security headers.
- [ ] With `MOBILE_MIN_APP_VERSION=1.2.0`, `X-App-Version: 1.1.0` → 426; `1.2.0` → 200.
- [ ] Limiter test: 6th login-limiter hit in a minute → 429.
- [ ] Existing test suite result is unchanged from before your edit (record before/after).
- [ ] `git diff` shows only the files listed above.

## Do not
- Change global CORS, global middleware, or any existing route.
- Add `helmet` globally.
