import { useMemo, useState } from 'react';
import api from '../../../api/apiClient';
import { TOPIC_OPTIONS, optionNameForMail } from './clientScreeningConstants';

const NAME_MIN_LETTERS = 5;

function countAlphabeticLetters(name) {
  return (String(name || '').match(/[A-Za-z]/g) || []).length;
}

/**
 * Stand-alone client screening contact page (name + phone + topics → one configured inbox).
 */
const ClientScreeningForm = ({ supportSource = 'ui:client-screening-public' }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState(() => ({}));
  const [otherText, setOtherText] = useState('');
  const [rawMaterialText, setRawMaterialText] = useState('');
  const [machineryText, setMachineryText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedEntries = useMemo(() => {
    return TOPIC_OPTIONS.filter((o) => selected[o.id]);
  }, [selected]);

  const nameTrimmedLive = String(fullName || '').trim();
  const nameLetterCount = countAlphabeticLetters(nameTrimmedLive);
  const showNameHint = fullName.length > 0 && nameLetterCount < NAME_MIN_LETTERS;
  const showPhoneHint = phone.length > 0 && !/^\d{10}$/.test(phone);

  const toggle = (id) => {
    setSelected((p) => {
      const next = { ...p, [id]: !p[id] };
      if (id === 'other' && !next.other) setOtherText('');
      if (id === 'raw-material' && !next['raw-material']) setRawMaterialText('');
      if (id === 'machinery' && !next.machinery) setMachineryText('');
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otherOn = selected.other;
    const rawMaterialOn = selected['raw-material'];
    const machineryOn = selected.machinery;
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
    if (!selectedEntries.length) {
      window.alert('Please select at least one topic.');
      return;
    }
    if (otherOn && !otherText.trim()) {
      window.alert('Please describe your other topic, or uncheck that option.');
      return;
    }
    const otherDetail = otherOn ? otherText : '';
    const rawMaterialDetail = rawMaterialOn ? rawMaterialText : '';
    const machineryDetail = machineryOn ? machineryText : '';

    const optionNames = selectedEntries.map((o) =>
      optionNameForMail(
        o,
        o.id === 'other' ? otherDetail : '',
        o.id === 'raw-material' ? rawMaterialDetail : '',
        o.id === 'machinery' ? machineryDetail : '',
      ),
    );
    const optionIds = selectedEntries.map((o) => o.id);

    setIsSending(true);
    try {
      await api.post('/client-screening', {
        fullName: nameTrimmed,
        phone: phoneDigits,
        selectedOptions: optionNames,
        selectedOptionIds: optionIds,
        otherText: otherOn ? otherText : '',
        rawMaterialText: rawMaterialOn ? rawMaterialText : '',
        machineryText: machineryOn ? machineryText : '',
        source: supportSource,
      });
      window.alert('Your message was sent. We will get back to you soon.');
      setSelected({});
      setOtherText('');
      setRawMaterialText('');
      setMachineryText('');
    } catch (err) {
      window.alert(String(err || 'Failed to send message'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-3 pb-2 sm:px-0">
      <div className="space-y-5 sm:space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-purple-100/90 bg-gradient-to-br from-purple-50/90 via-white to-white p-6 shadow-sm sm:p-8">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-purple-200/20 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-3xl border-l-[3px] border-purple-500 pl-4 sm:pl-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-700">
              Client screening
            </p>
            <h1 className="mt-2 text-balance text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-[1.75rem]">
              What is the main challenge or doubt your MSME is facing right now?
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-gray-100/80"
        >
          <div className="space-y-8 p-6 sm:p-8">
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
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(digits);
                    }}
                    className={`w-full rounded-xl border bg-gray-50/40 px-3.5 py-2.5 text-sm tracking-wide transition-colors placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 ${
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
              </div>
            </section>

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
              <div className="space-y-2.5">
                {TOPIC_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`group flex cursor-pointer select-none items-start gap-3 rounded-xl border p-3.5 transition-all duration-150 sm:p-4 ${
                      selected[opt.id]
                        ? 'border-purple-300 bg-purple-50/90 shadow-sm ring-1 ring-purple-100'
                        : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/80'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-400 focus:ring-offset-0"
                      checked={!!selected[opt.id]}
                      onChange={() => toggle(opt.id)}
                    />
                    <span className="text-sm leading-snug text-gray-800 group-hover:text-gray-900">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {selected['raw-material'] ? (
              <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 sm:p-5">
                <label
                  htmlFor="cs-raw-material-detail"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  What kind of raw material do you require? (Optional)
                </label>
                <textarea
                  id="cs-raw-material-detail"
                  value={rawMaterialText}
                  onChange={(e) => setRawMaterialText(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-inner placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200/80"
                  placeholder="Describe the raw material requirement"
                />
              </div>
            ) : null}

            {selected.machinery ? (
              <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 sm:p-5">
                <label
                  htmlFor="cs-machinery-detail"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  What kind of machinery support do you require? (Optional)
                </label>
                <textarea
                  id="cs-machinery-detail"
                  value={machineryText}
                  onChange={(e) => setMachineryText(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-inner placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200/80"
                  placeholder="Describe the machinery support requirement"
                />
              </div>
            ) : null}

            {selected.other ? (
              <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 sm:p-5">
                <label htmlFor="cs-other-detail" className="mb-2 block text-sm font-semibold text-gray-800">
                  Please specify (other)
                </label>
                <textarea
                  id="cs-other-detail"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-inner placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200/80"
                  placeholder="Describe your requirement"
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-gradient-to-r from-gray-50/95 via-white to-purple-50/40 px-6 py-4 sm:px-8">
            <button
              type="submit"
              disabled={isSending}
              className="min-w-[8.5rem] rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
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
