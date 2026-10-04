import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { REPORT_HEAVY_TIMEOUT } from '../../../api/apiClient';
import { resolveSchemeFormData, saveSchemeFormSession, markSchemeJourneySubmitted } from '../../../utils/schemeFormSession';
import {
  optionNameForMail,
  topicsForStage,
  CMEP_AI_CHAT_PATH,
  CMEP_GENERATE_PATH,
} from './cmepSchemeMailConstants';
import EstablishmentSupportChecklist from '../EstablishmentSupportChecklist';

/**
 * Follow-up support checklist + submit for CMEP flow (`/generate/cmep/scheme-mail`).
 */
const CmepSchemeMailForm = ({
  fullName,
  hasCmepFormPayload,
  linkState,
  cmepFormPath = CMEP_GENERATE_PATH,
  cmepAiChatPath = CMEP_AI_CHAT_PATH,
  supportSource = 'ui:cmep-scheme-mail',
}) => {
  const [selected, setSelected] = useState(() => ({}));
  const [otherText, setOtherText] = useState('');
  const [establishmentStage, setEstablishmentStage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cmepForm, setCmepForm] = useState(() => resolveSchemeFormData('cmepForm', linkState));

  useEffect(() => {
    const resolved = resolveSchemeFormData('cmepForm', linkState);
    setCmepForm(resolved);
    if (resolved) {
      saveSchemeFormSession('cmepForm', resolved);
    }
  }, [linkState]);

  const resolvedLinkState = useMemo(
    () => (cmepForm ? { ...(linkState || {}), cmepForm } : linkState),
    [linkState, cmepForm],
  );

  const displayName =
    (fullName && fullName !== 'Applicant' ? fullName : '') ||
    (cmepForm?.fullName || '').trim() ||
    'Applicant';
  const hasFormPayload = hasCmepFormPayload || !!cmepForm;

  const selectedEntries = useMemo(() => {
    return topicsForStage(establishmentStage).filter((o) => selected[o.id]);
  }, [selected, establishmentStage]);

  const toggle = (id) => {
    setSelected((p) => {
      const next = { ...p, [id]: !p[id] };
      if (id === 'other' && !next.other) setOtherText('');
      return next;
    });
  };

  const handleStageChange = (stage) => {
    setEstablishmentStage(stage);
    setSelected({});
    setOtherText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otherOn = selected.other;
    if (!establishmentStage) {
      window.alert('Please select Pre-Establishment or Post-Establishment.');
      return;
    }
    if (!selectedEntries.length) {
      window.alert('Please select at least one option.');
      return;
    }
    if (otherOn && !otherText.trim()) {
      window.alert('Please specify your other requirement, or uncheck that option.');
      return;
    }
    const otherDetail = otherOn ? otherText : '';

    const optionNames = selectedEntries.map((o) => optionNameForMail(o, o.id === 'other' ? otherDetail : ''));
    const optionIds = selectedEntries.map((o) => o.id);
    const formData = resolveSchemeFormData('cmepForm', resolvedLinkState);

    setIsSending(true);
    try {
      // Unified scheme route: schemeKey now lives in the URL, action selects the operation.
      await api.post(
        '/schemes/cmep',
        {
          action: 'mail',
          fullName: displayName,
          establishmentStage,
          selectedOptions: optionNames,
          selectedOptionIds: optionIds,
          otherText: otherOn ? otherText : '',
          source: supportSource,
          formData: formData
            ? { ...formData, establishmentStage }
            : { establishmentStage },
        },
        { timeout: REPORT_HEAVY_TIMEOUT },
      );
      window.alert('Your message was sent successfully.');
      markSchemeJourneySubmitted('cmepForm');
      setSelected({});
      setOtherText('');
      setEstablishmentStage('');
    } catch (err) {
      window.alert(String(err || 'Failed to send message'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Follow-up support</h1>
        {!hasFormPayload && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No CMEP form data was passed. You can still send a message; default name is shown as &quot;Applicant&quot;.{' '}
            <Link to={cmepFormPath} className="font-semibold underline text-amber-900">
              Back to CMEP form
            </Link>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <EstablishmentSupportChecklist
          stage={establishmentStage}
          onStageChange={handleStageChange}
          selected={selected}
          onToggle={toggle}
          heading="What is your main challenge or doubt right now?"
        />

        {selected.other && (
          <div className="space-y-2">
            <label htmlFor="cmep-other-detail" className="block text-sm font-semibold text-gray-800">
              Please specify (other requirement)
            </label>
            <textarea
              id="cmep-other-detail"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="License requirements, hand-holding needs, etc."
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <Link
            to={cmepFormPath}
            state={resolvedLinkState}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
          >
            ← Back to form
          </Link>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Link
              to={cmepAiChatPath}
              state={resolvedLinkState}
              className="px-5 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-semibold"
            >
              Move to Next Page
            </Link>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-semibold"
            >
              {isSending ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CmepSchemeMailForm;
