/**
 * Persist PMEGP / AP IDP / CMEP form payloads across refresh and deep links (production).
 * Each browser journey gets a stable `sessionId` so form → mail → chat update one
 * submission; a later visit (new form entry after submit) starts a new session.
 */

const STORAGE_KEYS = {
  pmegpForm: 'finvois_pmegp_form_v1',
  apIdpForm: 'finvois_ap_idp_form_v1',
  cmepForm: 'finvois_cmep_form_v1',
};

const SESSION_ID_KEYS = {
  pmegpForm: 'finvois_pmegp_session_v1',
  apIdpForm: 'finvois_ap_idp_session_v1',
  cmepForm: 'finvois_cmep_session_v1',
};

const SUBMITTED_KEYS = {
  pmegpForm: 'finvois_pmegp_journey_submitted_v1',
  apIdpForm: 'finvois_ap_idp_journey_submitted_v1',
  cmepForm: 'finvois_cmep_journey_submitted_v1',
};

const SUPPORTED_KEYS = new Set(Object.keys(STORAGE_KEYS));

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sch_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function isSchemeFormSessionKey(formStateKey) {
  return SUPPORTED_KEYS.has(formStateKey);
}

export function getOrCreateSchemeSessionId(formStateKey) {
  if (!SUPPORTED_KEYS.has(formStateKey)) return '';
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEYS[formStateKey]);
    if (!id) {
      id = createSessionId();
      sessionStorage.setItem(SESSION_ID_KEYS[formStateKey], id);
    }
    return id;
  } catch {
    return createSessionId();
  }
}

/** Force a brand-new journey id (used when starting the form again after a prior submit). */
export function beginNewSchemeSession(formStateKey) {
  if (!SUPPORTED_KEYS.has(formStateKey)) return '';
  const id = createSessionId();
  try {
    sessionStorage.setItem(SESSION_ID_KEYS[formStateKey], id);
  } catch {
    /* ignore */
  }
  return id;
}

export function markSchemeJourneySubmitted(formStateKey) {
  if (!SUPPORTED_KEYS.has(formStateKey)) return;
  try {
    sessionStorage.setItem(SUBMITTED_KEYS[formStateKey], '1');
  } catch {
    /* ignore */
  }
}

export function isSchemeJourneySubmitted(formStateKey) {
  if (!SUPPORTED_KEYS.has(formStateKey)) return false;
  try {
    return sessionStorage.getItem(SUBMITTED_KEYS[formStateKey]) === '1';
  } catch {
    return false;
  }
}

/**
 * Call on scheme form page mount. If the previous journey already mailed/submitted,
 * start a new session and clear old form data so the same phone is a new submission.
 */
export function ensureFreshSchemeSessionOnFormEntry(formStateKey) {
  if (!SUPPORTED_KEYS.has(formStateKey)) return getOrCreateSchemeSessionId(formStateKey);
  if (isSchemeJourneySubmitted(formStateKey)) {
    try {
      sessionStorage.removeItem(SUBMITTED_KEYS[formStateKey]);
    } catch {
      /* ignore */
    }
    clearSchemeFormSession(formStateKey);
    return beginNewSchemeSession(formStateKey);
  }
  return getOrCreateSchemeSessionId(formStateKey);
}

/** Attach `_schemeSessionId` so API can upsert by session instead of phone. */
export function withSchemeSessionId(formStateKey, payload) {
  const data = payload && typeof payload === 'object' ? { ...payload } : {};
  data._schemeSessionId = getOrCreateSchemeSessionId(formStateKey);
  return data;
}

export function saveSchemeFormSession(formStateKey, payload) {
  if (!SUPPORTED_KEYS.has(formStateKey) || !payload || typeof payload !== 'object') return;
  try {
    const withId = withSchemeSessionId(formStateKey, payload);
    sessionStorage.setItem(STORAGE_KEYS[formStateKey], JSON.stringify(withId));
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
    if (!parsed || typeof parsed !== 'object') return null;
    // Keep session id in sync with dedicated key
    if (parsed._schemeSessionId) {
      try {
        sessionStorage.setItem(SESSION_ID_KEYS[formStateKey], parsed._schemeSessionId);
      } catch {
        /* ignore */
      }
    }
    return parsed;
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
  if (fromSession) return withSchemeSessionId(formSessionKey, fromSession);
  const fromRouter = routerState?.[formSessionKey];
  if (fromRouter && typeof fromRouter === 'object') {
    const withId = withSchemeSessionId(formSessionKey, fromRouter);
    saveSchemeFormSession(formSessionKey, withId);
    return withId;
  }
  return null;
}
