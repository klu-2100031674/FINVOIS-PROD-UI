# 01 · Product and scope

## Purpose
Give the CA (super admin) and customer-service agents a phone app for the DPR workflow that already runs on the web: see status, assign work, review, and send finished reports.

## Users
| Role | Backend role | Goal in the app |
|---|---|---|
| CA / super admin | `admin` (legacy `super_admin` is normalized to `admin` by `normalizeRole`) | Monitor DPR status, approve/reject/mark under review, assign staff, send reports |
| Customer-service agent | `customer_service` | Claim or receive requests, contact applicants, view documents and messages, send finished reports |

## In scope (v1)
1. Single login screen for both roles. Any other role is rejected.
2. **Admin dashboard:** Pending, Under review, Approved, Rejected, Total (raw API counts), filterable by report type.
3. **Admin Reports tab:** list by status, detail, view PDF, approve, reject, mark under review.
4. **Admin Requests tab:** list department requests, assign to a staff member, unassign (return to pending).
5. **Send report** (admin and agent): recipients (me, assigned staff, applicant) and channels (WhatsApp, email). Enforces CA-approved and paid.
6. **Agent My work:** tabs Open, Mine, Done. Claim, release, request detail, documents list, messages, call applicant.
7. **Push notifications:** new DPR assigned (agent), report approved (owning agent), claim expiring (agent), new DPR submitted (admin).
8. Secure session handling (see doc 06), Play Store and App Store readiness (doc 07).
9. **Web parity additions (D12, 2026-11-04):**
   - Agent queues match the web: Open, Mine (not started), In progress (with Preparation, Payment, With CA and Rejected groups), Done (my approved and paid reports). Search by name, phone or email on each, department filter on each, payment and CA filters on Open, automatic refresh every 3 minutes.
   - Request detail (agent and admin): application details (the submitted form), documents with upload and delete, messages. The agent also gets department, handler, a report status card with amount due and sent indicators, the reason sending is blocked, and Excel download. The admin also gets call and WhatsApp buttons.
   - Admin reports: approve with notes, the channel-partner amount to collect, and the email on/off switch. Reject with the email on/off switch. Re-review of a rejected report. Excel download. Date range and company filters. Company, nature of business, amount, review notes and user comment on the detail screen. WhatsApp gateway warning when sending.
   - Admin requests: department filter, search also matches email.
   - Everyone: change password. An account with a temporary password must set its own before using the app.
10. **Email automation (D13, 2026-11-04), admin only, as a fifth tab:**
   - Numbers (total, sent, pending, failed, scheduled, completed requests) and the sender daily limit, which the admin can change. Numbers refresh every 15 seconds while something is queued or sending.
   - Data: folders of emails. Create, delete, upload Excel with the column names to read (remembered between uploads), search, remove an email.
   - Templates: create, edit, delete, with placeholders and attachments. Bodies are edited as plain text. A body with formatting from the web is shown as text and saved unchanged, unless the admin chooses to replace it with plain text.
   - Schedule: pick folders (unique emails shown), a template and extra attachments, then a send time in IST (10:00 AM to 11:59 PM) and dates (single, every day, 1 week, 1 month, 3 months, or picked by hand), or send now after a confirmation.
   - Sent and scheduled requests: records with validation and send status, cancel a schedule, continue a draft, retry failures, reuse recipients for a new send, delete.

## Out of scope (do not build)
- Report generation, editing, regeneration, Excel upload/revise, the CA stamp toggle.
- Payments, Razorpay flows, commissions, sending or copying payment links, paying on behalf.
- Bulk approve, bulk review and bulk delete of reports.
- Forgot password and editing your own profile (both stay on the web).
- Creating or managing users, departments, forms, companies.
- Customer/applicant login, other staff roles (agents, executives, bankers, company admins, viewers).
- Chat beyond reading/sending the existing request messages.
- Offline editing. The app is online-first; cached reads are allowed, writes require a connection.
- Tablet-optimized layouts, web build, dark-mode-only theming.

## Status vocabulary
The two roles see two different vocabularies because the backend has two:

| Object | Values | Used by |
|---|---|---|
| Report `validation_status` | `pending_validation` (Pending), `under_review`, `approved`, `rejected` (`draft` excluded from Total) | Admin Reports tab, dashboard |
| DepartmentRequest workflow key | `pending`, `initiated`, `preparation`, `ca_validation`, `generated`, `rejected` with labels: Pending, Request initiated, DPR under preparation, DPR sent for CA validation, DPR Generated successfully, Rejected | Admin Requests tab, agent screens |

Never map one vocabulary onto the other in the UI. Show each object with its own labels.

## Success criteria
- An admin can go from login to "report approved and sent to me + staff by WhatsApp" in under 2 minutes on a normal connection.
- An agent receives a push when assigned work and can open the exact request from the notification.
- The app passes Google Play and App Store review on first submission (checklist in doc 07).
- The security checklist in doc 06 passes with zero open high-severity items.
