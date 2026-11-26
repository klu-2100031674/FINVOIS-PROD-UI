# A02 · API client, secure session, refresh interceptor

**Depends on:** A01, B02 · **Read first:** `docs/06-security-architecture.md` §3–§5, `docs/05-api-contract.md` §B1–B3, `docs/03-user-flows.md` F0, F10

## Goal
One axios client and one session module that own tokens, refresh, and logout cleanup.

## Steps
1. `src/auth/session.ts`: in-memory `accessToken`; refresh token and `deviceId` in `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Generate `deviceId` once (random UUID) and persist. API: `login`, `restore`, `logout`, `getAccessToken`, `subscribe`.
2. `src/api/client.ts`: axios instance, base URL from `Constants`/`process.env.EXPO_PUBLIC_API_BASE_URL`, 15 s timeout, headers `X-App-Version`, `X-Platform`. Request interceptor adds Bearer. Response interceptor on 401: single in-flight refresh promise shared by concurrent requests, retry the original once, on failure call `logout('expired')`. No retry for non-idempotent POST unless it was a 401 pre-processing (safe because the 401 means it did not execute).
3. `src/utils/errors.ts`: `apiErrorMessage(err)` handling both `{error}` and `{success:false,error}` shapes; friendly messages for network, 429, 426 (update required → blocking screen), 5xx; never shows raw stack/exception text.
4. `src/api/auth.ts`: typed `login`, `refresh`, `logout` per doc 05.
5. Query client defaults: retry ≤ 2 (not for 4xx), no persistence.
6. On logout: clear secure-store refresh token, memory token, query cache, cached PDFs directory, and call the push unregister hook (stub until A11).
7. Unit tests for: concurrent 401s trigger exactly one refresh; refresh failure logs out; token never written to AsyncStorage; error helper shapes.

## Acceptance checks
- [ ] Tests above pass.
- [ ] Manual: kill and reopen the app → session restores via refresh; revoke session server-side → app returns to login.
- [ ] Grep proves no `AsyncStorage`, no `console.log` of tokens.
- [ ] Setting an old app version below `MOBILE_MIN_APP_VERSION` surfaces the update-required state.

## Do not
- Persist the access token.
- Call `axios` directly from screens.
