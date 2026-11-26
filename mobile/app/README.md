# Finvois mobile app

Expo (SDK 57, React Native 0.86, React 19, TypeScript strict) app for the CA / super admin and customer-service agents. It talks to the Finvois API; the mobile-only endpoints live under `/api/mobile`. Product rules, flows and the API contract are in `../docs/`; the hard rules for contributors are in `../AGENT_RULES.md`.

## Requirements

- Node 22 and npm (the lockfile is committed; install with `npm ci`).
- For a device or emulator: Android Studio (Android) or Xcode on macOS (iOS).

```bash
npm ci
```

## Run in development

### 1. Point the app at an API

The app reads one setting, `EXPO_PUBLIC_API_BASE_URL`, and refuses to start unless it is `https://`, or `http://localhost` / `127.0.0.1` for an API on your own machine (`src/config.ts`). Anything in an `EXPO_PUBLIC_*` variable ends up in the app bundle, so never put a secret there.

```bash
cp .env.example .env.local   # then edit the URL
```

- Use `.env.local`, never `.env`. Both are git-ignored, but a `.env` file is read by every build including the e2e web export, and `../docs/11-ui-theme-and-visual-testing.md` records one silently repointing test builds.
- Do not run the e2e suite against a real server. It starts its own local API (see "End-to-end tests").
- A physical phone cannot reach `localhost` on your PC. Use an HTTPS tunnel, or on Android run `adb reverse tcp:5055 tcp:5055` and use `http://localhost:5055/api`. The iOS simulator can use `localhost` directly.

### 2. Start Metro and open the app

```bash
npx expo start
```

**Expo Go is enough for most UI work**: sign-in, navigation, lists, detail screens and the update gate all run in it, provided the Expo Go from the store supports SDK 57. It cannot run everything:

- Remote push notifications need a development build (Android Expo Go dropped remote push in SDK 53) and an EAS project id for the push token.
- Device-integrity checks use `jail-monkey`, a native module Expo Go does not include. The app treats that as "no signal" and keeps working.

**Development build** (full native behaviour, including push and integrity checks):

```bash
npx expo run:android            # local build, needs Android Studio
npx expo run:ios                # local build, needs macOS and Xcode
npx eas-cli@latest build --profile development --platform android   # cloud build
```

`eas.json` has `development`, `preview` and `production` profiles. Each sets `EXPO_PUBLIC_API_BASE_URL` to a placeholder (`*.invalid`) that must be replaced before the first build. Bundle ids in `app.config.ts` are placeholders until the owner confirms them.

## Checks

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit`, strict. Path aliases `~/` and `@/` point at `src/`. |
| `npm run lint` | ESLint flat config (`eslint.config.js`, `eslint-config-expo`). Includes the React hooks rules, so setState inside an effect body is an error. |
| `npm test` | Jest unit tests (`jest-expo`, React Native Testing Library). |
| `npm run audit:storage` | Fails if source persists data outside `src/auth/storage.ts`, logs with `console.log`, hard-codes a URL, or contains a secret-looking literal. |

## Unit tests

Files live next to the code in `src/**/__tests__/*.test.ts(x)`. Run all with `npm test`, or one area with `npx jest src/auth`. No test touches the network or a real secure-store:

- Axios is driven through a fake adapter; secure-store is replaced by an in-memory map (see `src/api/__tests__/client.test.ts`, `src/auth/__tests__/sessionStore.test.ts`).
- The session store and API client keep state at module level. To start each test from a fresh app launch, call `jest.resetModules()` and load them with `require`. `jest-expo` does not support dynamic `import()`, so do not use it in tests or in code that tests load.
- Jest does not transform `lucide-react-native` (ESM only). Component tests mock it, for example `jest.mock('lucide-react-native', () => ({ CircleArrowUp: () => null }))`.

## End-to-end tests (Playwright, phone-sized Chromium)

The e2e run exports the app for web, starts the real Express API on an in-memory MongoDB with throwaway accounts, and drives the app with Playwright. Web is a test harness only; native-only behaviour (secure-store, push, screen capture) is covered by device QA.

```bash
node scripts/e2e-run.js <slot> [playwright args]
node scripts/e2e-run.js 3 e2e/real-login.spec.ts e2e/login.spec.ts
```

- A slot (0 to 30) fixes the web port (8100 + slot), API port (5100 + slot), export folder (`dist-slot<slot>`) and Metro cache, so several runs can go at once. Use one slot per person or agent. `npm run e2e` uses slot 0.
- Specs are in `e2e/`. Specs named `real-*.spec.ts` use the real API and the seeded accounts from `FINVOIS-DEV-API/scripts/mobile-e2e-seed.js` (helpers in `e2e/real.ts`; call `resetDb` in `beforeEach`). Specs that mock the API (`e2e/helpers.ts`) are for failures a real server cannot produce on demand, such as 5xx, offline and 426.
- Screenshots go to `e2e/screenshots/` (git-ignored). Open them and check for clipping, overflow and theme drift before calling a flow done.
- The server version gate can be tested for real: `MOBILE_MIN_APP_VERSION=9.0.0 node scripts/e2e-run.js 3 e2e/real-update-required.spec.ts`. Without that variable the spec skips itself.

## Security notes

- **Tokens.** The access token lives in memory only. The refresh token, the user object and a random device id are the only persisted values, written through `src/auth/storage.ts` to `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. On web (test harness only) it falls back to `sessionStorage`. There is no AsyncStorage anywhere.
- **Refresh.** One axios instance (`src/api/client.ts`). A 401 triggers one shared refresh for all concurrent requests, and each request is retried once. `/mobile/auth/*` calls are never retried. A definite rejection (401 or 403 from refresh) signs the user out with a notice. A network or server failure keeps the stored refresh token: at launch the app shows sign-in with an offline notice, and while signed in the request simply fails.
- **Sign-out cleanup.** Every sign-out path (button, rejected refresh, incomplete stored session) runs the hooks registered with `sessionStore.onSignOut`: query cache, cached PDFs and documents, push token, biometric choice. Add new cleanup there rather than in screens.
- **Update gate.** When any call returns 426 (`MOBILE_MIN_APP_VERSION` on the server is above this build), `UpdateRequiredGate` replaces the whole app with a blocking "Update the app to keep using it" screen until a newer build is installed. The stored session is kept, so the user is signed in again after updating.
- **Errors.** Screens show `apiErrorMessage(err)`, which never exposes raw server text for 5xx or stack traces. Screens never call axios directly; each resource has a module in `src/api/`.
- **Logs.** No `console.log` of tokens or personal data. Production builds strip `console.*` (`babel.config.js`).
- **Build.** `allowBackup` is off and cleartext traffic is disabled in `app.config.ts`. Authorization is enforced by the server; hiding a button in the app is only UX.

## Folder map

```
app/
  App.tsx              providers, fonts, session restore, update gate, inactivity lock
  app.config.ts        static Expo config, no secrets (API URL from the environment only)
  eas.json             build profiles with placeholder API URLs
  eslint.config.js     flat ESLint config
  e2e/                 Playwright specs, helpers (real.ts for the real API, helpers.ts for mocks)
  scripts/             e2e-run.js (slotted runner), audit-storage.js
  src/
    api/               client.ts (axios + refresh), auth.ts, queryClient.ts, one module per resource
    auth/              sessionStore.ts, storage.ts, useSession.ts, UpdateRequiredGate.tsx
    components/        shared UI (StatusPill, StatCard, ListRow, sheets); ui/ holds react-native-reusables
    hooks/             TanStack Query hooks
    lib/               pdfCache.ts, documentCache.ts (app cache directory only, wiped on sign-out)
    navigation/        RootNavigator, types, deep-link allow-list
    notifications/     push registration and tap routing
    screens/           auth/, admin/, agent/, shared/
    security/          inactivity lock, biometrics, device integrity, secure screen
    utils/             errors.ts, status.ts, format.ts, workflow helpers
```
