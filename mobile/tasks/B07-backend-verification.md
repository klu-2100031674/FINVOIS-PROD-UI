# B07 · Backend end-to-end verification, env docs, security review

**Depends on:** B04, B05, B06 · **Repo:** `FINVOIS-DEV-API`

## Goal
Prove the mobile surface is correct and safe as a whole, and document it.

## Steps
1. Run the full API suite (`npm test`) and record results against the pre-project baseline (from B01).
2. Write `tests/mobile-e2e.test.js`: admin login → stats → report context → approve → assign → send; agent login → list → claim → send-blocked-until-approved → send after approval; refresh rotation and reuse; role isolation (agent hitting `/mobile/admin/*` → 403; admin/agent hitting each other's ownership routes as designed).
3. Run the security acceptance items in `docs/06-security-architecture.md` §11 that apply to the backend and tick them in a checklist file `docs/security-signoff-backend.md` with evidence.
4. Document new env vars (`MOBILE_ACCESS_TOKEN_TTL`, `MOBILE_REFRESH_TOKEN_TTL_DAYS`, `MOBILE_MIN_APP_VERSION`, `EXPO_PUSH_ACCESS_TOKEN`) in the backend's env example file if one exists, or in `finovis-mobile/docs/02-architecture.md` if not.
5. Review new code for: missing input validation, missing role checks, logs that contain tokens/PII, unbounded queries (add limits), missing indexes (`MobileSession.familyId/userId`, `DeviceToken`).
6. Verify no existing route's behavior changed: diff `src/routes/*.js` against the baseline and list every hunk in the sign-off doc (expected: mount line, assign hook, approve hook, request-creation hooks, claim expiry pass, optional field).

## Acceptance checks
- [ ] Full suite green (or identical to baseline failures, listed).
- [ ] E2E test passes.
- [ ] Sign-off doc complete, no unchecked high-severity item.
- [ ] Diff hunks in existing files exactly match the expected list.

## Do not
- Fix unrelated pre-existing failures; report them.
