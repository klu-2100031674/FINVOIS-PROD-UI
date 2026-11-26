# 07 · Store compliance (Google Play and Apple App Store)

Store rules change. Requirements marked (verify) must be re-checked in Play Console / App Store Connect at submission time; do not rely on this file's numbers alone.

## Google Play

### Build and technical
- Upload an **Android App Bundle (.aab)** built by EAS. Enroll in **Play App Signing**.
- **Target API level:** must meet Google's current requirement for new apps and updates (verify in Play Console → Policy status). Keep Expo SDK current enough that its default `targetSdkVersion` satisfies it.
- 64-bit support: satisfied by default RN/Expo builds.
- Unique `applicationId`, e.g. `com.finovis.mobile` (owner to confirm the real package name; it cannot change after publishing).
- `versionCode` increments every upload (EAS auto-increment).

### Store listing and policy
- **Privacy policy URL** (public, HTTPS, mentions data collected, purpose, retention, deletion contact). Owner supplies (Q4).
- **Data safety form** — declare honestly. Expected declarations:
  - Personal info: name, email, phone (of applicants viewed, and of staff) — collected/processed, not sold, not shared for ads; purpose: app functionality; encrypted in transit.
  - Financial info: loan/report documents viewed — app functionality.
  - App activity/diagnostics: crash logs only if a crash tool is added (declare if so).
  - Device or other IDs: push token, device id — app functionality.
  - Data deletion: users are staff accounts managed by the company; describe the request process.
- **App access:** provide reviewers a **test admin account and a test agent account** on a non-production dataset (never real applicant data). Put credentials in the App access section, not in the listing text.
- **Content rating** questionnaire (expected: everyone).
- **Target audience:** adults/business; not designed for children.
- **Account deletion policy:** applies to apps that let users create accounts in-app. This app has no sign-up, so it does not apply; state that accounts are created by the company admin.
- **Permissions (only these):** `INTERNET`, `POST_NOTIFICATIONS` (Android 13+), and these library defaults, each justified:
  - `USE_BIOMETRIC` and `USE_FINGERPRINT` (from `expo-local-authentication`): optional biometric unlock of the inactivity lock (doc 06 section 3). Normal protection level, no runtime prompt.
  - `VIBRATE` (from `expo-notifications`): notification vibration. Normal protection level, no runtime prompt.

  Do **not** request contacts, SMS, call, location, storage, camera, microphone or overlay (`SYSTEM_ALERT_WINDOW`). Calling uses a `tel:` intent. Expo's template adds `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` and `SYSTEM_ALERT_WINDOW`; `app.config.ts` removes them with `android.blockedPermissions` (guarded by `releaseHygiene.test.ts`). Any new permission must be added here with its reason first. Review the final merged manifest before each submission (task A12, `docs/security-signoff-app.md` section 6).
- No financial-services policy trigger for loans issuance: the app does not offer loans; it is an internal workflow tool. If Play asks about "financial features," answer accurately: document management for loan-report preparation; no lending, no payments in the app.
- Ads: none. In-app purchases: none.
- **Testing track requirement (verify):** new personal developer accounts may need a closed test with a minimum number of testers for a minimum period before production access. Organization accounts typically do not. Plan for internal → closed → production.

### Rejection risks and mitigations
| Risk | Mitigation |
|---|---|
| Reviewer cannot log in | Working test credentials in App access, on a stable staging API |
| "Minimum functionality" | App has real workflow features behind login; listing explains it |
| Misleading metadata | Name and description state it is for admins and support staff of Finovis |
| Data safety mismatch | Fill the form from the actual data map above; re-audit with each release |
| Excess permissions | Manifest audit in A12 |
| Crash on launch on reviewer device | Test on API 29–latest, low RAM device, and Pixel emulator before submit |

## Apple App Store

- Apple Developer Program membership (owner). Bundle id matches the Play package where possible.
- Build with EAS for iOS; distribute via TestFlight first.
- **App Review Information:** demo admin and agent credentials + short notes ("Login-only internal tool; use the demo accounts").
- **Privacy Nutrition Label:** mirrors the Data safety answers (contact info, financial/other user content, identifiers; linked to identity; not used for tracking). No ATT prompt (no tracking).
- **Push:** APNs key configured in EAS credentials. Permission requested in context (rationale screen).
- **Sign in with Apple:** not required (no third-party social login).
- **Account deletion (5.1.1(v)):** required only when the app supports account creation; not applicable. Keep a note in review notes.
- **Guideline 4.2 / 2.1:** fully working, no placeholder content, no beta labels, no dev URLs.
- Export compliance: uses only standard HTTPS/OS crypto → `ITSAppUsesNonExemptEncryption = false` (verify when submitting).
- Info.plist usage strings only for permissions actually used (notifications need none). No camera/photo/contacts strings.

## Assets checklist (task A12)
- App icon 1024×1024 (no transparency for iOS), Android adaptive icon (foreground + background), monochrome layer optional.
- Feature graphic 1024×500 (Play).
- Screenshots: phone (min 2, recommended 4–8) from real app with **demo data only**; iPhone 6.7" and 6.5" sets, iPad only if `supportsTablet` is true (set false in v1).
- Short description (80 chars), full description, keywords/subtitle for iOS, support email, privacy policy URL, marketing URL optional.
- Release notes for v1.0.0.

## Release gates (all must pass)
1. Security checklist in doc 06 §11 signed off.
2. Testing gates in doc 09 passed.
3. Manifest/permissions audit clean.
4. Test accounts verified against staging on a physical device.
5. Owner approves store text and screenshots.
