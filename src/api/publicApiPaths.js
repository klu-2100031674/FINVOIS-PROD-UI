/**
 * Backend routes that are intentionally public — no Bearer token and no 401 → /auth redirect.
 */
export function isPublicAnonymousApiPath(url) {
  const u = String(url || '');
  const isClientScreeningSubmit =
    u.includes('/client-screening') && !u.includes('/client-screening/mail-routing');
  // Unified scheme route (form/mail/chat via action field) — public for the
  // active schemes, same as the legacy per-action paths below.
  const isUnifiedSchemeRoute =
    u.includes('/schemes/cmep') || u.includes('/schemes/pmegp') || u.includes('/schemes/ap-idp');

  return (
    isUnifiedSchemeRoute ||
    u.includes('/schemes/mail') ||
    u.includes('/cmep-ai/chat') ||
    u.includes('/cmep-ai/chat/stream') ||
    u.includes('/users/google-auth') ||
    u.includes('/customer/google-auth') ||
    u.includes('/customer/send-otp') ||
    u.includes('/customer/verify-otp-register') ||
    u.includes('/customer/check-exists') ||
    u.includes('/customer/login-send-otp') ||
    u.includes('/customer/login-verify-otp') ||
    u.includes('/govt-forms/public/') ||
    u.includes('/pmegp-ai/chat') ||
    u.includes('/pmegp-ai/chat/stream') ||
    u.includes('/support/pmegp') ||
    u.includes('/ap-idp-ai/chat') ||
    u.includes('/ap-idp-ai/chat/stream') ||
    u.includes('/support/ap-idp') ||
    u.includes('/support/cmep') ||
    isClientScreeningSubmit ||
    u.includes('/form-submissions/emi-calculator/submit') ||
    u.includes('/msme-dpr-leads/submit') ||
    u.includes('/scheme-forms/')
  );
}
