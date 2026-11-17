/** Draft resume helpers. Lead prefill does not use these. */

const ASSET_META_KEYS = [
  'Fixed Assets Schedule',
  'Asset Loan Percentages',
  'Asset Loan Amounts',
  '_wizardStep',
];

function hasSubstance(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * Prefer the editable copy stored on a draft (`rawFormData`) over Excel-transformed
 * dates and cell dumps. Outer asset meta is kept when the raw copy does not have it.
 */
export function editableDraftForm(initialData) {
  if (!initialData || typeof initialData !== 'object' || Array.isArray(initialData)) {
    return initialData ?? null;
  }
  const raw = initialData.rawFormData;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return initialData;
  }
  const merged = { ...initialData, ...raw };
  ASSET_META_KEYS.forEach((key) => {
    if (hasSubstance(initialData[key]) && !hasSubstance(raw[key])) {
      merged[key] = initialData[key];
    }
  });
  delete merged.rawFormData;
  delete merged.excelData;
  delete merged['Loan Percentage Cells'];
  return merged;
}

/** Snapshot written by Save draft. Excel transforms stay out of the saved form. */
export function buildEditableDraftSnapshot(formData, extras = {}) {
  const source = formData?.rawFormData && typeof formData.rawFormData === 'object'
    ? editableDraftForm(formData)
    : { ...(formData && typeof formData === 'object' ? formData : {}) };
  const snapshot = { ...source, ...extras };
  delete snapshot.excelData;
  delete snapshot.rawFormData;
  delete snapshot['Loan Percentage Cells'];
  return snapshot;
}

export function readWizardStep(source, sectionCount) {
  const raw = source?._wizardStep ?? source?.wizardStep;
  const step = typeof raw === 'number' ? raw : parseInt(raw, 10);
  if (!Number.isInteger(step) || step < 0) return 0;
  if (Number.isInteger(sectionCount) && sectionCount > 0 && step >= sectionCount) {
    return sectionCount - 1;
  }
  return step;
}

/** Add draftId to the current query without dropping lead ids or the report session. */
export function searchWithDraftId(search, draftId) {
  const raw = String(search || '').replace(/^\?/, '');
  const params = new URLSearchParams(raw);
  params.set('draftId', String(draftId));
  params.delete('newDraft');
  return params.toString();
}
