import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { saveDraftV2 } from '../../store/slices/draftSlice';
import toast from 'react-hot-toast';

/**
 * Save Draft button.
 *
 * Design notes (important — previously this caused report-generation races):
 *   - Saving is EXPLICIT only. No auto-save, no debounced writes.
 *   - We never rewrite the URL on save. Instead the returned draft _id is held
 *     in a component-local ref so subsequent clicks in the same session
 *     UPDATE the same server row (idempotent) instead of inserting duplicates.
 *   - If the user arrived via the Drafts page the URL already carries a
 *     `?draftId=`; we use that as the initial update target.
 *   - `?newDraft=1` forces a brand-new row (user clicked "start this template"
 *     from the dashboard and must not overwrite a stale draft of the same type).
 */
const SaveDraftButton = ({ templateId, currentStep, currentFormData }) => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const draftIdFromUrl = searchParams.get('draftId') || null;
  const forceNewDraft =
    searchParams.get('newDraft') === '1' || searchParams.get('newDraft') === 'true';

  // Tracks the draft row we're actively editing in THIS session.
  // Seeded from the URL; overwritten with the server-returned _id after the
  // first save so later clicks become updates rather than inserts.
  const sessionDraftIdRef = useRef(forceNewDraft ? null : draftIdFromUrl);

  const handleSaveDraft = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);

      if (!templateId) {
        throw new Error('Missing templateId');
      }

      const targetDraftId = sessionDraftIdRef.current || undefined;

      const payload = {
        formType: templateId,
        formData: currentFormData || {},
        draftId: targetDraftId,
      };
      if (currentStep) payload.currentStep = currentStep;

      const result = await dispatch(saveDraftV2(payload)).unwrap();
      const saved = result?.data ?? result;

      if (saved?._id) {
        // Remember this id so the NEXT click in this session updates in place.
        // NOTE: we deliberately do NOT push this into the URL. Writing to the
        // URL mid-session was the root cause of the previous bug where
        // auto-save would race with the Generate button.
        sessionDraftIdRef.current = saved._id;
      }

      toast.success('Draft saved');
    } catch (err) {
      const msg =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Failed to save draft. Please try again.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSaveDraft}
      disabled={isSaving}
      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-3 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      type="button"
    >
      {isSaving ? 'Saving…' : 'Save & draft'}
    </button>
  );
};

export default SaveDraftButton;
