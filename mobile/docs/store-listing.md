# Store listing

**Draft - not approved by owner**

This draft covers task A13 steps 5 and 8. It is drafted from `docs/07-store-compliance.md` and the permissions and behavior in `app/app.config.ts`. Nothing here is final until the owner approves the text (A13 acceptance). Fields that only the owner can supply are literal `TODO owner:` placeholders. Do not fill them in from guesses.

## 1. App name

Current value in `app/app.config.ts`: Finvois.

TODO owner: confirm the final store name. The task files and docs say Finovis, so the two must be reconciled before the first upload.

## 2. Identifiers and contacts

- Android application id: TODO owner: package id (`com.finovis.mobile` is a placeholder in `app.config.ts`).
- iOS bundle id: TODO owner: bundle id (same placeholder; keep it equal to the Android id where possible).
- Privacy policy URL: TODO owner: privacy policy URL (public, HTTPS).
- Support email: TODO owner: support email.

## 3. Short description

Maximum 80 characters for Google Play.

> Internal workflow tool for admins and customer service staff.

## 4. Full description

> Sign-in only app for the administrators and customer service staff of Finovis.
>
> Use the app to view the loan report documents and requests that your team manages. Accounts are created by your company administrator. The app has no sign-up.
>
> The app is an internal workflow tool for loan report preparation. It does not offer loans, does not take payments, does not show advertising and has no in-app purchases.
>
> Push notifications about assigned work are optional. Your device asks for permission before the app can send them.

## 5. Keywords and subtitle

- Apple subtitle (30 characters maximum): `Internal staff workflow`
- Apple keywords (100 characters maximum, comma separated): `loan,reports,documents,workflow,admin,staff,support,requests,internal,back office`
- Google Play has no keyword field. Search terms come from the title and full description above.

## 6. Release notes for version 1.0.0

> First release for internal staff. Sign in with the account your company administrator created. Push notifications for assigned work are optional and need your permission.

## 7. Google Play data safety draft

Source: `docs/07-store-compliance.md`, Google Play section. Each row needs a line-by-line check against the final build before submission.

| Data type | Collected | Shared | Purpose | Encrypted in transit | Notes |
|---|---|---|---|---|---|
| Name (applicants and staff) | Yes | No | App functionality | Yes | Shown in request and report screens |
| Email address (applicants and staff) | Yes | No | App functionality | Yes | |
| Phone number (applicants and staff) | Yes | No | App functionality | Yes | Used for the call and WhatsApp links |
| Financial info (loan and report documents viewed) | Yes | No | App functionality | Yes | Documents are shown in the app and not stored outside the app sandbox |
| Device or other IDs (push token, device id) | Yes | No | App functionality | Yes | Device id is generated once per install and kept in secure storage |
| App activity, app info and performance | No | No | Not applicable | Not applicable | No analytics or crash SDK is in the app |

Other answers:

- Data sold: No. Ads: none. In-app purchases: none.
- Data deletion: staff accounts are created and removed by the company. TODO owner: describe the request process and the contact for deletion requests.
- Account deletion policy: not applicable, because the app has no in-app sign-up (doc 07).
- Financial features question: document management for loan report preparation. No lending and no payments in the app.
- Target audience: adults, business use. Not designed for children.
- Content rating: expected to be Everyone. Confirm in the questionnaire.

Points to decide before submission:

- Shared. The answer is No only if push messages go through Finovis's own servers. `OPEN_QUESTIONS.md` Q6 recommends Expo Push Service, which would receive the push token. If that is chosen, the device id row must change to Shared: Yes. TODO owner: confirm Q6.
- Login credentials. The email and password used to sign in are not in the expected list in doc 07. TODO owner: decide whether they are declared under personal info or user IDs.
- The app will send a device integrity flag (`X-Device-Integrity`) to the API once it is wired in `api/client.ts`. Decide whether it needs its own row. It is not declared today.

## 8. Apple privacy label draft

Source: `docs/07-store-compliance.md`, Apple App Store section.

Data linked to the user (doc 07 says linked to identity):

| Category | Data | Purpose | Linked to user | Used for tracking |
|---|---|---|---|---|
| Contact info | Name, email address, phone number | App functionality | Yes | No |
| User content | Loan and report documents viewed | App functionality | Yes | No |
| Identifiers | Device id, push token | App functionality | Yes | No |

Data not collected: diagnostics, usage data, purchases, location, contacts, photos and other sensitive data. The app has no location, contacts, camera or photo permission (see section 9).

Tracking: No. The app does not show the App Tracking Transparency prompt.

Points to check:

- The category for loan and report documents can be User content or Financial info. TODO owner: confirm the category with the data map.
- If the push provider from Q6 is a third party, the label must include what that provider receives.

## 9. Permissions behind these answers

Doc 07 allows only `INTERNET`, `POST_NOTIFICATIONS` (Android 13 and later) and the Expo defaults. `app/app.config.ts` also loads `expo-notifications`, `expo-local-authentication` (biometric unlock, optional), `expo-secure-store`, `expo-sharing` and `expo-build-properties` (cleartext traffic off).

Open items for the manifest audit (A12 and A13 step 4):

- `USE_BIOMETRIC`, `USE_FINGERPRINT` and `VIBRATE` come from the plugins above and are not yet listed in doc 07.
- The generated Android manifest also declares storage and overlay permissions. They are not yet removed in `app.config.ts`.

## 10. Other store fields

- App Review and Play App access: TODO owner: demo admin and demo agent accounts on the staging dataset. Credentials are kept in the owner's password manager and entered in the store consoles only. They never go in this file.
- Export compliance: `ITSAppUsesNonExemptEncryption` is false in `app.config.ts`. Confirm at submission.
- Screenshots and feature graphic: staging demo data only. No real applicant data.
- Release notes and listing text need owner approval before use.
