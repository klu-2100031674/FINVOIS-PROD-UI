/**
 * Persist PMEGP / AP IDP / CMEP form payloads across refresh and deep links (production).
 */

const STORAGE_KEYS = {
  pmegpForm: 'finvois_pmegp_form_v1',
  apIdpForm: 'finvois_ap_idp_form_v1',
  cmepForm: 'finvois_cmep_form_v1',
};

const SUPPORTED_KEYS = new Set(Object.keys(STORAGE_KEYS));

export function isSchemeFormSessionKey(formStateKey) {
  return SUPPORTED_KEYS.has(formStateKey);
}

export function saveSchemeFormSession(formStateKey, payload) {
  if (!SUPPORTED_KEYS.has(formStateKey) || !payload || typeof payload !== 'object') return;
  try {
    sessionStorage.setItem(STORAGE_KEYS[formStateKey], JSON.stringify(payload));
  } catch (e) {
    console.warn('[Finvois] Could not save scheme form to sessionStorage', e);
  }
}

export function loadSchemeFormSession(formStateKey) {
  if (!SUPPORTED_KEYS.has(formStateKey)) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS[formStateKey]);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSchemeFormSession(formStateKey) {
  if (!SUPPORTED_KEYS.has(formStateKey)) return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS[formStateKey]);
  } catch {
    /* ignore */
  }
}

/** Prefer sessionStorage; fall back to router state and persist when found. */
export function resolveSchemeFormData(formSessionKey, routerState = null) {
  if (!formSessionKey) return null;
  const fromSession = loadSchemeFormSession(formSessionKey);
  if (fromSession) return fromSession;
  const fromRouter = routerState?.[formSessionKey];
  if (fromRouter && typeof fromRouter === 'object') {
    saveSchemeFormSession(formSessionKey, fromRouter);
    return fromRouter;
  }
  return null;
}
