import apiClient from './apiClient';

/**
 * Save scheme form progress when user clicks Next (PMEGP / AP IDP / CMEP).
 * @param {'pmegp'|'ap-idp'|'cmep'} schemeKey
 * @param {object} formData
 */
export function saveSchemeFormProgress(schemeKey, formData) {
  return apiClient.post(`/scheme-forms/${schemeKey}/progress`, {
    ...formData,
    source: 'scheme-form-next'
  });
}

export default { saveSchemeFormProgress };
