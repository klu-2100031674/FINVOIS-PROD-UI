/**
 * Frontend routes that must stay accessible without login (production SPA + API 401 handling).
 * Use path prefixes only — never hardcode hosts (works on localhost:5173 and finvois.com).
 */

/** Admin-only; must not be treated as anonymous public app routes. */
const PROTECTED_SCHEME_PATHS = ['/schemes/mail'];

/** Public scheme / screening flows (forms, support mail, AI chat). */
const PUBLIC_SCHEME_PREFIXES = ['/schemes/pmegp', '/schemes/ap-idp', '/schemes/cmep', '/client-screening'];

/** Public calculator tools (no login). */
const PUBLIC_CALCULATOR_PREFIXES = ['/calculators'];

/**
 * @param {string} [pathname] — defaults to current location
 */
export function isPublicAppPath(pathname) {
  const p =
    typeof pathname === 'string'
      ? pathname
      : typeof window !== 'undefined'
        ? window.location.pathname
        : '';
  if (!p) return false;
  if (PROTECTED_SCHEME_PATHS.some((blocked) => p === blocked || p.startsWith(`${blocked}/`))) {
    return false;
  }
  if (p === '/schemes') return true;
  if (PUBLIC_CALCULATOR_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
    return true;
  }
  return PUBLIC_SCHEME_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}
