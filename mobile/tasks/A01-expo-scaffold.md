# A01 · Expo project scaffold

**Depends on:** none · **Folder:** `finovis-mobile/app` · **Read first:** `AGENT_RULES.md`, `docs/02-architecture.md` (structure, tech choices)

## Goal
A running, empty, strict-TypeScript Expo app with the agreed structure and tooling.

## Steps
1. Verify Node and npm versions; create the app with the current stable Expo SDK TypeScript template into `app/` (use `npx create-expo-app@latest app --template blank-typescript` or the current equivalent). Record the SDK version.
2. Install (exact versions pinned): `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `@tanstack/react-query`, `axios`, `expo-secure-store`, `expo-notifications`, `expo-file-system`, `expo-sharing`, `expo-screen-capture`, `expo-constants`, `expo-device`, `expo-linking`. Dev: `jest`/`jest-expo`, `@testing-library/react-native`, `eslint` (+ Expo config), `typescript`. Justify any extra package.
3. `tsconfig`: `strict: true`, path alias `@/` → `src/`.
4. Create the folder skeleton from doc 02 with placeholder index files only where needed.
5. `app.config.ts`: name "Finovis", slug, `scheme: "finovis"`, `orientation: "portrait"`, `ios.supportsTablet: false`, `ios.bundleIdentifier` and `android.package` from placeholders `com.finovis.mobile` (mark TODO for owner confirmation), `android.allowBackup: false`, `ios.infoPlist.ITSAppUsesNonExemptEncryption: false`. Read `EXPO_PUBLIC_API_BASE_URL` only. No secrets.
6. Android network security: ensure cleartext disabled (Expo default in release; set explicitly via config plugin if needed, but allow dev-only http via a separate development profile only if unavoidable, never in preview/production).
7. `eas.json` with profiles `development`, `preview`, `production`, each setting `EXPO_PUBLIC_API_BASE_URL` (placeholders).
8. Scripts: `typecheck`, `lint`, `test`.
9. `.gitignore`/`.easignore`: `.env*`, keystores, `google-services.json`, `GoogleService-Info.plist`.
10. One smoke test that renders the root component.

## Acceptance checks
- [ ] `npm run typecheck`, `npm run lint`, `npm test` pass.
- [ ] App boots on an Android emulator and an iOS simulator (or Expo Go/dev build) showing a placeholder.
- [ ] `app.config.ts` contains no secret; only the API base URL comes from env.
- [ ] Folder structure matches doc 02.

## Do not
- Add UI libraries beyond what is listed without justification.
- Commit generated credentials.
