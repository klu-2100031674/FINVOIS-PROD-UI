/**
 * Backend routes that are intentionally public — no Bearer token and no 401 → /auth redirect.
 */
export function isPublicAnonymousApiPath(url) {
  const u = String(url || '');
  return (
    u.includes('/pmegp-ai/chat') ||
    u.includes('/pmegp-ai/chat/stream') ||
    u.includes('/support/pmegp') ||
    u.includes('/ap-idp-ai/chat') ||
    u.includes('/ap-idp-ai/chat/stream') ||
    u.includes('/support/ap-idp') ||
    u.includes('/cmep-ai/chat') ||
    u.includes('/cmep-ai/chat/stream') ||
    u.includes('/support/cmep') ||
    u.includes('/support/client-screening')
  );
}
