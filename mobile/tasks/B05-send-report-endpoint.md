# B05 · Send-report endpoint

**Depends on:** B02 · **Repo:** `FINVOIS-DEV-API` · **Read first:** `docs/05-api-contract.md` §B7, `docs/06-security-architecture.md` (threat: malicious send), `docs/10-verified-backend-facts.md` (Services to reuse)

## Goal
One endpoint for admin and agent to send an approved, paid report to me / assigned staff / applicant by WhatsApp and/or email.

## Steps
1. Locate `downloadReportPdfBuffer` (in `src/routes/govtForms.js`) and `resolveReportPdfBuffer` (in `src/routes/adminReports.js`). Pick one that works for any report; if neither is importable, extract into `src/utils/reportPdfBuffer.js` **without changing behavior** and re-import from the original with a one-line change, or copy minimal logic. Record the choice in the PR.
2. Create `src/services/mobileSendService.js`:
   - Input: caller user, report id, recipients[], channels[], applicant override.
   - Load report and linked DepartmentRequest (`reportId`).
   - Authorization: `admin` OK; `customer_service` must satisfy `isCsOwnerOfRequest(request, user._id)`; otherwise 403.
   - Gates: `validation_status === 'approved'` (400) and `payment.status === 'completed'` (402, `error_code: PAYMENT_REQUIRED`). No role bypass.
   - Resolve recipients: `me` → caller email/phone; `staff` → request assignee/claimer (400 if none); `applicant` → request customer, override allowed (validated). Max 3 recipients, 2 channels, dedupe.
   - Normalize phone to E.164 (10 digits → `+91`), validate email format; reject invalid with 400 naming the field, not echoing full values.
   - Dispatch: email via `mailService`, WhatsApp via `whatsappService.sendPdfReport`; per-recipient-per-channel result; catch each failure separately.
   - Idempotency: in-memory or DB keyed `(reportId, recipientId/contactHash, channel)` for 60 s returns prior result. Prefer a small DB collection `MobileSendLog` with TTL index (also used as the audit trail: actor, report id, masked recipients, channels, results, timestamp).
   - Set `request.emailSent` / `whatsAppSent` only if applicant recipient succeeded.
3. Route: `POST /mobile/reports/:id/send` with `verifyToken`, `requireMobileSession`, role allow-list `['admin','customer_service']`, `sendLimiter`, and body validation (reject unknown fields).
4. Tests: `tests/mobile-send.test.js`, mocking mail and WhatsApp services.

## Acceptance checks
- [ ] Unapproved → 400; approved but unpaid → 402; both for admin and agent.
- [ ] Agent sending a report of a request owned by another agent → 403.
- [ ] `staff` recipient with no assignee → 400.
- [ ] Partial failure returns 200 with mixed results; all failed → 502.
- [ ] Duplicate call within 60 s does not call mail/WhatsApp again (mock call count).
- [ ] Logs and `MobileSendLog` contain masked contacts and no PDF bytes.
- [ ] Invalid phone/email → 400.
- [ ] More than 3 recipients or an unknown recipient/channel → 400.
- [ ] Applicant flags set only on applicant success.

## Do not
- Add any way to skip approval or payment.
- Send to arbitrary addresses other than the applicant override (audited) and known users.
- Change the existing send routes.
