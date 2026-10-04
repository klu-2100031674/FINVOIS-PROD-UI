import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Save, RotateCcw, Star, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import {
  TOPIC_OPTIONS,
  PRE_ESTABLISHMENT_TOPICS,
  POST_ESTABLISHMENT_TOPICS,
  PUBLIC_CLIENT_SCREENING_PATH,
} from '../../components/forms/clientScreening/clientScreeningConstants';

const DEFAULT_OPTION_ID = '__default__';

const errorToText = (err, fallback) => {
  if (typeof err === 'string') return err;
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
};

const ClientScreeningMailPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emails, setEmails] = useState({});
  const [savedEmails, setSavedEmails] = useState({});

  const buildBlankMap = () => {
    const map = { [DEFAULT_OPTION_ID]: '' };
    for (const opt of TOPIC_OPTIONS) {
      map[opt.id] = '';
    }
    return map;
  };

  const loadRouting = async () => {
    setLoading(true);
    try {
      const res = await api.get('/client-screening/mail-routing');
      const list = res?.data?.routings || [];
      const map = buildBlankMap();
      for (const r of list) {
        if (r.optionId in map) map[r.optionId] = String(r.email || '');
      }
      setEmails(map);
      setSavedEmails(map);
    } catch (err) {
      toast.error(errorToText(err, 'Failed to load client screening emails'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouting();
  }, []);

  const dirty = useMemo(() => {
    const keys = new Set([...Object.keys(emails), ...Object.keys(savedEmails)]);
    for (const k of keys) {
      if ((emails[k] || '').trim() !== (savedEmails[k] || '').trim()) return true;
    }
    return false;
  }, [emails, savedEmails]);

  const setEmail = (id, value) => {
    setEmails((prev) => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const [id, value] of Object.entries(emails)) {
      const v = (value || '').trim();
      if (v && !re.test(v)) {
        const label =
          id === DEFAULT_OPTION_ID
            ? 'Default email'
            : TOPIC_OPTIONS.find((o) => o.id === id)?.label || id;
        toast.error(`Invalid email for ${label}`);
        return false;
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
          optionId: DEFAULT_OPTION_ID,
          optionLabel: 'Default email (all client screening, CMEP, PMEGP, and AP IDP topics)',
          email: (emails[DEFAULT_OPTION_ID] || '').trim(),
        },
        ...TOPIC_OPTIONS.map((opt) => ({
          optionId: opt.id,
          optionLabel: opt.label,
          email: (emails[opt.id] || '').trim(),
        })),
      ];
      const res = await api.put('/client-screening/mail-routing', { routings });
      const list = res?.data?.routings || [];
      const map = buildBlankMap();
      for (const r of list) {
        if (r.optionId in map) map[r.optionId] = String(r.email || '');
      }
      setEmails(map);
      setSavedEmails(map);
      toast.success('Client screening emails saved (MSME Service accounts created as needed)');
    } catch (err) {
      toast.error(errorToText(err, 'Failed to save emails'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setEmails(savedEmails);
  const defaultEmail = (emails[DEFAULT_OPTION_ID] || '').trim();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-purple-600" />
              Client Screening — Topic Emails
            </h1>
            <Link
              to="/admin/client-screening/requests"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:underline"
            >
              <Inbox className="w-4 h-4" />
              View request status
            </Link>
            <p className="mt-1 text-sm text-gray-600 max-w-3xl">
              One topic-email list for{' '}
              <strong>client screening</strong>, <strong>CMEP</strong>, <strong>PMEGP</strong>, and{' '}
              <strong>AP IDP</strong> (
              <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">
                {PUBLIC_CLIENT_SCREENING_PATH}
              </code>
              ,{' '}
              <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">
                /schemes/cmep/support
              </code>
              ,{' '}
              <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">
                /schemes/pmegp/support
              </code>
              ,{' '}
              <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">
                /schemes/ap-idp/support
              </code>
              ). Blank topics use the default email. Saving creates{' '}
              <strong>MSME Service Provider</strong> accounts with temporary password{' '}
              <code className="text-xs">ABcd@0000</code> when needed. An email already used in
              the application (customer, admin, lead, sales, franchise, and other roles) cannot
              be added unless it is already an MSME Service Provider.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty || saving || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving || loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-3xl">
          <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 mb-2">
            <Star className="w-4 h-4" />
            Default email
          </label>
          <input
            type="email"
            value={emails[DEFAULT_OPTION_ID] || ''}
            onChange={(e) => setEmail(DEFAULT_OPTION_ID, e.target.value)}
            disabled={loading || saving}
            placeholder="fallback@example.com"
            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200/80 disabled:opacity-60"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Topic</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">MSME Service email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { title: 'Pre-Establishment', options: PRE_ESTABLISHMENT_TOPICS },
                { title: 'Post-Establishment', options: POST_ESTABLISHMENT_TOPICS },
              ].map((group) => (
                <Fragment key={group.title}>
                  <tr className="bg-purple-50/80">
                    <td colSpan={2} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-purple-900">
                      {group.title}
                    </td>
                  </tr>
                  {group.options.map((opt) => {
                    const value = emails[opt.id] || '';
                    const usingDefault = !value.trim() && defaultEmail;
                    return (
                      <tr key={`${group.title}-${opt.id}`} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 text-gray-800 align-top max-w-md">{opt.label}</td>
                        <td className="px-4 py-3">
                          <input
                            type="email"
                            value={value}
                            onChange={(e) => setEmail(opt.id, e.target.value)}
                            disabled={loading || saving}
                            placeholder={usingDefault ? `Using default: ${defaultEmail}` : 'provider@example.com'}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200/80 disabled:opacity-60"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClientScreeningMailPage;
