import { mergeStage1Preserving, stripStage2FromDraft } from './draftPayload';
import { normalizeMonthFieldsInFormData } from './monthFieldFormat';

/**
 * Resolve the best Stage-1 snapshot when hydrating a form from a saved draft.
 * Top-level section data wins over nested rawFormData (rawFormData can be stale
 * after live edits synced via onFormDataChange).
 */
export function resolveDraftSourceData(initialData) {
  if (!initialData || typeof initialData !== 'object') {
    return {};
  }

  const top = stripStage2FromDraft(initialData);
  const raw = top.rawFormData;

  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    return normalizeMonthFieldsInFormData(top);
  }

  return normalizeMonthFieldsInFormData(mergeStage1Preserving(raw, top));
}

/** Keep rawFormData in sync with the latest flat form snapshot for draft saves. */
export function withSyncedRawFormData(stage1Payload) {
  if (!stage1Payload || typeof stage1Payload !== 'object') {
    return stage1Payload ?? {};
  }
  const flat = stripStage2FromDraft(stage1Payload);
  return {
    ...flat,
    rawFormData: JSON.parse(JSON.stringify(flat)),
  };
}
