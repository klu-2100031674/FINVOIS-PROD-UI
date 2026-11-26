# 11 · UI theme, component library, and visual testing

Owner instructions (2026-09-30): follow the web theme; use the real logo and real icons, no emoji; use a component library instead of building from scratch; run visual Chrome Playwright testing after every module or user flow.

## Component stack (fixed)
| Need | Choice |
|---|---|
| Styling | NativeWind v4 (Tailwind for React Native), same utility classes as the web |
| Components | react-native-reusables (the React Native port of shadcn/ui, the same library family the web app uses via `components.json`). Add components with `npx @react-native-reusables/cli@latest add <name> --cwd .`; they land in `app/src/components/ui/` |
| Icons | `lucide-react-native` (the web uses `lucide-react`). No emoji anywhere in UI, copy, alerts, or push text |
| Logo | Real logo `app/assets/finvois-logo.png` (copied from `FINVOIS-DEV-UI/src/assets/finvois.png`). Store icon/splash derive from it |
| Fonts | Manrope (headings, buttons) and Inter (body) via `@expo-google-fonts` |

Do not hand-build a Button, Input, Card, Dialog, Sheet, Tabs, Select, etc. if reusables has it. Compose from the library and restyle through tokens.

## Theme tokens (mirror of the web)
Source of truth: `FINVOIS-DEV-UI/tailwind.config.js`, `src/index.css`, `src/pages/AuthPage.jsx`. Mobile mapping lives in `app/global.css` and `app/tailwind.config.js`.
- Surfaces: white cards, `rounded-3xl` on hero cards, `rounded-xl` on inputs/buttons, soft shadow.
- Primary action: **black** button (`bg-black`, white text, Manrope semibold). Secondary: outline.
- Accent/links/active tab: purple (`purple-600` `#7c3aed`), focus ring purple-500.
- Backdrop for auth screens: soft lilac to pink to pale yellow gradient (web uses blurred purple/pink/yellow blobs).
- Text: gray-900 headings, gray-600 body, gray-500 muted. Errors: `red-50` fill, `red-200` border, `red-700` text.
- Status pills (web `dprWorkflowStatus.js`): pending gray, initiated amber, preparation blue, ca_validation purple, generated green, rejected red. Report statuses: pending yellow, under review blue, approved green, rejected red.
- Owner will attach additional theme screenshots; when they arrive, add them under `docs/theme/` and reconcile this file.

## Visual testing rule (every module and user flow)
A module or flow is not done until a Playwright test has driven it in Chromium at phone size and the screenshots were looked at.
- Tool: `@playwright/test`, config `app/playwright.config.ts`, specs in `app/e2e/`, screenshots in `app/e2e/screenshots/` (git-ignored).
- Target: the Expo **web export** (`npx expo export -p web`, served from `dist/`). Web is a test harness only, not a shipped platform. Native-only behavior (secure-store, push, screen capture, root detection) is covered by device QA in doc 09.
- Network: mocked with `page.route` (`app/e2e/helpers.ts`). **Never type real credentials into the app.** Real-backend checks use curl or the owner's own login on a device.
- Each spec covers: happy path, empty state, error state, and the role gate for that flow, and captures screenshots for the review.
- Run: `npm run e2e` (exports web, then runs Playwright).
- Review: open the screenshots and compare against `docs/04-wireframes.md` and the web theme before marking the task DONE.

## Test harness (built 2026-09-30)
- **Real-backend server:** `FINVOIS-DEV-API/scripts/mobile-e2e-server.js` boots the real Express app on an in-memory MongoDB and seeds throwaway accounts (`scripts/mobile-e2e-seed.js`). Mail, WhatsApp, and Expo push are captured, not sent. Test-only endpoints live under `/__e2e/*` on that server only: `reset`, `state`, `sent`, `pushes`, `update`, `run-claim-job`, `fail-next`.
- **Run:** `node scripts/e2e-run.js <slot> [playwright args]` from `app/`. A slot (0-30) fixes the web port (8100+slot), API port (5100+slot), export folder (`dist-slot<slot>`), and Metro cache, so several runs can go in parallel. Example: `node scripts/e2e-run.js 3 e2e/admin-reports.spec.ts`.
- **Helpers:** `app/e2e/real.ts` (`resetDb`, `loginAs`, `apiLogin`, `apiCall`, `sent`, `pushes`, `dbUpdate`, `failNext`, `screenshot`). Call `resetDb` in `beforeEach`.
- **Mocked specs:** `app/e2e/helpers.ts` (`mockAuth`) for failure states that are hard to produce for real (500s, offline). Prefer the real backend.
- **Never** commit an `.env` with a real API URL: Expo's `.env` overrides shell variables and silently repoints test builds. Use `.env.local` on a device, and keep secrets out of `EXPO_PUBLIC_*`.
- **Jest:** `npx jest` for units (`src/**/__tests__`). Typecheck: `npx tsc --noEmit`.
