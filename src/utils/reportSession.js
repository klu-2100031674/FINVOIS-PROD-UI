/** Identifies one new-report visit. Draft resume uses draftId and does not need this. */
export function createReportSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Mark a generate URL as a brand-new report, independent of template id. */
export function assignNewReportSession(params) {
  params.set('newDraft', '1');
  params.set('reportSession', createReportSessionId());
  return params;
}
