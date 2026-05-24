import { useEffect, useMemo, useState } from 'react';
import { saveSchemeFormSession } from '../../../utils/schemeFormSession';
import { Link } from 'react-router-dom';
import api, { REPORT_HEAVY_TIMEOUT } from '../../../api/apiClient';
import {
  AP_IDP_AI_CHAT_PATH,
  AP_IDP_GENERATE_PATH,
  CHALLENGE_OPTIONS,
  optionNameForMail,
} from './apIdpSchemeMailConstants';

/**
 * Follow-up support checklist + submit for AP IDP flow (`/generate/ap-idp/scheme-mail`).
 */
const ApIdpSchemeMailForm = ({
  fullName,
  hasApIdpFormPayload,
  linkState,
  apIdpFormPath = AP_IDP_GENERATE_PATH,
  apIdpAiChatPath = AP_IDP_AI_CHAT_PATH,
  supportSource = 'ui:ap-idp-scheme-mail',
}) => {
  const [selected, setSelected] = useState(() => ({}));
  const [otherText, setOtherText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (linkState?.apIdpForm) {
      saveSchemeFormSession('apIdpForm', linkState.apIdpForm);
    }
  }, [linkState]);

  const selectedEntries = useMemo(() => {
    return CHALLENGE_OPTIONS.filter((o) => selected[o.id]);
  }, [selected]);

  const toggle = (id) => {
    setSelected((p) => {
      const next = { ...p, [id]: !p[id] };
      if (id === 'other' && !next.other) setOtherText('');
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otherOn = selected.other;
    if (!selectedEntries.length) {
      window.alert('Please select at least one option.');
      return;
    }
    if (otherOn && !otherText.trim()) {
      window.alert('Please specify your other requirement, or uncheck that option.');
      return;
    }
    const otherDetail = otherOn ? otherText : '';

    const optionNames = selectedEntries.map((o) =>
      optionNameForMail(o, o.id === 'other' ? otherDetail : ''),
    );
    const optionIds = selectedEntries.map((o) => o.id);

    setIsSending(true);
    try {
      await api.post(
        '/support/ap-idp',
        {
          fullName,
          selectedOptions: optionNames,
          selectedOptionIds: optionIds,
          otherText: otherOn ? otherText : '',
          source: supportSource,
          formData: linkState?.apIdpForm || null,
        },
        { timeout: REPORT_HEAVY_TIMEOUT },
      );
      window.alert('Your message was sent successfully.');
      setSelected({});
      setOtherText('');
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
        {!hasApIdpFormPayload && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No AP IDP form data was passed. You can still send a message; default name is shown as
            &quot;Applicant&quot;.{' '}
            <Link to={apIdpFormPath} className="font-semibold underline text-amber-900">
              Back to AP IDP form
            </Link>
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-6"
      >
        <div>
          <p className="text-base font-semibold text-gray-900 mb-4">
            What is your main challenge or doubt right now?
          </p>
          <div className="space-y-3">
            {CHALLENGE_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 cursor-pointer select-none rounded-lg border p-3 transition
                    ${selected[opt.id] ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  checked={!!selected[opt.id]}
                  onChange={() => toggle(opt.id)}
                />
                <span className="text-sm text-gray-800 leading-snug">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {selected.other && (
          <div className="space-y-2">
            <label htmlFor="ap-idp-other-detail" className="block text-sm font-semibold text-gray-800">
              Please specify (other requirement)
            </label>
            <textarea
              id="ap-idp-other-detail"
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
            to={apIdpFormPath}
            state={linkState}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
          >
            ← Back to form
          </Link>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Link
              to={apIdpAiChatPath}
              state={linkState}
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

export default ApIdpSchemeMailForm;
