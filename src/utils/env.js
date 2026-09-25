// Read a Vite env variable safely. Returns a trimmed string or '' when missing.
// IMPORTANT: do NOT throw at module-load time — these helpers are imported from
// api.js and apiClient.js, so a throw here prevents React from ever mounting
// (blank white page in production). Missing values are handled via fallbacks below.
const readEnv = (key) => {
  const value = import.meta.env[key];
  if (typeof value !== 'string') return '';
  return value.trim();
};

const hostFallbackApiBaseMap = {
  'finvois.com': 'https://api.finvois.com/api',
  'www.finvois.com': 'https://api.finvois.com/api',
  'ca-front-end-dev.onrender.com':
    'https://finvois.centralindia.cloudapp.azure.com/dev/api',
  // Azure Static Web Apps default hostname (Production SWA) — api_location is empty,
  // so same-origin /api would 404 without this map or VITE_API_BASE_URL.
  'mango-sand-02cae6800.azurestaticapps.net': 'https://api.finvois.com/api',
};

function resolveHostFallbackApiBase(hostname) {
  const mapped = hostFallbackApiBaseMap[hostname];
  if (mapped) return mapped;
  // Preview / named SWA environments: <app>-<pr|name>.azurestaticapps.net
  if (
    typeof hostname === 'string' &&
    hostname.endsWith('.azurestaticapps.net')
  ) {
    return 'https://api.finvois.com/api';
  }
  return null;
}

// Default `/api` matches the Vite dev proxy (see vite.config.js) and the prior
// `(VITE_API_BASE_URL || '/api')` behavior. Override with VITE_API_BASE_URL at
// build time to target a direct backend URL (e.g. https://api.example.com/api).
export const getApiBaseUrl = () => {
  const configured = readEnv('VITE_API_BASE_URL');

  // In local `npm run dev`, always use the Vite `/api` proxy so the machine
  // running this UI talks to the local backend — not a remote VM that may be
  // missing newer routes such as bulk-delete.
  if (import.meta.env.DEV) {
    return '/api';
  }

  if (configured) return configured.replace(/\/$/, '');

  const host = window.location.hostname;

  // In deployed builds, prefer known host-specific API URL, then same-origin /api.
  const mapped = resolveHostFallbackApiBase(host);
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
