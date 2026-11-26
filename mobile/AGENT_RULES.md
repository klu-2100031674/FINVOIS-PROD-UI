# Agent Rules

These apply to every AI agent and human working on Finovis Mobile. They override convenience.

## Process rules

1. **One task at a time.** Work only on the task file you were given. Do not do work from a later task "while you are there".
2. **Check dependencies.** If a task's `Depends on` items are not `DONE` in `tasks/00-TASK-INDEX.md`, stop and report.
3. **Docs are the contract.** If code and docs disagree, do not silently pick one. Report the mismatch and update the docs in the same change if the owner agrees.
4. **Never guess an unknown.** If a detail is missing, check `OPEN_QUESTIONS.md`. If it is not there, add it and ask the owner.
5. **Update the index.** When a task's acceptance checks all pass, set its status to `DONE` in `tasks/00-TASK-INDEX.md` and note the date.
6. **Verify before claiming done.** Run the checks listed in the task. Report real output. If something fails, say so.
7. **Small commits.** One task = one branch/commit series. No unrelated refactors.

## Scope rules

8. **Do not modify the web app** (`FINVOIS-DEV-UI`). Ever.
   Note: the `mobile/` folder was added to the `FINVOIS-DEV-UI` repo by owner decision on 2026-11-03. Work inside `mobile/` is allowed; the rest of the web app is still off limits.
9. **Backend changes only under the mobile surface.** New code goes in new files: `src/routes/mobile*.js`, `src/services/mobile*.js`, `src/models/Mobile*.js`, `src/models/DeviceToken.js`. The only allowed edits to existing backend files are: mounting the new router (`src/routes/index.js`), and the small hooks named in tasks B05/B06. Do not change existing endpoint behavior or response shapes.
10. **Report generation stays on the web.** The mobile app never builds, edits, or regenerates a report.
11. **Two roles only.** `admin` and `customer_service`. Any other role is rejected at login. Do not add screens for other roles.
12. **No new features.** Anything not in `docs/01-product-and-scope.md` is out of scope until the owner adds it.

## Security rules (see `docs/06-security-architecture.md`)

13. **Authorization is server-side only.** The app hides buttons for UX, but the server must refuse the action. Never rely on the client for a permission.
14. **Tokens live only in `expo-secure-store`.** Never in AsyncStorage, MMKV, Redux persist, logs, URLs, or screenshots.
15. **No secrets in the app bundle.** The bundle may contain the public API base URL and nothing else. No API keys, no JWT secrets, no Razorpay/WhatsApp/mail credentials.
16. **HTTPS only.** No cleartext traffic exceptions, including in debug builds pointed at production.
17. **No PII in logs, crash reports, analytics, or push payloads.** Push payloads carry only a type and an id.
18. **Reports are sensitive documents.** Never write them to shared/external storage. Cache only in the app sandbox and delete after viewing or on logout.
19. **Do not add dependencies casually.** Every new package needs a one-line justification in the task's PR notes. Prefer Expo SDK modules. No abandoned packages (no release in 12+ months) without owner approval.
20. **Never commit** `.env`, keystores, `google-services.json` with private data, `GoogleService-Info.plist` secrets, EAS credentials, or test account passwords.

## Code rules

21. TypeScript strict mode. No `any` without a comment explaining why.
22. One API module per resource under `app/src/api/`. Screens never call `axios` directly.
23. Server data through TanStack Query only. No manual fetch-in-useEffect for server data.
24. Every list and detail screen implements loading, empty, error-with-retry, and offline states.
25. Every action that changes data disables its button while pending and shows the server's error message on failure. Never surface raw exception text or stack traces.
26. User-facing copy: sentence case, no exclamation marks, say what happened and what to do next.
27. Match the surrounding code's style. Keep comments rare and useful.

## UI and testing rules (see `docs/11-ui-theme-and-visual-testing.md`)

31. Use NativeWind + react-native-reusables components and `lucide-react-native` icons. Do not hand-build components the library provides.
32. No emoji in UI, copy, or notifications. Use the real logo and real icons.
33. Match the web theme tokens in doc 11.
34. Every module or user flow ends with a Playwright (Chromium, phone viewport) run plus a look at the screenshots before its task is marked DONE. Mock the API; never type real credentials into the app.

## Store-compliance rules (see `docs/07-store-compliance.md`)

28. Request only the permissions listed in that document.
29. No remote code loading except signed Expo OTA updates as documented.
30. Do not ship debug menus, test endpoints, or hard-coded credentials in release builds.
