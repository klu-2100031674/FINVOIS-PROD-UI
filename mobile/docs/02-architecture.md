# 02 · Architecture

## System overview

```
┌────────────────────┐   HTTPS + Bearer access token   ┌──────────────────────────┐
│ Finovis Mobile app │ ───────────────────────────────▶│ FINVOIS-DEV-API (Express)│
│ Expo / RN / TS     │                                 │  existing routes         │
│  - secure-store    │◀─────── JSON / PDF blob ────────│  + /api/mobile/* (new)   │
│  - TanStack Query  │                                 └───────────┬──────────────┘
└─────────▲──────────┘                                             │
          │ push (type + id only)                    ┌─────────────┼──────────────┐
          │                                          ▼             ▼              ▼
   ┌──────┴───────┐                              MongoDB      Mail/WhatsApp   R2 storage
   │ Expo Push    │◀── send from API ───────────  (Mongoose)   services        (report PDFs)
   │ → FCM / APNs │
   └──────────────┘
```

Web app is untouched and keeps using its own login and 7-day token.

## Repository layout
```
Projects/
  FINVOIS-DEV-API/     existing backend (+ new mobile files, see below)
  FINVOIS-DEV-UI/      existing web (DO NOT TOUCH)
  finovis-mobile/
    docs/  tasks/  AGENT_RULES.md ...
    app/                Expo app (created in task A01)
```
Note: the `mobile/` folder was added to the `FINVOIS-DEV-UI` repo by owner decision on 2026-11-03; `finovis-mobile/` above is now `FINVOIS-DEV-UI/mobile/`.

## Mobile app structure (`app/`)
```
app/
  app.config.ts          static config, no secrets
  src/
    api/                 client.ts (axios + refresh), auth.ts, adminReports.ts, requests.ts, send.ts, push.ts
    auth/                session store (secure-store), useSession, role guard
    navigation/          RootNavigator, AdminTabs, AgentTabs
    screens/
      auth/Login
      admin/Dashboard, ReportList, ReportDetail, RequestList, RequestDetail, Profile
      agent/MyWork, RequestDetail, Profile
      shared/PdfViewer, SendReportSheet, AssignSheet
    components/          StatCard, StatusPill, ListRow, EmptyState, ErrorState, Sheet
    notifications/       register.ts, handlers.ts (deep-link routing)
    security/            deviceIntegrity.ts, inactivityLock.ts, secureScreen.ts
    utils/               format.ts, errors.ts
```

## Technology choices
| Concern | Choice | Reason |
|---|---|---|
| Framework | Expo SDK (managed, EAS Build), TypeScript strict | One codebase, store-ready builds, signed OTA updates, first-party push |
| Navigation | React Navigation (native stack + bottom tabs) | Standard, deep-link support |
| Server state | TanStack Query | Caching, retry, refetch on focus |
| HTTP | axios with one instance and refresh interceptor | Matches web, interceptor support |
| Token storage | `expo-secure-store` (Keychain / Android Keystore) | Hardware-backed where available |
| PDF | `expo-file-system` download to app cache + `expo-sharing`/native viewer | No external storage |
| Push | `expo-notifications` + Expo Push Service (FCM V1, APNs) | See doc 08 |
| Tests | Jest + React Native Testing Library; API Jest tests in backend repo | Backend already uses Jest 30 |

## Backend additions (all under `/api/mobile`)
New files only. The one existing file edited is the route index to mount the router.

| File | Responsibility |
|---|---|
| `src/models/MobileSession.js` | Refresh-token records (hashed), device id, revoked flag, family id |
| `src/models/DeviceToken.js` | Push tokens per user/device |
| `src/routes/mobile.js` | Router: auth, push token, admin context, send |
| `src/services/mobileAuthService.js` | Issue/rotate/revoke tokens |
| `src/services/pushService.js` | Send push via Expo, prune dead tokens |
| `src/services/mobileSendService.js` | Recipient resolution, gating, dispatch |

Hooks into existing code (small, named in tasks): assign endpoint and approve endpoint call `pushService`; `claimExpiryService` gains an "expiring soon" pass.

## Data flow examples
**Approve a report:** app `PATCH /api/admin-reports/:id/approve` (existing) → server updates → server calls `pushService.notifyReportApproved` (new hook) → owning agent's device gets a push with `{type:'report_approved', id}` → tap opens agent request detail.

**Send a report:** app `POST /api/mobile/reports/:id/send` with recipients + channels → server loads report, checks role, ownership rules, `approved` and `payment.status === 'completed'` → resolves PDF via the existing buffer helper → dispatches through `mailService` / `whatsappService` → returns per-recipient results.

## Environment configuration
**App.** `EXPO_PUBLIC_API_BASE_URL` is the only public runtime setting. Separate values for dev, staging, production via EAS build profiles. Nothing else may be put in an `EXPO_PUBLIC_*` variable (it ends up in the bundle).

**Backend.** `FINVOIS-DEV-API` has no `.env.example`, so this table is the reference; add the same names there if one is ever created. All are optional. The environment is fixed when the process starts, so a change needs a restart.

| Variable | Default | Effect |
|---|---|---|
| `MOBILE_ACCESS_TOKEN_TTL` | `15m` | Lifetime of the mobile access JWT. A `jsonwebtoken` `expiresIn` string; always include the unit (`15m`, `900s`). Keep it short: revocation is checked per request, but a stolen token is valid until it expires or its session is revoked. |
| `MOBILE_REFRESH_TOKEN_TTL_DAYS` | `30` | Lifetime of a refresh token and its session, in whole days. An invalid or zero value falls back to 30. Sessions are removed by a TTL index after expiry. |
| `MOBILE_MIN_APP_VERSION` | unset | Force-upgrade gate, for example `1.2.0`. When set, every `/api/mobile/*` request (health included) whose `X-App-Version` header is missing or lower gets `426 {code:"UPDATE_REQUIRED"}`. Leave unset to allow every build. Compared numerically per segment (`1.10.0` is newer than `1.9.0`). |
| `EXPO_PUSH_ACCESS_TOKEN` | unset | Optional Expo "enhanced push security" token, sent as `Authorization: Bearer` to the Expo push API. A secret: set it only in the server environment, never commit it, never log it. Without it pushes still work. |
| `MOBILE_LOGIN_LIMIT_MAX` | `5` | Mobile login attempts allowed per window per IP and email. Keep the default in production; the local e2e server raises it so test suites can sign in repeatedly. |
| `MOBILE_LOGIN_LIMIT_WINDOW_MS` | `60000` | Window for the limit above. |
| `EXPO_PUSH_ENDPOINT` | `https://exp.host/--/api/v2/push/send` | Test hook so pushes can be captured locally. Do not set in production. |
| `EXPO_PUSH_RETRY_BASE_MS` | `500` | Backoff base for retrying a failed push batch (doubles per attempt, 3 attempts). Tests set it to 1. |

Existing variables the mobile surface relies on: `JWT_SECRET` (required; signs mobile access tokens and keys the send de-duplication HMAC, so it must stay secret and stable) and `LOGIN_RATE_LIMIT_MAX` / `LOGIN_RATE_LIMIT_WINDOW_MS` (web password logins, unchanged). Rate limiters keep their counters in each API process, so under PM2 cluster mode (`instances: 'max'` in `ecosystem.config.js`) the effective limit is the setting times the number of workers; see `docs/security-signoff-backend.md`.

## Non-functional targets
- Cold start to login under 3 s on a mid-range Android.
- Dashboard data visible under 2 s on 4G.
- All screens usable at font scale 1.3 and on 360 dp wide screens.
- Crash-free sessions ≥ 99.5% in first release month.
