import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Mail, Save, RotateCcw, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import { CHALLENGE_OPTIONS as PMEGP_OPTIONS } from '../../components/forms/scheme/pmegpSchemeMailConstants';
import { CHALLENGE_OPTIONS as AP_IDP_OPTIONS } from '../../components/forms/scheme/apIdpSchemeMailConstants';
import { CHALLENGE_OPTIONS as CMEP_OPTIONS } from '../../components/forms/scheme/cmepSchemeMailConstants';
import { CLIENT_SCREENING_ROUTING_OPTIONS } from '../../components/forms/scheme/clientScreeningSchemeMailConstants';

/** Strips the trailing "(Send message to <X>)" hint from option labels for cleaner display. */
const stripRecipientHint = (label) => String(label || '').replace(/\s*\(Send[^)]*\)\s*$/i, '');

/** Reserved keys used to persist the single global default fallback email. */
const GLOBAL_SCHEME_KEY = '__global__';
const DEFAULT_OPTION_ID = '__default__';
const GLOBAL_KEY = `${GLOBAL_SCHEME_KEY}:${DEFAULT_OPTION_ID}`;

/** apiClient's response interceptor rejects with a string for HTTP errors. Normalize for toast. */
const errorToText = (err, fallback) => {
  if (typeof err === 'string') return err;
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
};

const SCHEMES = [
  { key: 'pmegp', title: 'PMEGP', subtitle: '/schemes/pmegp/support', options: PMEGP_OPTIONS },
  { key: 'ap-idp', title: 'AP IDP 4.0', subtitle: '/schemes/ap-idp/support', options: AP_IDP_OPTIONS },
  { key: 'cmep', title: 'CMEP', subtitle: '/schemes/cmep/support', options: CMEP_OPTIONS },
  {
    key: 'client-screening',
    title: 'Client screening',
    subtitle: '/client-screening',
    options: CLIENT_SCREENING_ROUTING_OPTIONS,
  },
];

const SchemeMailManagePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** Per-routing email map: { `${schemeKey}:${optionId}`: email }. Includes GLOBAL_KEY for the default. */
  const [emails, setEmails] = useState({});
  const [savedEmails, setSavedEmails] = useState({});

  const keyOf = (scheme, optionId) => `${scheme}:${optionId}`;

  const buildBlankMap = () => {
    const map = { [GLOBAL_KEY]: '' };
    for (const scheme of SCHEMES) {
      for (const opt of scheme.options) {
        map[keyOf(scheme.key, opt.id)] = '';
      }
    }
    return map;
  };

  const loadRoutings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/scheme-mail-routings');
      const all = res?.data?.routings || [];
      const map = buildBlankMap();
      for (const r of all) {
        const k = keyOf(r.schemeKey, r.optionId);
        if (k in map) map[k] = String(r.email || '');
      }
      setEmails(map);
      setSavedEmails(map);
    } catch (err) {
      toast.error(errorToText(err, 'Failed to load scheme mail routings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutings();
  }, []);

  const dirty = useMemo(() => {
    const keys = new Set([...Object.keys(emails), ...Object.keys(savedEmails)]);
    for (const k of keys) {
      if ((emails[k] || '').trim() !== (savedEmails[k] || '').trim()) return true;
    }
    return false;
  }, [emails, savedEmails]);

  const setEmail = (mapKey, value) => {
    setEmails((prev) => ({ ...prev, [mapKey]: value }));
  };

  const validate = () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const def = (emails[GLOBAL_KEY] || '').trim();
    if (def && !re.test(def)) {
      toast.error('Invalid default email');
      return false;
    }
    for (const scheme of SCHEMES) {
      for (const opt of scheme.options) {
        const v = (emails[keyOf(scheme.key, opt.id)] || '').trim();
        if (v && !re.test(v)) {
          toast.error(`Invalid email for ${scheme.title} • "${stripRecipientHint(opt.label)}"`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const routings = [
        {
          schemeKey: GLOBAL_SCHEME_KEY,
          optionId: DEFAULT_OPTION_ID,
          optionLabel: 'Default email (all schemes)',
          email: (emails[GLOBAL_KEY] || '').trim(),
        },
      ];
      for (const scheme of SCHEMES) {
        for (const opt of scheme.options) {
          routings.push({
            schemeKey: scheme.key,
            optionId: opt.id,
            optionLabel: stripRecipientHint(opt.label),
            email: (emails[keyOf(scheme.key, opt.id)] || '').trim(),
          });
        }
      }
      const res = await api.put('/scheme-mail-routings', { routings });
      const all = res?.data?.routings || [];
      const map = buildBlankMap();
      for (const r of all) {
        const k = keyOf(r.schemeKey, r.optionId);
        if (k in map) map[k] = String(r.email || '');
      }
      setEmails(map);
      setSavedEmails(map);
      toast.success('Email routings saved');
    } catch (err) {
      toast.error(errorToText(err, 'Failed to save email routings'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEmails(savedEmails);
  };

  const defaultEmail = (emails[GLOBAL_KEY] || '').trim();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to="/admin/schemes"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Schemes
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-purple-600" />
              Manage Support Emails
            </h1>
            <p className="mt-1 text-sm text-gray-600 max-w-3xl">
              Configure which email address should receive each support-form question for{' '}
              <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">/schemes/pmegp/support</code>{' '}
              and{' '}
              <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">/schemes/ap-idp/support</code>
              , and{' '}
              <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">/schemes/cmep/support</code>
              . Any question left blank uses the <strong>Default email</strong> below. If the
              default is also blank, that question's submission is not sent anywhere.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty || saving || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 text-sm">
            Loading email routings…
          </div>
        ) : (
          <div className="space-y-8">
            {/* Single global default row used by every scheme question when left blank */}
            <div className="bg-white border border-purple-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-purple-100 bg-purple-50/70">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-purple-600" />
                  Default email for all schemes
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-snug max-w-3xl">
                  Applied to every question across PMEGP, AP IDP 4.0, and Client screening whose own
                  email is left blank. Leave this blank to disable the fallback entirely.
                </p>
              </div>
              <div className="px-4 py-3">
                <input
                  type="email"
                  value={emails[GLOBAL_KEY] || ''}
                  onChange={(e) => setEmail(GLOBAL_KEY, e.target.value)}
                  placeholder="default-recipient@example.com"
                  className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {SCHEMES.map((scheme) => (
              <SchemeMailSection
                key={scheme.key}
                scheme={scheme}
                emails={emails}
                defaultEmail={defaultEmail}
                onChange={(optId, v) => setEmail(keyOf(scheme.key, optId), v)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const SchemeMailSection = ({ scheme, emails, defaultEmail, onChange }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-baseline justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900">{scheme.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Questions on{' '}
          <code className="text-[11px] bg-white border border-gray-200 px-1 py-0.5 rounded">
            {scheme.subtitle}
          </code>
        </p>
      </div>
      <span className="text-xs text-gray-500">{scheme.options.length} options</span>
    </div>

    <div className="divide-y divide-gray-100">
      {scheme.options.map((opt) => {
        const key = `${scheme.key}:${opt.id}`;
        const value = emails[key] || '';
        return (
          <div
            key={opt.id}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 py-3 items-start lg:items-center"
          >
            <div className="lg:col-span-7">
              <p className="text-sm text-gray-900 leading-snug">{stripRecipientHint(opt.label)}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                option id:{' '}
                <code className="text-[11px] bg-gray-50 border border-gray-200 px-1 py-0.5 rounded">
                  {opt.id}
                </code>
                {!value.trim() && defaultEmail && (
                  <span className="ml-2 text-purple-700">
                    → falls back to default ({defaultEmail})
                  </span>
                )}
              </p>
            </div>
            <div className="lg:col-span-5">
              <input
                type="email"
                value={value}
                onChange={(e) => onChange(opt.id, e.target.value)}
                placeholder={
                  defaultEmail
                    ? `Leave blank to use default (${defaultEmail})`
                    : 'recipient@example.com'
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default SchemeMailManagePage;
