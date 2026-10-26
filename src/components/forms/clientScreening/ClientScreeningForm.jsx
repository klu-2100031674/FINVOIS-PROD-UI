import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/apiClient';
import EstablishmentStagePicker from '../EstablishmentStagePicker';
import {
  optionNameForMail,
  topicsForStage,
} from './clientScreeningConstants';

const NAME_MIN_LETTERS = 5;

function countAlphabeticLetters(name) {
  return (String(name || '').match(/[A-Za-z]/g) || []).length;
}

/**
 * Stand-alone client screening intake page with Pre/Post stage selection,
 * dynamic questions, individual detail text inputs per question, and email routing.
 */
const ClientScreeningForm = ({ supportSource = 'ui:client-screening-public' }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [natureOfBusiness, setNatureOfBusiness] = useState('');
  const [establishmentStage, setEstablishmentStage] = useState('');
  const [selected, setSelected] = useState(() => ({}));
  const [questionDetails, setQuestionDetails] = useState({});
  const [isSending, setIsSending] = useState(false);

  // Dynamic shared questions loaded from API
  const [sharedConfig, setSharedConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await api.get('/client-screening/config');
        if (isMounted) {
          const cfg =
            res?.data?.config ||
            (res?.data?.configs ? res.data.configs.shared || res.data.configs['ap-idp'] : null);
          if (cfg) {
            setSharedConfig(cfg);
          }
        }
      } catch (err) {
        // Fallback to static constants
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const topicOptions = useMemo(() => {
    if (sharedConfig) {
      if (establishmentStage === 'pre-establishment' && sharedConfig.preQuestions?.length) {
        return sharedConfig.preQuestions;
      }
      if (establishmentStage === 'post-establishment' && sharedConfig.postQuestions?.length) {
        return sharedConfig.postQuestions;
      }
    }
    return topicsForStage(establishmentStage);
  }, [sharedConfig, establishmentStage]);

  const selectedEntries = useMemo(() => {
    return topicOptions.filter((o) => selected[o.id]);
  }, [selected, topicOptions]);

  const nameTrimmedLive = String(fullName || '').trim();
  const nameLetterCount = countAlphabeticLetters(nameTrimmedLive);
  const showNameHint = fullName.length > 0 && nameLetterCount < NAME_MIN_LETTERS;
  const showPhoneHint = phone.length > 0 && !/^\d{10}$/.test(phone);

  const toggle = (id) => {
    setSelected((p) => {
      const next = { ...p, [id]: !p[id] };
      return next;
    });
  };

  const handleStageChange = (stage) => {
    setEstablishmentStage(stage);
    setSelected({});
    setQuestionDetails({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameTrimmed = String(fullName || '').trim();
    if (!nameTrimmed) {
      window.alert('Please enter your name.');
      return;
    }
    if (countAlphabeticLetters(nameTrimmed) < NAME_MIN_LETTERS) {
      window.alert(`Name must include at least ${NAME_MIN_LETTERS} letters (A–Z).`);
      return;
    }
    const phoneDigits = String(phone || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) {
      window.alert('Phone number must be exactly 10 digits (numbers only).');
      return;
    }
    const natureTrimmed = String(natureOfBusiness || '').trim();
    if (!natureTrimmed) {
      window.alert('Please enter nature of business.');
      return;
    }
    if (!establishmentStage) {
      window.alert('Please select Pre-Establishment or Post-Establishment.');
      return;
    }
    if (!selectedEntries.length) {
      window.alert('Please select at least one requirement or question.');
      return;
    }

    // Validate that any selected question requiring details has text filled in
    for (const entry of selectedEntries) {
      if (entry.hasTextInput || entry.id === 'other') {
        const text = String(questionDetails[entry.id] || '').trim();
        if (!text) {
          window.alert(`Please provide specific details for "${entry.label}".`);
          return;
        }
      }
    }

    const optionNames = selectedEntries.map((o) => {
      const detail = String(questionDetails[o.id] || '').trim();
      return optionNameForMail(o, (o.hasTextInput || o.id === 'other') ? detail : '');
    });
    const optionIds = selectedEntries.map((o) => o.id);

    const detailsList = selectedEntries
      .filter((o) => (o.hasTextInput || o.id === 'other') && questionDetails[o.id]?.trim())
      .map((o) => `${o.label}: ${questionDetails[o.id].trim()}`);
    const combinedDetails = detailsList.join('\n');

    setIsSending(true);
    try {
      await api.post('/client-screening', {
        fullName: nameTrimmed,
        phone: phoneDigits,
        natureOfBusiness: natureTrimmed,
        establishmentStage,
        selectedOptions: optionNames,
        selectedOptionIds: optionIds,
        questionDetails,
        otherText: combinedDetails,
        source: supportSource,
      });
      window.alert('Your screening enquiry has been submitted. Our team will contact you soon.');
      setSelected({});
      setQuestionDetails({});
      setNatureOfBusiness('');
      setEstablishmentStage('');
      setFullName('');
      setPhone('');
    } catch (err) {
      window.alert(String(err?.response?.data?.message || err?.message || 'Failed to send message'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-3 pb-2 sm:px-0">
      <div className="space-y-5 sm:space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-purple-100/90 bg-gradient-to-br from-purple-50/90 via-white to-white p-6 shadow-xs sm:p-8">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-purple-200/20 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-3xl border-l-[3px] border-purple-500 pl-4 sm:pl-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-700">
              Client Screening
            </p>
            <h1 className="mt-2 text-balance text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-[1.75rem]">
              What is the main challenge or requirement your MSME is facing right now?
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs ring-1 ring-gray-100/80"
        >
          <div className="space-y-8 p-6 sm:p-8">
            {/* Contact Details */}
            <section aria-labelledby="cs-section-contact">
              <div className="mb-4 flex items-end gap-3">
                <h2
                  id="cs-section-contact"
                  className="text-sm font-bold uppercase tracking-wide text-gray-900"
                >
                  Your details
                </h2>
                <span className="mb-0.5 h-px min-w-[2rem] flex-1 bg-gradient-to-r from-purple-200 to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="cs-full-name" className="block text-sm font-semibold text-gray-800">
                    Full name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="cs-full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full rounded-xl border bg-gray-50/40 px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 ${
                      showNameHint
                        ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-200/80'
                        : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200/80'
                    }`}
                    placeholder="As per your ID / bank records"
                  />
                  <div className="min-h-[1.35rem]">
                    {showNameHint ? (
                      <p
                        className="inline-flex rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-xs font-medium text-amber-900"
                        role="status"
                        aria-live="polite"
                      >
                        Name needs at least {NAME_MIN_LETTERS} letters (A–Z).
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cs-phone" className="block text-sm font-semibold text-gray-800">
                    Phone number <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="cs-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full rounded-xl border bg-gray-50/40 px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 ${
                      showPhoneHint
                        ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-200/80'
                        : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200/80'
                    }`}
                    placeholder="10-digit mobile number"
                  />
                  <div className="min-h-[1.35rem]">
                    {showPhoneHint ? (
                      <p
                        className="inline-flex rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-xs font-medium text-amber-900"
                        role="status"
                        aria-live="polite"
                      >
                        Phone must be exactly 10 digits ({phone.length}/10).
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="cs-nature" className="block text-sm font-semibold text-gray-800">
                    Nature of business <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="cs-nature"
                    type="text"
                    value={natureOfBusiness}
                    onChange={(e) => setNatureOfBusiness(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/40 px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200/80"
                    placeholder="e.g. Food processing, retail trading, manufacturing…"
                  />
                </div>
                <div className="sm:col-span-2">
                  <EstablishmentStagePicker value={establishmentStage} onChange={handleStageChange} />
                </div>
              </div>
            </section>

            {/* Questions Checklist */}
            {establishmentStage ? (
              <section aria-labelledby="cs-section-topics">
                <div className="mb-4 flex items-end gap-3">
                  <h2
                    id="cs-section-topics"
                    className="text-sm font-bold uppercase tracking-wide text-gray-900"
                  >
                    What do you need help with?
                  </h2>
                  <span className="mb-0.5 h-px min-w-[2rem] flex-1 bg-gradient-to-r from-purple-200 to-transparent" />
                </div>

                <div className="space-y-3">
                  {topicOptions.map((opt) => {
                    const isChecked = !!selected[opt.id];
                    const needsText = isChecked && (opt.hasTextInput || opt.id === 'other');
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-xl border transition-all duration-150 ${
                          isChecked
                            ? 'border-purple-300 bg-purple-50/70 shadow-xs ring-1 ring-purple-100'
                            : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/80'
                        }`}
                      >
                        <label className="group flex cursor-pointer select-none items-start gap-3 p-3.5 sm:p-4">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-400 focus:ring-offset-0"
                            checked={isChecked}
                            onChange={() => toggle(opt.id)}
                          />
                          <span className="text-sm font-medium leading-snug text-gray-800 group-hover:text-gray-900">
                            {opt.label}
                          </span>
                        </label>

                        {/* Individual detail text input for each question requiring it */}
                        {needsText ? (
                          <div className="px-4 pb-4 pt-1 sm:px-5">
                            <label className="block text-xs font-semibold text-purple-950 mb-1">
                              Please specify details for &ldquo;{opt.label}&rdquo; <span className="text-red-600">*</span>
                            </label>
                            <textarea
                              rows={2}
                              value={questionDetails[opt.id] || ''}
                              onChange={(e) =>
                                setQuestionDetails((prev) => ({
                                  ...prev,
                                  [opt.id]: e.target.value,
                                }))
                              }
                              placeholder={`Describe details for ${opt.label}...`}
                              className="w-full resize-y rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-400 shadow-inner"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-gradient-to-r from-gray-50/95 via-white to-purple-50/40 px-6 py-4 sm:px-8">
            <button
              type="submit"
              disabled={isSending}
              className="min-w-[8.5rem] rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-purple-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSending ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientScreeningForm;
