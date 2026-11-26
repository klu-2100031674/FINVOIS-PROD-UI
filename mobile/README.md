# Finovis Mobile

> **Location (2026-11-03):** this project now lives at `mobile/` inside the `FINVOIS-DEV-UI` repo (moved from the standalone `finovis-mobile` folder by owner decision). The backend is `FINVOIS-DEV-API`; the `/api/mobile/*` routes and the e2e server are on its `merge-mobile-into-main` branch. Paths like `../FINVOIS-DEV-API` below assume the old sibling layout; from `mobile/app` the backend is `../../../FINVOIS-DEV-API`.

React Native (Expo) app for iOS and Android. Used by two roles only:

- **CA / super admin** (backend role `admin`): sees DPR counts, reviews reports (approve, reject, mark under review), assigns work to support staff, sends reports.
- **Customer-service agent** (backend role `customer_service`): works the request queue, claims requests, contacts applicants, sends finished reports.

The backend (`../FINVOIS-DEV-API`) and web app (`../FINVOIS-DEV-UI`) already exist and work. This project adds a mobile client plus a small, isolated set of backend additions under `/api/mobile/*`. Nothing in the web app changes.

## If you are an AI agent: read this first

Read in this exact order before touching any code:

1. `AGENT_RULES.md` — hard rules. Violating one is a failed task.
2. `docs/01-product-and-scope.md` — what is in and out of scope.
3. `docs/02-architecture.md` — how the pieces fit.
4. `docs/06-security-architecture.md` — the security model. Every task must respect it.
5. `docs/03-user-flows.md` and `docs/04-wireframes.md` — behavior and screens.
6. `docs/05-api-contract.md` — exact endpoints (existing and new).
7. `tasks/00-TASK-INDEX.md` — the ordered task list. Work on **one** task file at a time.

Then open only the task file you were assigned. Each task file lists its dependencies, files to touch, steps, acceptance checks, and things you must not do. Do not start a task whose dependencies are not marked done in the index.

## Folder map

| Path | Purpose |
|---|---|
| `AGENT_RULES.md` | Non-negotiable rules for any AI or human contributor |
| `DECISIONS.md` | Decisions the owner already made (do not re-litigate) |
| `OPEN_QUESTIONS.md` | Unresolved items. Ask the owner; do not guess |
| `docs/` | Product, architecture, flows, wireframes, API, security, store compliance, push, testing |
| `tasks/` | One file per task, with an index and status table |
| `app/` | (created by task A01) the Expo app source |

## Status

Documentation complete. No code written. First tasks: `tasks/B01-mobile-scaffold-backend.md` (backend) and `tasks/A01-expo-scaffold.md` (app). Doc files are `docs/01` to `docs/10` (10 = verified backend facts).
