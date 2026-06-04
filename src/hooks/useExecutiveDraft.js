import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { draftAPI } from '../api/api';
import { getExecutiveDraftFormType } from '../utils/executiveDraftConfig';

/**
 * Load / save executive verification form drafts via shared FormDraft API.
 */
export function useExecutiveDraft(templateId, { onRestore } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftId, setDraftId] = useState(() => searchParams.get('draftId') || null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const restoredRef = useRef(false);

  const formType = getExecutiveDraftFormType(templateId);

  useEffect(() => {
    const id = searchParams.get('draftId');
    if (id && id !== draftId) setDraftId(id);
  }, [searchParams, draftId]);

  useEffect(() => {
    const id = searchParams.get('draftId');
    if (!id || restoredRef.current) return;

    let cancelled = false;
    (async () => {
      setLoadingDraft(true);
      try {
        const res = await draftAPI.getDraftById(id);
        const draft = res?.data ?? res;
        if (cancelled || !draft) return;

        const payload = draft.formData || draft.form_data || {};
        if (onRestore) {
          onRestore({
            form: payload.form || payload,
            photoCount: payload.photoCount ?? 0,
            templateId: payload.templateId || templateId
          });
        }
        setDraftId(draft._id || id);
        restoredRef.current = true;
        if ((payload.photoCount ?? 0) > 0) {
          toast('Draft loaded — please re-attach site photos if needed.', { icon: '📷' });
        } else {
          toast.success('Draft loaded');
        }
      } catch {
        if (!cancelled) toast.error('Could not load draft');
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, onRestore, templateId]);

  const saveDraft = useCallback(
    async (form, photoCount = 0) => {
      setSavingDraft(true);
      try {
        const formData = {
          form,
          templateId,
          photoCount
        };
        let saved;
        if (draftId) {
          const res = await draftAPI.updateDraft(draftId, { formType, formData });
          saved = res?.data ?? res;
        } else {
          const res = await draftAPI.createDraft({ formType, formData });
          saved = res?.data ?? res;
        }
        const newId = saved?._id || saved?.id;
        if (newId) {
          setDraftId(String(newId));
          setSearchParams({ draftId: String(newId) }, { replace: true });
        }
        toast.success('Draft saved');
        return newId;
      } catch (err) {
        toast.error(err?.message || err?.error || 'Failed to save draft');
        return null;
      } finally {
        setSavingDraft(false);
      }
    },
    [draftId, formType, setSearchParams]
  );

  return {
    draftId,
    savingDraft,
    loadingDraft,
    saveDraft
  };
}
