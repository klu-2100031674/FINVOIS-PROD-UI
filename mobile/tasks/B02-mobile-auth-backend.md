# B02 · Mobile auth: login, refresh rotation, logout

**Depends on:** B01 · **Repo:** `FINVOIS-DEV-API` · **Read first:** `docs/05-api-contract.md` §B1–B3, `docs/06-security-architecture.md` §3, `docs/10-verified-backend-facts.md` (Auth)

## Goal
Short-lived access tokens plus rotating, revocable refresh tokens, limited to `admin` and `customer_service`.

## Steps
1. Create `src/models/MobileSession.js`: `{ userId (ref User, index), familyId (index), refreshTokenHash (unique), deviceId, platform, appVersion, createdAt, expiresAt (TTL index), usedAt, revokedAt }`.
2. Create `src/services/mobileAuthService.js`:
   - `login({email,password,deviceId,platform,appVersion})`: replicate credential checks from `POST /login` in `src/routes/users.js` (bcrypt compare, `is_active`, `email_verified` rule, `assertUserCompanyIsActive`, `getSignupApprovalLoginBlock`). Reuse those helpers by import; if they are not exported, extract minimal exports without changing behavior and note it in the PR. Reject unless `normalizeRole(role)` is `admin` or `customer_service` with 403 `code: ROLE_NOT_ALLOWED`. Same 401 message for unknown email and wrong password.
   - Issue access token (include `tv: user.token_version || 0` so the shared `verifyToken` version check applies; refresh must re-check it and revoke the session family on mismatch): `jwt.sign({userId, tv, typ:'mobile', sid}, JWT_SECRET, {expiresIn: env MOBILE_ACCESS_TOKEN_TTL || '15m'})`.
   - Issue refresh token: `crypto.randomBytes(32).toString('base64url')`; store SHA-256 hash; `expiresAt = now + MOBILE_REFRESH_TOKEN_TTL_DAYS (30)`.
   - `refresh({refreshToken, deviceId})`: find by hash; reject if missing, expired, revoked, or `deviceId` mismatch (401). If `usedAt` already set → revoke every session in the `familyId`, return 401 `code: TOKEN_REUSED`, log a security event. Otherwise mark used and issue a new pair in the same family. Re-read the user and re-check active + allowed role on every refresh.
   - `logout(userId, familyId)`: revoke family.
3. Add routes in `src/routes/mobile.js`: `POST /auth/login` (loginLimiter), `POST /auth/refresh` (refreshLimiter), `POST /auth/logout` (auth via existing `verifyToken`; family derived from the `sid` in the token).
4. Add `requireMobileSession` middleware in `mobileGuards.js`: after `verifyToken`, if token has `typ:'mobile'` verify the `sid` session is not revoked/expired; used by all later mobile routes.
5. Audit-log login success/failure (masked email), refresh reuse, logout. Never log tokens or passwords.
6. Write `tests/mobile-auth.test.js`.

## Acceptance checks
- [ ] Admin and agent can log in; a `user`/`agent`/`company_admin` account gets 403 `ROLE_NOT_ALLOWED`.
- [ ] Wrong password and unknown email return identical 401 bodies.
- [ ] Inactive user → 403; deactivating a user makes the next refresh fail.
- [ ] Refresh returns a new pair and the old refresh token then fails; presenting the old token again revokes the family (new token also fails).
- [ ] Access token expires after the configured TTL (test with TTL=1s).
- [ ] Logout revokes; refresh afterwards → 401.
- [ ] Database never contains a plaintext refresh token (assert in test).
- [ ] Rate limit returns 429 on the 6th rapid login.

## Do not
- Modify `POST /users/login`, `generateToken`, or `verifyToken` behavior.
- Issue web-style 7-day tokens.
