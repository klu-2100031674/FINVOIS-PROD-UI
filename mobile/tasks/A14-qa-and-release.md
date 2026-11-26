# A14 · Full QA, security checklist, release

**Depends on:** A13, B07 · **Read first:** `docs/09-testing-and-release.md`, `docs/06-security-architecture.md` §11, `docs/07-store-compliance.md` (Release gates)

## Goal
Verify the exact release builds and ship them.

## Steps
1. Run the manual QA matrix (admin, agent, negative scripts) on the internal-track and TestFlight builds; record results per case with device/OS.
2. Run the full security checklist (doc 06 §11) against those builds and the staging API; attach evidence to `docs/security-signoff-app.md` and `docs/security-signoff-backend.md`.
3. Confirm API and app suites green; confirm no open high-severity items.
4. Fix defects found (each as its own small task/commit); re-run affected cases.
5. Owner sign-off on store text and screenshots.
6. Submit to Google Play (staged rollout) and App Store review; monitor review feedback and respond within a day.
7. After release: watch crash-free rate and API error rates for the first week; keep `MOBILE_MIN_APP_VERSION` ready as a kill switch.
8. Tag the release; archive build artifacts, mapping files, and sign-off docs.

## Acceptance checks
- [ ] QA matrix 100% pass (or documented, owner-accepted exceptions).
- [ ] Security checklist fully ticked with evidence.
- [ ] Owner approval recorded in `DECISIONS.md` as D12.
- [ ] Both stores show the app as submitted/approved.

## Do not
- Ship with an unchecked high-severity security item or failing negative test.
