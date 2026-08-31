import apiClient from './apiClient';

/**
 * Save scheme form progress when user clicks Next (PMEGP / AP IDP / CMEP).
 * Uses the unified per-scheme route (one route handles form/mail/chat via
 * `action`) instead of the older dedicated `/scheme-forms/:schemeKey/progress` path.
 * @param {'pmegp'|'ap-idp'|'cmep'} schemeKey
 * @param {object} formData
 */
export function saveSchemeFormProgress(schemeKey, formData) {
  return apiClient.post(`/schemes/${schemeKey}`, {
    action: 'form',
    ...formData,
    source: 'scheme-form-next'
  });
}

export default { saveSchemeFormProgress };
