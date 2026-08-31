import apiClient from './apiClient';

/** @typedef {'pmegp'|'ap-idp'|'cmep'} SchemeKey */

const LEGACY_SUPPORT_PATH = {
  pmegp: '/support/pmegp',
  'ap-idp': '/support/ap-idp',
  cmep: '/support/cmep',
};

function isNotFoundError(err) {
  return err?.response?.status === 404;
}

function isNotFoundResponse(response) {
  return response?.status === 404;
}

/**
 * POST scheme support mail — unified route on API v3.13+, legacy /support/:scheme on v3.12.
 * @param {SchemeKey} schemeKey
 * @param {object} payload
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postSchemeMail(schemeKey, payload, config) {
  try {
    return await apiClient.post(
      `/schemes/${schemeKey}`,
      { action: 'mail', ...payload },
      config,
    );
  } catch (err) {
    if (!isNotFoundError(err)) throw err;
    const legacyPath = LEGACY_SUPPORT_PATH[schemeKey];
    if (!legacyPath) throw err;
    return apiClient.post(legacyPath, payload, config);
  }
}

/**
 * Save scheme form progress on Next — unified route on v3.13+, legacy /scheme-forms on v3.12.
 * @param {SchemeKey} schemeKey
 * @param {object} formData
 */
export async function saveSchemeFormProgress(schemeKey, formData) {
  const payload = { ...formData, source: formData?.source || 'scheme-form-next' };
  try {
    return await apiClient.post(`/schemes/${schemeKey}`, {
      action: 'form',
      ...payload,
    });
  } catch (err) {
    if (!isNotFoundError(err)) throw err;
    return apiClient.post(`/scheme-forms/${schemeKey}/progress`, payload);
  }
}

/**
 * POST scheme AI chat (fetch) — unified route on v3.13+, legacy /:scheme-ai/chat on v3.12.
 * @param {string} apiBase
 * @param {SchemeKey} schemeKey
 * @param {object} body
 * @param {RequestInit} [init]
 */
export async function postSchemeChatFetch(apiBase, schemeKey, body, init = {}) {
  const unifiedUrl = `${apiBase}/schemes/${schemeKey}`;
  const legacyUrl = `${apiBase}/${schemeKey}-ai/chat`;
  const fetchInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    credentials: init.credentials ?? 'omit',
    ...init,
  };

  let response = await fetch(unifiedUrl, {
    ...fetchInit,
    body: JSON.stringify({ action: 'chat', ...body }),
  });

  if (isNotFoundResponse(response)) {
    response = await fetch(legacyUrl, {
      ...fetchInit,
      body: JSON.stringify(body),
    });
  }

  return response;
}

export default {
  postSchemeMail,
  saveSchemeFormProgress,
  postSchemeChatFetch,
};
