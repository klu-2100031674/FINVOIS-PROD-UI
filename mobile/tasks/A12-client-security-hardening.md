# A12 · Client security hardening

**Depends on:** A06, A10 · **Read first:** `docs/06-security-architecture.md` (entire), `OPEN_QUESTIONS.md` Q2, Q5

## Goal
Implement the on-device controls in doc 06 and pass the client half of the checklist.

## Steps
1. **Inactivity lock** (`src/security/inactivityLock.ts`): AppState listener; after the configured timeout in background (default 10 min, Q2) show a lock overlay requiring password re-entry via the login API (or biometrics if enabled), else logout after 3 failures. Blur/overlay content in the app switcher on both platforms.
2. **Biometric unlock (optional, L2):** `expo-local-authentication`; store a flag only; unlocking never bypasses server session validity.
3. **Device integrity** (`deviceIntegrity.ts`): choose a maintained root/jailbreak detection library (record justification and last-release date in PR), expose `isSuspect()`. Show a warning banner; add `X-Device-Integrity` header; disable **Send report** when suspect (Q5; confirm with owner before enabling blocking).
4. **Screen protection** (`secureScreen.ts`): reusable hook applying `preventScreenCaptureAsync` on PDF, documents, report detail screens.
5. **Release hygiene:** babel `transform-remove-console` for production; verify `debuggable` false; no dev menu in release; strip source maps from the bundle.
6. **Storage audit:** script `npm run audit:storage` grepping the source for `AsyncStorage`, `MMKV`, `console.log`, `localStorage`, and hard-coded URLs/keys; fails CI on hits (allow-list documented).
7. **Deep-link hardening:** verify the `finovis://` scheme only routes allow-listed paths (A11 list); Android intent filters limited to this scheme, `exported` only for the main activity.
8. **Dependency audit:** `npm audit --omit=dev`; fix or document each high/critical.
9. Run the client items of the checklist in doc 06 §11 and record evidence in `docs/security-signoff-app.md`.

## Acceptance checks
- [ ] Background 10 min → lock overlay; wrong password ×3 → logout.
- [ ] App switcher shows blurred/placeholder content.
- [ ] Rooted emulator/test device → banner; send blocked (if Q5 confirmed).
- [ ] Release build: no console output, dev menu unavailable, cleartext HTTP request fails.
- [ ] `npm run audit:storage` clean; `npm audit --omit=dev` no high/critical (or documented exceptions accepted by owner).
- [ ] Sign-off doc complete.

## Do not
- Depend solely on client checks for any protection; the server rules remain the enforcement.
- Add analytics/crash SDKs that collect PII without owner approval and store-form updates.
