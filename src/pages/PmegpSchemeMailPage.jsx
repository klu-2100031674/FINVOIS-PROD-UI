import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ClientLayout from '../components/layouts/ClientLayout';
import api from '../api/apiClient';

const SUPPORT_MAIL = 'krishnamurty2802@gmail.com';

const CHALLENGE_OPTIONS = [
  { id: 'project-report', label: 'Project report Requirement (Send message to Finvois Mail)' },
  { id: 'pmegp-portal', label: 'Applying in PMEGP Portal (Send message to Finvois Mail)' },
  { id: 'bank-loan', label: 'Difficulty in getting bank loan (Send message to Bank Mail ID)' },
  { id: 'edp', label: 'EDP training (Send message to given Mail)' },
  { id: 'online-marketing', label: 'Need Online Marketing support (Send message to given Mail)' },
  { id: 'packaging', label: 'Need Packaging support (Send message to given Mail)' },
  { id: 'branding', label: 'Need Branding support (Send message to given Mail)' },
  { id: 'udyam', label: 'Need Udyam Registration (Send message to Finvois Mail)' },
  { id: 'itr', label: 'Need to file Income tax returns (Send message to Finvois Mail)' },
  { id: 'gst', label: 'Need GST Registration (Send message to Finvois Mail)' },
  { id: 'fssai', label: 'Need FSSAI Licence (Send message to Finvois Mail)' },
  { id: 'rental', label: 'Need Rental Agreement drafting (Send message to Finvois Mail)' },
  {
    id: 'other',
    label:
      'Any Other requirement / hand Holding support, please specify: (License Requirements etc) (Send message to Finvois Mail)',
  },
];

const optionNameForMail = (opt, otherDetail) => {
  const base = opt.label.split(' (Send')[0].trim();
  if (opt.id === 'other' && otherDetail?.trim()) {
    return `${base}: ${otherDetail.trim()}`;
  }
  return base;
};

const buildMailBody = (fullName, selectedOpts, otherDetail) => {
  const names = selectedOpts.map((o) => optionNameForMail(o, o.id === 'other' ? otherDetail : ''));
  const lines = [`Full name: ${fullName}`, '', 'Selected option(s):', ...names.map((n) => `- ${n}`)];
  return lines.join('\n');
};

const PmegpSchemeMailPage = () => {
  const location = useLocation();
  const fullName = (location.state?.pmegpForm?.fullName || '').trim() || 'Applicant';

  const [selected, setSelected] = useState(() => ({}));
  const [otherText, setOtherText] = useState('');
  const [isSending, setIsSending] = useState(false);

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

    const optionNames = selectedEntries.map((o) => optionNameForMail(o, o.id === 'other' ? otherDetail : ''));

    setIsSending(true);
    try {
      await api.post('/support/pmegp', {
        fullName,
        selectedOptions: optionNames,
        otherText: otherOn ? otherText : '',
        source: 'ui:pmegp-scheme-mail',
      });
      window.alert(`Sent successfully to ${SUPPORT_MAIL}`);
      setSelected({});
      setOtherText('');
    } catch (err) {
      window.alert(String(err || 'Failed to send message'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Follow-up support</h1>
          <p className="text-sm text-gray-600">
            Confirm your name and choose what you need. Submit sends your request to{' '}
            <span className="font-mono text-gray-800">{SUPPORT_MAIL}</span>.
          </p>
          {!location.state?.pmegpForm && (
            <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No PMEGP form data was passed. You can still send a message; default name is shown as &quot;Applicant&quot;.{' '}
              <Link to="/generate/pmegp" className="font-semibold underline text-amber-900">
                Back to PMEGP form
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
              <label htmlFor="pmegp-other-detail" className="block text-sm font-semibold text-gray-800">
                Please specify (other requirement)
              </label>
              <textarea
                id="pmegp-other-detail"
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
              to="/generate/pmegp"
              state={location.state}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
            >
              ← Back to form
            </Link>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-semibold"
            >
              {isSending ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </ClientLayout>
  );
};

export default PmegpSchemeMailPage;
