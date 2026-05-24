/**
 * Dev tunnel detection (ngrok, Cloudflare Tunnel, localtunnel).
 * Used for API headers, login VM skip, and env fallbacks.
 */

export const TUNNEL_HOST_SUFFIXES = [
  '.ngrok-free.dev',
  '.ngrok-free.app',
  '.ngrok-free.pizza',
  '.ngrok.io',
  '.ngrok.app',
  '.ngrok.dev',
  '.ngrok.pizza',
  '.loca.lt',
  '.trycloudflare.com',
];

export function isTunnelHostname(hostname) {
  if (!hostname) return false;
  const host = String(hostname).toLowerCase();
  return TUNNEL_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  );
}

export function isTunnelDevContext() {
  if (typeof window === 'undefined') return false;
  return isTunnelHostname(window.location.hostname);
}

/** ngrok free tier returns an HTML interstitial unless this header is sent. */
export const NGROK_SKIP_BROWSER_WARNING = 'ngrok-skip-browser-warning';

export function getTunnelRequestHeaders(url) {
  const headers = {};
  let needsSkip = false;

  if (typeof window !== 'undefined' && isTunnelDevContext()) {
    needsSkip = true;
  }

  if (url) {
    try {
      const { hostname } = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
      if (isTunnelHostname(hostname)) needsSkip = true;
    } catch {
      /* ignore invalid URL */
    }
  }

  if (needsSkip) {
    headers[NGROK_SKIP_BROWSER_WARNING] = 'true';
  }

  return headers;
}

export function shouldSkipVmOnLogin() {
  if (import.meta.env.VITE_SKIP_VM_ON_LOGIN === 'true') return true;
  return import.meta.env.DEV && isTunnelDevContext();
}
