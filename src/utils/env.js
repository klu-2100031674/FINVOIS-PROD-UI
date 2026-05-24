import { isTunnelHostname } from './tunnel';

// Read a Vite env variable safely. Returns a trimmed string or '' when missing.
// IMPORTANT: do NOT throw at module-load time — these helpers are imported from
// api.js and apiClient.js, so a throw here prevents React from ever mounting
// (blank white page in production). Missing values are handled via fallbacks below.
const readEnv = (key) => {
  const value = import.meta.env[key];
  if (typeof value !== 'string') return '';
  return value.trim();
};

function isLocalApiHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

const hostFallbackApiBaseMap = {
  'finvois.com': 'https://api.finvois.com/api',
  'www.finvois.com': 'https://api.finvois.com/api',
  'ca-front-end-dev.onrender.com':
    'https://finvois.centralindia.cloudapp.azure.com/dev/api',
};

// Default `/api` matches the Vite dev proxy (see vite.config.js) and the prior
// `(VITE_API_BASE_URL || '/api')` behavior. Override with VITE_API_BASE_URL at
// build time to target a direct backend URL (e.g. https://api.example.com/api).
export const getApiBaseUrl = () => {
  const configured = readEnv('VITE_API_BASE_URL');

  // In local dev, use the Vite `/api` proxy (LAN, ngrok UI tunnel, etc.).
  if (import.meta.env.DEV) {
    if (configured) {
      try {
        const { hostname } = new URL(configured);
        const onTunnel =
          typeof window !== 'undefined' && isTunnelHostname(window.location.hostname);
        if (onTunnel && isLocalApiHost(hostname)) {
          console.warn(
            '[Finvois] VITE_API_BASE_URL points at localhost but the app is opened via a tunnel. ' +
              'Using /api proxy instead.',
          );
          return '/api';
        }
      } catch {
        /* use configured below */
      }
      if (!configured.startsWith('/')) {
        return configured.replace(/\/$/, '');
      }
    }
    return '/api';
  }

  if (configured) return configured.replace(/\/$/, '');

  const host = window.location.hostname;

  // In deployed builds, prefer known host-specific API URL, then same-origin /api.
  const mapped = hostFallbackApiBaseMap[host];
  if (mapped) return mapped.replace(/\/$/, '');

  const fallback = `${window.location.origin}/api`.replace(/\/$/, '');
  if (typeof console !== 'undefined') {
    console.warn(
      `[Finvois] No VITE_API_BASE_URL or host map for "${host}". Using ${fallback}. ` +
        'Set VITE_API_BASE_URL at build time if /api is not proxied to your API.',
    );
  }
  return fallback;
};

// Only used on a button click (AuthPage -> StartVM). Returning '' when unset lets
// the app mount; the click handler will surface a clear fetch error instead of
// crashing the whole bundle.
export const getVmStartUrl = () => readEnv('VITE_VM_START_URL');
