# 10 · Verified backend facts

Facts confirmed by reading `FINVOIS-DEV-API` and `FINVOIS-DEV-UI` on 2026-09-30. Agents may rely on these. If you find one is wrong, update this file and tell the owner.

## Auth
- `src/middleware/auth.js`: `generateToken(userId)` signs `{userId}` with `JWT_SECRET`, `expiresIn: '7d'`. `verifyToken` reads `Authorization: Bearer`, `jwt.verify`, then `User.findById(decoded.userId)`.
- Token revocation added 2026-09-30: `User.token_version` (default 0). `generateToken(userId, tokenVersion)` now signs `{userId, tv}`; `verifyToken`, `superAdminAuth` and `leadManagerAuth` reject tokens whose `tv` differs from the user's `token_version` (tokens with no `tv` count as 0, so existing sessions stay valid until a bump). The version is bumped on forgot-password reset, both change-password routes, and the new `POST /users/logout-all`. Expiry is still 7 days. Mobile tokens (B02) must include `tv` too. Test: `tests/token-revocation.test.js`.
- `POST /admin-reports/:id/email|whatsapp` now enforce approved + paid via `src/utils/reportSendGate.js` (400 unapproved, 402 `PAYMENT_REQUIRED` unpaid). Legacy approved reports lacking `payment.status = 'completed'` will now be refused; watch for this.
- `normalizeRole` maps `super_admin` → `admin`, `executive` → `sbi_executive`. Always compare roles through it.
- `requireAdminOrApprovalRights`: passes for `admin` **or** any user with approval rights. The mobile app is admin-only, so mobile auth rejects non-admin roles at login regardless.
- `src/routes/users.js` `POST /login` (unified login): checks password, `assertUserCompanyIsActive`, `is_active`, `email_verified` (except `@test.com`/`@loadtest.com`), signup-approval block; returns `{success,userType,data:{user,token}}`.
- `express-rate-limit` is installed. Before 2026-09-30 only the customer-OTP and franchise-apply routes were limited; password logins were not. Fixed 2026-09-30: `src/middleware/loginRateLimit.js` (10 failed attempts per IP+email per 15 min, successes not counted; env `LOGIN_RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_WINDOW_MS`) now guards `POST /users/login`, `POST /leads/login`, `POST /sales/auth/login`. Test: `tests/login-rate-limit.test.js`.
- No `helmet` usage found in `src/app.js`.

## Admin reports (`src/routes/adminReports.js`)
- `GET /stats` returns `{pending, under_review, approved, rejected, total, today_pending}` from `Report.validation_status` (`pending_validation`, `under_review`, `approved`, `rejected`; total = not `draft`). Accepts only `company_id`, not `report_type`.
- `GET /` list filters: `status, report_type, content_kind, user_id, company_id, search, start_date, end_date, page, limit, sort`.
- `PATCH /:id/approve`: allowed from `pending_validation` or `under_review`; calls `onReportApproved`; creates an in-app `Notification` for the report's `user_id`; emails owner by default.
- `PATCH /:id/reject`: `rejection_reason` required; same allowed source statuses.
- `POST /:id/email|whatsapp`: had no approval/payment check; now gated (fixed 2026-09-30, see Auth section).
- Web dashboard adds `STATS_OFFSETS.approved = 4492` in `FINVOIS-DEV-UI/src/pages/admin/AdminReportsPage.jsx`. Mobile does not (D3).

## Department requests and assignment (`src/routes/govtForms.js`)
- Agents list: `GET /customer-service` (admin, department).
- `GET /requests` returns each request with `workflow` computed by `getDprWorkflowStatus`.
- `POST /requests/:id/assign {csUserId}`: sets `assignedTo`, clears `claimedBy`, `claimedAt=now`, `status='assigned'`; only when `canAdminAssignRequest`.
- `POST /requests/:id/admin-release`: admin unassign; blocked when workflow is `ca_validation` or `generated`.
- `POST /requests/:id/claim` and `/release`: `customer_service` only.
- `POST /requests/:id/send-email` and `/send-whatsapp`: `customer_service` only, CS must own the request, report must be `approved` and `payment.status === 'completed'` (402 `PAYMENT_REQUIRED` otherwise), sends only to a typed address/phone.
- Workflow keys/labels: `dprWorkflowStatus.js` (`pending`, `initiated`, `preparation`, `ca_validation`, `generated`, `rejected`).
- `CLAIM_TTL_MS = 15 * 60 * 1000`. Source comments in `govtForms.js` still say "2-minute"; the constant is authoritative.

## Claim expiry job
- `src/services/claimExpiryService.js`: `startClaimExpiryJob()` runs `expireStaleClaims()` on start and every 15 s; returns stale `claimed`/`assigned` requests (no generation started, no draft, no report) to `open`.

## Data links
- `DepartmentRequest` has `reportId`, `claimedBy`, `assignedTo`, `claimedAt`, `status` (`open`, `assigned`, `claimed`, `completed`), `emailSent`, `whatsAppSent`.
- Assign works on **DepartmentRequest**; approve works on **Report**. They are linked by `DepartmentRequest.reportId`.

## Services to reuse for sending
- `mailService.sendReportWithPdf(email, title, pdfBuffer)` (agent path) and `mailService.sendReportPdfEmail(email, name, {title,pdfBuffer})` (admin path).
- `whatsappService.sendPdfReport(phone, title, pdfBuffer)`; admin path normalizes phone to `+91…` for 10-digit numbers and treats `result.status === 'success'` as success.
- PDF buffer helpers: `downloadReportPdfBuffer` (in `govtForms.js`) and `resolveReportPdfBuffer` (in `adminReports.js`). B-task must locate them and extract or import without altering behavior.
