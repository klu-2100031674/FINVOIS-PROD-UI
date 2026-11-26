# B03 · Device push tokens

**Depends on:** B02 · **Repo:** `FINVOIS-DEV-API` · **Read first:** `docs/05-api-contract.md` §B4, `docs/08-push-notifications.md`

## Goal
Store and remove Expo push tokens per user and device.

## Steps
1. Create `src/models/DeviceToken.js` per doc 08 (unique `(userId, deviceId)`).
2. Add to `src/routes/mobile.js` (both behind `verifyToken` + `requireMobileSession`):
   - `POST /push/register {expoPushToken, deviceId, platform}` → validate token matches `^ExponentPushToken\[.+\]$` or `^ExpoPushToken\[.+\]$`; upsert; set `lastSeenAt`; clear `disabledAt`.
   - `POST /push/unregister {deviceId}` → delete the caller's record for the device.
3. Make logout (B02) also delete the device token for the session's `deviceId`.
4. Tests: `tests/mobile-push-token.test.js`.

## Acceptance checks
- [ ] Register twice with the same device → one record, latest token.
- [ ] Two devices for one user → two records.
- [ ] Invalid token format → 400.
- [ ] User A cannot unregister user B's device (record untouched).
- [ ] Unauthenticated → 401.
- [ ] Logout removes the device record.

## Do not
- Store any user PII in the token record.
