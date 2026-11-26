# Decisions (owner-approved)

Do not re-open these. Dates are absolute.

| # | Decision | Date |
|---|---|---|
| D1 | Cross-platform app with React Native via Expo (TypeScript), one codebase for iOS and Android | 2026-09-30 |
| D2 | Two roles only: CA / super admin (`admin`) and customer-service agent (`customer_service`). One login screen, routes by role, rejects all others | 2026-09-30 |
| D3 | Dashboard shows raw API counts from `/admin-reports/stats`. The web's hard-coded `+4492` Approved offset is NOT applied | 2026-09-30 |
| D4 | Dashboard covers all report types ("everything mostly"), with a filter for report type | 2026-09-30 |
| D5 | Add one new backend send endpoint: recipients (me, assigned staff, applicant) by WhatsApp and/or email | 2026-09-30 |
| D6 | Admin can both assign staff and approve / reject / mark under review | 2026-09-30 |
| D7 | Report generation stays on the web. Mobile never generates reports | 2026-09-30 |
| D8 | Sending is blocked until the report is CA-approved and payment is complete. Admin cannot bypass this | 2026-09-30 |
| D9 | Push notifications are in v1 | 2026-09-30 |
| D10 | Store acceptance (Play Store, and App Store) and hack-resistant architecture are hard requirements | 2026-09-30 |
| D11 | Project folder is `finovis-mobile` inside `D:\github-desktop\Projects` | 2026-09-30 |
| D12 | Bring the app in line with the web for the two roles: the four customer-service queues, queue filters, application details, report status, document upload and delete, Excel download, approval notes and amount, email on/off, re-review, report date and company filters, request contact and collaboration links, change password, forced temporary-password change. `expo-document-picker` is added for upload (no new Android permission). Payments, bulk actions, forgot password and profile editing stay out for now | 2026-11-04 |
| D13 | Add the web's Email automation to the app for the admin (owner request, 2026-11-04): folders of emails from Excel, templates with attachments, schedule or send now, tracking, retry, reuse, cancel, and the sender daily limit. The app edits email bodies as plain text, and a body with web formatting stays untouched unless the admin chooses to replace it. No new package; no backend change. The customer-service role has this on the web, but it stays admin-only in the app (owner, 2026-11-04). The backend's separate `agent` role cannot sign in to the app at all (D2) | 2026-11-04 |
