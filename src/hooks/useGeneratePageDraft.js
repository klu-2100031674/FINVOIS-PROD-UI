import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { saveDraftV2 } from '../store/slices/draftSlice';
import {
  extractStage2FromDraft,
  mergeStage1AndStage2,
  mergeStage1Preserving,
  stripStage2FromDraft,
} from '../utils/draftPayload';

const EMPTY_STAGE2 = {
  selected_sections: {},
  prompts_data: {},
  related_documents_meta: [],
};

/**
 * Central draft orchestration for AI term loan generate flow.
 * One shared draftId; every save writes Stage 1 + Stage 2 together.
 */
export function useGeneratePageDraft({
  templateId,
  draftIdFromUrl,
  forceNewDraft,
  setTempFormData,
  dispatchSetFormData,
}) {
  const dispatch = useDispatch();
  const sessionDraftIdRef = useRef(forceNewDraft ? null : draftIdFromUrl);
  const [stage2Draft, setStage2Draft] = useState(EMPTY_STAGE2);
  const [savingDraft, setSavingDraft] = useState(false);

  const hydrateFromLoadedDraft = useCallback((data) => {
    setStage2Draft(extractStage2FromDraft(data));
  }, []);

  const syncStage2 = useCallback(
    (snapshot) => {
      const normalized = {
        selected_sections: snapshot?.selected_sections || {},
        prompts_data: snapshot?.prompts_data || {},
        related_documents_meta: snapshot?.related_documents_meta || [],
      };
      setStage2Draft(normalized);
      setTempFormData((prev) =>
        mergeStage1AndStage2(stripStage2FromDraft(prev || {}), normalized)
      );
    },
    [setTempFormData]
  );

  const mergeStage1IntoTemp = useCallback(
    (stage1Payload) => {
      setTempFormData((prev) =>
        mergeStage1AndStage2(
          mergeStage1Preserving(stripStage2FromDraft(prev || {}), stage1Payload),
          stage2Draft
        )
      );
    },
    [setTempFormData, stage2Draft]
  );

  const saveDraft = useCallback(
    async ({ stage1Payload, stage2Override, activeStep }) => {
      if (!templateId) {
        toast.error('Missing templateId');
        return;
      }

      const stage2 = stage2Override ?? stage2Draft;
      let mergedStage1 = stage1Payload;
      setTempFormData((prev) => {
        mergedStage1 = mergeStage1Preserving(stripStage2FromDraft(prev || {}), stage1Payload);
        const merged = mergeStage1AndStage2(mergedStage1, stage2);
        return merged;
      });

      const merged = mergeStage1AndStage2(mergedStage1, stage2);
      const targetDraftId = sessionDraftIdRef.current || undefined;

      setSavingDraft(true);
      try {
        const result = await dispatch(
          saveDraftV2({
            formType: templateId,
            formData: merged,
            draftId: targetDraftId,
            currentStep: activeStep,
          })
        ).unwrap();

        const saved = result?.data ?? result;
        if (saved?._id) {
          sessionDraftIdRef.current = saved._id;
        }

        setStage2Draft(extractStage2FromDraft(merged));
        setTempFormData(merged);
        if (dispatchSetFormData) {
          dispatchSetFormData(merged);
        }

        toast.success('Draft saved');
      } catch (err) {
        const msg =
          typeof err === 'string'
            ? err
            : err?.message || err?.error || 'Failed to save draft. Please try again.';
        toast.error(msg);
      } finally {
        setSavingDraft(false);
      }
    },
    [templateId, stage2Draft, dispatch, setTempFormData, dispatchSetFormData]
  );

  return {
    sessionDraftIdRef,
    stage2Draft,
    savingDraft,
    hydrateFromLoadedDraft,
    syncStage2,
    mergeStage1IntoTemp,
    saveDraft,
  };
}
