# App security sign-off (task A12)

Date: 2026-10-01, updated 2026-11-03 (integrity header sent, `SendReportSheet` gated, R8 and resource shrinking on, extra Android permissions blocked, doc 07 permission list updated; see the 2026-11-03 rows below). Scope: the on-device controls in `docs/06-security-architecture.md` and the client half of its section 11 checklist, in `finovis-mobile/app`. Decisions applied: Q2 (10 minute background timeout, biometric unlock optional) and Q5 (warn, log, block only sending reports), both taken from the recommended answers in `OPEN_QUESTIONS.md`; the owner has not confirmed either yet.

Legend: **Verified** means a command was run and its result is recorded here. **Needs device verification** means the code or config is in place but only a signed build on a phone can show the behavior; the exact manual steps are in section 6. **Open** means something is missing, with who has to change what (section 7). Nothing is marked verified from reading code alone unless the row says so.

## 0. Method and environment

- Machine: Windows 11, Node v22, Expo SDK 57, React Native 0.86. No `.env` file exists in `app/` (Expo's `.env` would repoint the tests).
- Web e2e: the real Express app on an in-memory MongoDB with the seeded throwaway accounts (`FINVOIS-DEV-API/scripts/mobile-e2e-server.js`), slot 8, Chromium at Pixel 7 size. Web is only a test harness: it shows the lock, the cover and the banner, not secure-store, `FLAG_SECURE`, jail-monkey or biometrics.
- No remote host was contacted except the npm registry (for `npm audit` and `npm view jail-monkey`). No real credential was used.
- Release checks used `expo export -p android` in production mode (Hermes bytecode, the same bundle EAS ships), and `expo prebuild` run in a throwaway copy outside the repo (scratchpad, with `node_modules` junctioned) to read the generated `AndroidManifest.xml` and `gradle.properties`. Nothing was generated inside `app/`.

Reproduce (from `finovis-mobile/app`):

```
npx jest src/security                                              # unit tests for this task
npm run audit:storage                                              # storage, console, URL and secret audit
npx tsc --noEmit ; npx eslint src/security scripts/audit-storage.js
EXPO_PUBLIC_LOCK_TIMEOUT_MS=2000 node scripts/e2e-run.js 8 e2e/security.spec.ts   # web e2e, slot 8
npm audit --omit=dev
```

## 1. Results

| Command | Result |
|---|---|
| `npx jest src/security` | 4 suites, 36 tests passed (`lockLogic`, `deviceIntegrity`, `auditStorage`, `releaseHygiene`) |
| `npx jest` (whole app) | 33 suites passed, 1 failed: `src/api/__tests__/push.test.ts` "a 401 on register goes through the normal refresh and retry" (not this task's file; `api/client.ts` was being edited by another agent at the time, see section 7) |
| `npm run audit:storage` | `audit:storage passed.` |
| `npx eslint src/security scripts/audit-storage.js` | clean |
| `npx tsc --noEmit` | clean on the last run. Earlier runs showed transient errors in another agent's `src/hooks/__tests__/useRequestMessages.test.tsx` and `src/notifications/__tests__/NotificationBootstrap.test.tsx` while they were editing |
| `EXPO_PUBLIC_LOCK_TIMEOUT_MS=2000 node scripts/e2e-run.js 8 e2e/security.spec.ts` | 17 passed (1.6 min) |
| `npm audit --omit=dev` | 0 critical, 0 high, 11 moderate (section 5). Not re-run on 2026-11-03 |
| 2026-11-03 `npx tsc --noEmit` | clean (exit 0) |
| 2026-11-03 `npx eslint src scripts` | 0 errors, 27 warnings (all `no-require-imports` / `import/first` in test files this change did not touch) |
| 2026-11-03 `npx jest` (whole app) | 37 suites, 415 tests passed. The earlier `push.test.ts` failure no longer occurs |
| 2026-11-03 `npx jest src/security src/api/__tests__/client.test.ts` | 5 suites, 59 tests passed (adds: header absent on a clean device; `X-Device-Integrity: suspect` on every request from a suspect device including the retry after a refresh; R8/shrink and `blockedPermissions` config guards) |
| 2026-11-03 `npm run audit:storage` | `audit:storage passed.` |
| 2026-11-03 `npx expo config --type public` | `expo-build-properties` android has `enableMinifyInReleaseBuilds: true`, `enableShrinkResourcesInReleaseBuilds: true`; `android.blockedPermissions` lists the two storage permissions and `SYSTEM_ALERT_WINDOW` |
| 2026-11-03 `expo prebuild -p android --no-install` (throwaway copy in the scratchpad, `node_modules` junctioned, nothing generated in `app/`) | Main manifest: `INTERNET`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, `VIBRATE`; `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` written with `tools:node="remove"`; `allowBackup="false"`, `usesCleartextTraffic="false"`. `gradle.properties`: `android.enableMinifyInReleaseBuilds=true`, `android.enableShrinkResourcesInReleaseBuilds=true` |

## 2. Checklist from doc 06 section 11 (client items)

Items that are server behavior are signed off in `docs/security-signoff-backend.md` and only referenced here.

- [x] **1. Token only in secure-store; no token in AsyncStorage or logs.** Client half **verified**. `npm run audit:storage` fails on `AsyncStorage`, `MMKV`, `localStorage`/`sessionStorage` outside `src/auth/storage.ts`, `console.log/debug/info`, hard-coded URLs and key or token patterns, and passes on the current source. `package-lock.json` has 0 matches for `async-storage` or `react-native-mmkv`. `src/api/queryClient.ts` documents and implements no persistence. The access token lives only in `sessionStore` memory; the persisted items are the refresh token, user JSON and device id (secure-store, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`), the biometric flag and the inactivity timestamp below (a time, not a secret). The web build keeps these in `sessionStorage`, test harness only. In the production Hermes bundle there are 0 `console.log/info/debug` call sites (section 4).
- [ ] **2. Release APK/IPA strings contain no secrets.** The production Android JS bundle was scanned and is **verified** clean (section 4). **Needs device verification** for the signed APK/AAB and IPA as a whole (native libraries, resources, `strings`): run the scan in section 6 on the EAS build.
- [x] **3. Non-admin/agent cannot log in; agent cannot call admin routes.** Backend, verified in `security-signoff-backend.md` item 3.
- [x] **4. Agent cannot open or send another agent's request.** Backend, item 4 there.
- [x] **5. Reused refresh token revokes the session.** Backend, item 5 there.
- [x] **6. Not-approved and not-paid reports cannot be sent by any role.** Backend, item 6 there. The client block for compromised devices (this task) is a second gate and never replaces it.
- [ ] **7. Cleartext HTTP fails on both platforms.** Config **verified**: `expo prebuild` writes `android:usesCleartextTraffic="false"` and `android:allowBackup="false"` on `<application>` in the main manifest; `app.config.ts` is guarded by `releaseHygiene.test.ts`; the iOS template Info.plist has `NSAllowsArbitraryLoads` false and the app config adds no ATS exception. **Needs device verification** that a plain `http://` request actually fails (section 6). Two exceptions to know about are in section 5, items 3 and 4.
- [ ] **8. Screenshots blocked on the PDF screen (Android) and blur in the app switcher (both).** Implemented, **needs device verification** (section 6). `PdfViewerScreen`, `AgentDocumentsScreen` and `ReportDetailScreen` already call `usePreventScreenCapture()`; `InactivityLock` adds the app switcher cover (iOS blur, Android `FLAG_SECURE`).
- [x] **9. Push payloads contain only type and id.** Backend, item 9 there; the client re-checks the shape in `src/notifications/payload.ts` (A11).
- [ ] **10. Release build has no console output and cannot open the dev menu.** **Verified** for what can be checked without a device: the production Babel pipeline removes every `console.*` (`releaseHygiene.test.ts`), the Hermes bundle has 0 `console.log/info/debug` call sites, and no dev client, dev launcher, dev menu or Flipper package is a dependency. **Needs device verification** that a release build has no dev menu (section 6).
- [x] **11. `npm audit --omit=dev` clean of high/critical.** **Verified**, section 5.
- [x] **12. Rate limits trigger (429) in tests.** Backend, item 12 there.

## 3. Task A12 acceptance checks

| Check | Status | Evidence |
|---|---|---|
| Background 10 min, lock overlay; wrong password x3, logout | Verified on web with a 2 second timeout; the 10 minute default is unit tested; native background is **needs device verification** | `e2e/security.spec.ts` (admin and agent): a long absence shows the lock and hides the content, a wrong password shows "Incorrect password. 2 attempts left." and leaves the stored session untouched, the right password unlocks with the same screen and user and a fresh session, three wrong passwords sign out and the old refresh token is then rejected by the server (401). `lockLogic.test.ts`: default 600000 ms, `shouldLock`, `recordFailure` |
| App switcher shows blurred or placeholder content | **Needs device verification.** Web shows the same cover (`security-admin-01-cover.png`) | iOS `enableAppSwitcherProtectionAsync`, Android `FLAG_SECURE` through `preventScreenCaptureAsync` |
| Rooted device: banner, send blocked | Banner verified on web through a test flag (`security-agent-06-integrity-banner.png`); the gate is unit tested; `SendReportSheet` is wired to `useSendBlockedByIntegrity()` (both Send buttons disabled and the message shown, unit tested); `api/client.ts` sends `X-Device-Integrity: suspect` (unit tested, 2026-11-03). Real detection on a rooted/jailbroken device **needs device verification**; server-side logging of the header is open (section 7) | `deviceIntegrity.test.ts` (clean, suspect, debugger found after launch; header; message), `SendReportSheet.test.tsx` (integrity block), `client.test.ts` (header), e2e banner tests |
| Release build: no console output, no dev menu, cleartext HTTP fails | Partly verified, see items 7 and 10 above | section 4 and 5 |
| `npm run audit:storage` clean; `npm audit --omit=dev` no high/critical | Verified | section 1 |
| Sign-off doc complete | This document. Device items are open by design | section 6 |

## 4. Release hygiene evidence

| Item | Evidence |
|---|---|
| Babel strips console in production | `babel.config.js` has `env.production.plugins: ['transform-remove-console']`. `releaseHygiene.test.ts` compiles a probe with `envName: 'production'` and asserts no `console.` remains while `development` keeps it. Direct run: `PROD: no console calls`, `DEV: console calls kept` |
| Hermes bundle contents | `E2E_SLOT=8 EXPO_PUBLIC_API_BASE_URL=https://api.invalid.example/api npx expo export -p android --output-dir dist-slot8-android` produced one `.hbc` (6.2 MB), and `find dist-slot8-android -name "*.map"` returned 0, so no source map is shipped. A string scan of the bytecode (script kept outside the repo) found none of: JWT, private key header, AWS key, Google API key, live Stripe key, GitHub token, Slack token, named secret literal, Razorpay key. 0 `console.log/info/debug` call sites. Cleartext `http://` strings: `nativewind.dev`, `www.w3.org`, `localhost`, all from libraries. `https` hosts: the dummy API host, `wa.me` (our applicant link), and library hosts (`exp.host`, `docs.expo.dev`, `react.dev`, `reactnavigation.org`, `tailwindcss.com`, `github.com`, `dev.to`, `docs.swmansion.com`, `classic-assets.eascdn.net`) |
| `allowBackup` false | `npx expo config --type public` shows `android.allowBackup: false`; generated manifest has `android:allowBackup="false"` |
| Cleartext off | `expo-build-properties` `android.usesCleartextTraffic: false`; generated main manifest has `android:usesCleartextTraffic="false"` |
| Web bundle has no jail-monkey | `grep -l "jail-monkey\|JailMonkey" dist-slot8/_expo/static/js/web/*.js` returned nothing (the web build resolves `deviceProbe.ts`, native builds resolve `deviceProbe.native.ts`) |
| Deep links | `src/navigation/linking.ts` (A11) accepts only `finovis://request/<24-hex id>` for agents and `finovis://requests/pending` for admins, everything else is dropped (`linking.test.ts`, passing). Generated manifest: `MainActivity` is the only exported component, with exactly two intent filters, MAIN/LAUNCHER and VIEW with `android:scheme="finovis"`; no `https` app links; `launchMode="singleTask"`. iOS URL types also list the bundle id as a scheme (Expo default), but `linking.prefixes` is only `finovis://` so those URLs open nothing |
| OTA | Generated manifest has `expo.modules.updates.ENABLED` `false` |
| Dev menu | Not a dependency. Release builds of React Native do not include it. **Needs device verification** |
| `debuggable` | Not set in `app.config.ts`; Gradle `release` builds are not debuggable. **Needs device verification** (section 6) |
| R8 and resource shrinking (2026-11-03) | `expo-build-properties` android `enableMinifyInReleaseBuilds: true` and `enableShrinkResourcesInReleaseBuilds: true` in `app.config.ts`, guarded by `releaseHygiene.test.ts`; prebuild (throwaway copy) writes both as `true` in `gradle.properties`, which `app/build.gradle` reads into `minifyEnabled` and `shrinkResources` for `release`. **Needs device verification** that the release build still works with R8 (section 6, release build step 6) |
| Android permissions (2026-11-03) | `android.blockedPermissions` removes `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` (prebuild writes `tools:node="remove"`), guarded by `releaseHygiene.test.ts`. Remaining: `INTERNET`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, `VIBRATE`, all listed with reasons in doc 07; `POST_NOTIFICATIONS` is merged from `expo-notifications` at Gradle time. **Needs device verification** of the final merged manifest (section 6, release build step 5) |
| Integrity header (2026-11-03) | `src/api/client.ts` request interceptor calls `config.headers.set(getIntegrityHeader())`; runs again on the 401 retry, so retried requests keep it. No import cycle: `deviceIntegrity.ts` imports only `react` and `./deviceProbe` |

## 5. Dependency audit and other config findings

`npm audit --omit=dev`: 11 moderate, 0 high, 0 critical. All eleven are one chain of Expo build tooling: `expo` and `expo-sharing` depend on `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro-config`, `@expo/prebuild-config`, `@expo/inline-modules`, `@expo/local-build-cache-provider`, and those on `xcode`, which pulls a vulnerable `uuid` (advisory GHSA-w5hq-g745-h8pq, missing buffer bounds check in v3/v5/v6 when `buf` is provided). By role these run on the build machine (config plugins and the CLI), not in the app. No fix is available without an Expo SDK change (`npm audit fix --force` proposes a breaking one). Exception to accept: **documented, owner to accept**; re-run before every release. Requires no high/critical, so the release gate in doc 06 holds.

Findings from the generated Android config and the iOS template (all in files this task does not own; fixes are in section 7):

1. **R8 minification and resource shrinking were off. Fixed 2026-11-03** (section 4). Original finding: doc 06 section 8 requires them. The generated `gradle.properties` has no `android.enableMinifyInReleaseBuilds` or `android.enableShrinkResourcesInReleaseBuilds`, and the template default is `false`. Fix verified in the throwaway copy: set both in the `expo-build-properties` android block; prebuild then writes both as `true`.
2. **Extra Android permissions. Fixed 2026-11-03** (storage and overlay blocked, doc 07 now lists `USE_BIOMETRIC`, `USE_FINGERPRINT` and `VIBRATE` with reasons; section 4). Original finding: the generated app manifest declares `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (max SDK 32), `SYSTEM_ALERT_WINDOW`, `VIBRATE`, `USE_BIOMETRIC` and `USE_FINGERPRINT`, plus `INTERNET`. `docs/07-store-compliance.md` allows `INTERNET`, `POST_NOTIFICATIONS` and Expo defaults, and says not to request storage. `android.blockedPermissions` for the storage and overlay permissions was verified in the throwaway copy (prebuild writes `tools:node="remove"`). `USE_BIOMETRIC` and `USE_FINGERPRINT` come from `expo-local-authentication` (step 2 of this task); they are normal-protection permissions, need no runtime prompt, and doc 07 should list them. `VIBRATE` comes from `expo-notifications`. `POST_NOTIFICATIONS` is not in the app-level manifest because it is merged from the library at Gradle time: read the final merged manifest (section 6) before submission.
3. **Debug manifest allows cleartext.** The template's `src/debug/AndroidManifest.xml` sets `usesCleartextTraffic="true"` (and adds `SYSTEM_ALERT_WINDOW`), so a debug build can reach Metro over HTTP. Release builds use the main manifest, which is `false`. This conflicts with a literal reading of AGENT_RULES rule 16 ("including in debug builds"). Recommend the owner accepts it for debug variants, which are never distributed.
4. **iOS local networking.** The Expo iOS template keeps `NSAllowsLocalNetworking` true next to `NSAllowsArbitraryLoads` false. That allows plain HTTP to local-network addresses only, never to public hosts, and is what lets a dev client reach Metro. It is harmless to the production API but is technically an ATS exception; if the owner wants none in release, set it per EAS profile.

## 6. Needs device verification: exact manual steps

Use a signed release build from the EAS `preview` or `production` profile, not a development client. Test accounts only (non-production dataset).

**Lock after the timeout (Android and iOS)**
1. Sign in, open Profile, press Home, wait 10 minutes, reopen. Expect the lock screen and no app content. Enter a wrong password: "Incorrect password. 2 attempts left." Enter the right one: back on Profile with the same user.
2. Repeat with three wrong passwords: expect the login screen and, in the web or API, a dead old refresh token.
3. Cold start: sign in, press Home, wait 10 minutes, then force-stop the app (Android: Settings, App info, Force stop; iOS: swipe up in the switcher) and reopen. Expect the lock screen before any content. Reopen within 1 minute instead: no lock.
4. Lock while offline (airplane mode): the password field reports offline and never counts a failed attempt.

**Biometric unlock (needs a device with an enrolled fingerprint or face)**
1. Profile shows the "Biometric unlock" row. On a device with no enrollment (or an emulator without it) the row must be absent.
2. Switch it on: one biometric prompt must succeed first. Background for 10 minutes, reopen: the prompt appears; a successful scan unlocks; Cancel falls back to the password.
3. With the device in airplane mode, a successful scan must not unlock (message: "Couldn't confirm your session...").
4. End the session on the server (change the account password on the web, which bumps the token version and ends every mobile session), then try a biometric unlock: the app must end on the login screen, not unlock.
5. Remove all enrolled biometrics in system settings: the lock falls back to the password.

**App switcher and screenshots**
1. Android: open the recent apps view while signed in; the app thumbnail must be blank. Take a screenshot on any signed-in screen: blocked ("Can't take screenshot due to security policy"). This is app-wide on Android (see section 8). Expect the same on the PDF, documents and report detail screens.
2. iOS: open the switcher while signed in; the thumbnail must be blurred. Take a screenshot and start a screen recording on the PDF screen; the capture must be blocked or black.
3. Signed out (login screen): none of the above applies, by design.

**Rooted or jailbroken device**
1. On a rooted Android device or a jailbroken iPhone (or an AOSP emulator image, which JailMonkey reports as rooted): the amber banner "This device looks compromised" appears, dismisses with the X and stays dismissed until the next launch.
2. With a proxy on the API, every request carries `X-Device-Integrity: suspect` (wired in `api/client.ts`, unit tested). On a clean device the header is absent.
3. The Send report action is disabled and shows the message (wired in `SendReportSheet`, unit tested). Everything else keeps working.
4. A release build with a debugger attached flips a clean device to suspect.

**Release build**
1. No console output: `adb logcat` while using the app, filter by the app process; no application log lines.
2. No dev menu: shake the device (Android) and press the volume keys; nothing opens. `adb shell dumpsys package com.finovis.mobile | grep -i debuggable` must not show `DEBUGGABLE`.
3. Cleartext fails: on the device, point a test build at an `http://` API address (a throwaway local server) and sign in; the request must fail on both platforms. Do not do this against production.
4. Strings scan of the artifact: unzip the APK/AAB and the IPA, run `strings` over `assets/index.android.bundle` or the `.hbc`, native libraries and resources for `eyJ`, `BEGIN PRIVATE KEY`, `AKIA`, `AIza`, `sk_live`, `rzp_`, `http://`; only library hosts and the real API host may appear.
5. Merged manifest: `./gradlew :app:processReleaseMainManifest` (or unzip the AAB and decode `AndroidManifest.xml`) and check permissions, `allowBackup`, exported components and intent filters against section 4.
6. After the R8 change in section 7: confirm the release build starts, signs in and opens a PDF (R8 can break reflection-based libraries).

**Banner placement (cosmetic)**
- On a notched phone with the banner showing, the screen header below it keeps its own top inset, so there is extra space under the banner. Confirm it looks acceptable; the banner only shows on a suspect device.

## 7. Open items in files this task does not own

| Owner | Change |
|---|---|
| ~~Foundation (`src/api/client.ts`)~~ | **Done 2026-11-03.** Request interceptor sends `X-Device-Integrity` via `getIntegrityHeader()` (`{}` on a clean device); `client.test.ts` covers clean, suspect and the refresh retry |
| ~~A08 (`src/components/SendReportSheet.tsx`)~~ | **Done.** `SendReportSheet` uses `useSendBlockedByIntegrity()`: both Send buttons are disabled when `blocked` and the message is shown (`send-integrity-block`); covered by `SendReportSheet.test.tsx`. The server stays the real enforcement |
| Backend (B-series, mobile router) | **Open.** Q5 says "log server-side". Nothing in `FINVOIS-DEV-API` reads `X-Device-Integrity` today. Log it (user id and request id only) when it is `suspect`. Do not use it to authorize anything. Not changed here (mobile-app-only change) |
| ~~Foundation (`app.config.ts`)~~ | **Done 2026-11-03.** R8 and resource shrinking on, storage and overlay permissions blocked; verified with `npx expo config --type public` and a prebuild in a throwaway copy (section 1). The R8 device check in section 6 is still open |
| Owner / A13 | `docs/07-store-compliance.md` now lists `USE_BIOMETRIC`, `USE_FINGERPRINT` and `VIBRATE` with reasons (done 2026-11-03). **Open:** decide on findings 3 and 4 in section 5 |
| Backend / foundation | Unlocking with a password calls the real login, which creates a new server session each time; the previous session family is not revoked and stays valid until its 30 day expiry (the app no longer holds its refresh token). Suggested fix: have `POST /mobile/auth/login` revoke the earlier families of the same user and `deviceId`, or add an endpoint that re-verifies the password for the current session. Until then each unlock leaves one orphaned session row |
| ~~Foundation / A11~~ | **Resolved.** `src/api/__tests__/push.test.ts` passes in the 2026-11-03 whole-app run (37 suites, 415 tests) |

Wired already by other tasks: `usePreventScreenCapture()` is called in `PdfViewerScreen`, `AgentDocumentsScreen` and `ReportDetailScreen`; `BiometricToggleRow` is in `ProfileScreen`.

## 8. Controls and files

| Control | Where | Behavior |
|---|---|---|
| Inactivity lock | `src/security/InactivityLock.tsx`, `lockLogic.ts` | Wraps the app in `App.tsx`. Timeout 10 minutes; `EXPO_PUBLIC_LOCK_TIMEOUT_MS` can only shorten it (a bigger, zero or invalid value falls back to 10 minutes, so a build cannot weaken the policy). Native uses `AppState`; web uses `visibilitychange` through React Native Web. Locks when the app was away at least the timeout, and also when the clock went backwards or the stored time is unreadable. Password re-entry calls the real login with the same device id; the stored session is replaced only after the password was right. Three 401s sign out; offline, 429 and 5xx are not counted. A Sign out button is always on the lock screen. |
| Cold start lock | same | While signed in and away, a timestamp (not a secret) is kept in secure-store so a process the OS killed in the background still locks on the next launch. It is kept while locked (leaving the lock screen never restarts the clock) and removed on unlock and on every sign-out. |
| Cover while not active | same | Plain white cover with the logo while the app is not active, so the web and fallback show nothing sensitive. iOS also uses the native blur (`enableAppSwitcherProtectionAsync`). Android uses `FLAG_SECURE` (`preventScreenCaptureAsync`), the only way to blank the recents thumbnail, so while signed in screenshots are blocked on every screen on Android, not just report screens. If that is too strict for support or store screenshots, take store screenshots from the web harness or a design mockup, and limit it to the three screens by removing the Android line in `useAppSwitcherProtection` (the thumbnail would then show content). Owner decision for A13. |
| Biometric unlock | `BiometricToggleRow.tsx`, `biometrics.ts` | Row shown only on native with hardware and an enrolled biometric. Stores one flag in secure-store. Turning it on needs one successful scan. The device passcode fallback is off. Unlocking runs `sessionStore.refresh()` first: a revoked session signs out; if the server cannot be reached the lock stays closed. The flag is cleared on every sign-out. No-op on web. |
| Device integrity | `deviceIntegrity.ts`, `deviceProbe.native.ts`, `deviceProbe.ts`, `IntegrityBanner.tsx` | jail-monkey 3.0.0 (MIT, released 2026-04-28, supports the New Architecture, in use at the time of writing) is loaded lazily only in `deviceProbe.native.ts`, so web and Expo Go and unit tests never import it and a missing native module means "clean", not a crash. `isSuspect()`, `getIntegrityHeader()`, `useIsSuspect()`, `useSendBlockedByIntegrity()`, and a dismissible banner mounted once by `InactivityLock`. Checks root/jailbreak and hooking, and a debugger attached to a release build. Web flag `window.__FINVOIS_SUSPECT__` exists only so Playwright can show the banner. |
| Screen capture | `secureScreen.ts` | `usePreventScreenCapture(enabled = true)` with a per-caller key (one screen unmounting never re-enables capture for another), no-op on web. Required on: PDF viewer, documents, report detail (all wired). |
| Storage audit | `scripts/audit-storage.js`, `npm run audit:storage` | Exit 1 on the rules above, prints file, line and rule only, never the matched text. Allow-list: `localStorage`/`sessionStorage` in `src/auth/storage.ts`; URLs `w3.org`, `docs.expo.dev`, `expo.dev`, `reactnative.dev`, `wa.me` (applicant click-to-chat link in `utils/agentRequest.ts`); any other URL needs `audit-allow: <why>` on the same line; comment lines and tests are not scanned. |

Why jail-monkey: it is the only maintained root/jailbreak detector with a TurboModule path that works on the New Architecture and needs no config plugin; the last release is about 5 months before this sign-off (rule 19 asks for one in the last 12 months). It was already a dependency; this task added none. Detection is a deterrent, not a guarantee: an attacker who controls the device can bypass client checks, which is why the server keeps every rule.

Not done on purpose: certificate pinning (deferred in doc 06), Play Integrity / App Attest (doc 06 says document only), any analytics or crash SDK.
