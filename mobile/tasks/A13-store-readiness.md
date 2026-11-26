# A13 · Store readiness: assets, metadata, builds

**Depends on:** A12, A11 · **Read first:** `docs/07-store-compliance.md`, `OPEN_QUESTIONS.md` Q3, Q4

## Goal
Signed builds and complete store submissions ready to send.

## Steps
1. Get from the owner: final app name, package/bundle id, privacy-policy URL, support email, Apple/Google developer accounts, decision on public vs private listing (Q3, Q4). Blockers → mark task BLOCKED with the missing item.
2. Set final ids in `app.config.ts`; configure EAS credentials (Android upload key via Play App Signing, iOS distribution cert, APNs key, FCM V1 service account) inside EAS only.
3. Assets: icon 1024×1024, adaptive icon layers, splash, feature graphic 1024×500, phone screenshots (and iPhone sets) using **staging demo data only**.
4. Merged-manifest and Info.plist audit: only `INTERNET`, `POST_NOTIFICATIONS` (+ Expo defaults, each justified in a table in the PR); no unused permission strings.
5. Data safety / privacy label answers drafted from `docs/07-store-compliance.md` and cross-checked against the code (push token, device id, no analytics). Record the final answers in `docs/store-listing.md`.
6. Create staging demo admin and agent accounts on non-production data; store credentials in the owner's password manager and enter them in Play "App access" and App Store review notes; never in the repo.
7. Build: `eas build --profile production --platform all`; install the artifacts on physical devices; upload to Play internal testing and TestFlight.
8. Draft listing text (short, full, keywords, release notes) and have the owner approve.

## Acceptance checks
- [ ] Both builds install and launch on physical devices using production config against staging (or production with test accounts).
- [ ] Manifest/permission audit table complete and clean.
- [ ] Data safety answers match actual behavior (reviewed line by line).
- [ ] `docs/store-listing.md` approved by owner.
- [ ] No secrets in repo (`git grep` for keys and passwords).

## Do not
- Use real applicant data anywhere in screenshots or demo accounts.
- Commit credentials or keystores.
