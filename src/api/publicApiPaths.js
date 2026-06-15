/**
 * Backend routes that are intentionally public — no Bearer token and no 401 → /auth redirect.
 */
export function isPublicAnonymousApiPath(url) {
  const u = String(url || '');
  const isClientScreeningSubmit =
    u.includes('/client-screening') && !u.includes('/client-screening/mail-routing');
  return (
    // SCHEME_FORMS_DISABLED — re-enable when scheme forms return
    // u.includes('/pmegp-ai/chat') ||
    // u.includes('/pmegp-ai/chat/stream') ||
    u.includes('/support/pmegp') ||
    // u.includes('/ap-idp-ai/chat') ||
    // u.includes('/ap-idp-ai/chat/stream') ||
    u.includes('/support/ap-idp') ||
    // u.includes('/cmep-ai/chat') ||
    // u.includes('/cmep-ai/chat/stream') ||
    u.includes('/support/cmep') ||
    isClientScreeningSubmit ||
    u.includes('/form-submissions/emi-calculator/submit') ||
    u.includes('/msme-dpr-leads/submit')
    // u.includes('/scheme-forms/')
  );
}
