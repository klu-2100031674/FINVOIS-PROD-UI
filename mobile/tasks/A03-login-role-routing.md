# A03 · Login screen, role routing, logout, splash

**Depends on:** A02 · **Read first:** `docs/03-user-flows.md` F0, `docs/04-wireframes.md` S1

## Goal
Working login for both roles with role-based navigators and a profile/sign-out.

## Steps
1. `RootNavigator`: Splash (restoring) → Auth stack (Login) or role stack chosen from `session.user.role`: `admin` → `AdminTabs` (Dashboard, Reports, Requests, Profile placeholders), `customer_service` → `AgentTabs` (My work, Profile placeholders). Unknown role → force logout with message.
2. `Login` per S1: email + password, submit spinner, inline errors from the exact messages in F0, keyboard handling, no sign-up/forgot links. Trim email; do not store password beyond the submit call.
3. Profile screen (shared): name, email, role label, app version, Sign out (confirmation).
4. Listen to session changes so a background logout returns to Login instantly.
5. Tests: role → navigator mapping; login error mapping for 401, 403 `ROLE_NOT_ALLOWED`, 429, offline; logout clears session.

## Acceptance checks
- [ ] Admin account → admin tabs; agent account → agent tabs; other role → rejected message, no session stored (check secure-store empty).
- [ ] Sign out returns to Login and reopening the app requires sign-in.
- [ ] Layout works at 360 dp and font scale 1.3.
- [ ] Accessibility: inputs have labels, button has role, error text announced.

## Do not
- Add biometric or remember-me here (A12).
