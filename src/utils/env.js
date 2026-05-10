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
};

// Default `/api` matches the Vite dev proxy (see vite.config.js) and the prior
// `(VITE_API_BASE_URL || '/api')` behavior. Override with VITE_API_BASE_URL at
// build time to target a direct backend URL (e.g. https://api.example.com/api).
export const getApiBaseUrl = () => {
  const configured = readEnv('VITE_API_BASE_URL');
  if (configured) return configured.replace(/\/$/, '');

  // In local dev, keep using Vite proxy.
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return '/api';
  }

  // In deployed builds, prefer known host-specific API URL, then same-origin /api.
  const mapped = hostFallbackApiBaseMap[host];
  if (mapped) return mapped.replace(/\/$/, '');
  return `${window.location.origin}/api`.replace(/\/$/, '');
};

// Only used on a button click (AuthPage -> StartVM). Returning '' when unset lets
// the app mount; the click handler will surface a clear fetch error instead of
// crashing the whole bundle.
export const getVmStartUrl = () => readEnv('VITE_VM_START_URL');
