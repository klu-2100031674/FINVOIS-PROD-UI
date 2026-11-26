# A08 · Shared send-report sheet

**Depends on:** A05, B05 · **Read first:** `docs/03-user-flows.md` F4, `docs/04-wireframes.md` S7, `docs/05-api-contract.md` §B7, `docs/06-security-architecture.md` (threat: malicious send)

## Goal
One reusable sheet used by admin and agent to send an approved, paid report.

## Steps
1. `src/api/send.ts`: `sendReport(reportId, {recipients, channels, applicant?})` → `POST /mobile/reports/:id/send`, typed results.
2. `SendReportSheet` props: `reportId`, `role`, `hasStaff`, `applicantDefaults{phone,email}`. Defaults: admin → Me + Assigned staff; agent → Applicant. At least one recipient and one channel required (client validation for UX only).
3. Applicant contact editable inline with format validation (10-digit or E.164 phone; email format).
4. Send → spinner, disable controls. Result screen lists recipient × channel with Delivered / Failed(reason), **Retry failed** re-sends only failed combinations, **Done** closes.
5. Map 400/402/403/429/502 to the server's message; 402 shows "Payment must be completed before the report can be sent." with no bypass action.
6. Entry points: admin `ReportDetail` (approved only), agent `RequestDetail` (A10). The button is hidden unless the report is approved; the server remains the enforcer.
7. Tests: default selection per role, validation, retry-only-failed, error mapping.

## Acceptance checks
- [ ] Admin sends to Me + staff via WhatsApp and email; all four messages arrive on real test contacts.
- [ ] Unpaid or unapproved report shows the server error and sends nothing.
- [ ] Rapid double-tap sends once (button disabled; server idempotency also verified with curl).
- [ ] A partial failure is displayed accurately and retry resends only the failed items.

## Do not
- Add free-text recipient fields other than the applicant override.
- Show or log full phone numbers/emails in analytics or console.
