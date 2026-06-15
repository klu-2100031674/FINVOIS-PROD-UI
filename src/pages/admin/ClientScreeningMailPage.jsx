import { useEffect, useMemo, useState } from 'react';
import { Mail, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import { CLIENT_SCREENING_INBOX_OPTION, PUBLIC_CLIENT_SCREENING_PATH } from '../../components/forms/clientScreening/clientScreeningConstants';

const errorToText = (err, fallback) => {
  if (typeof err === 'string') return err;
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
};

const ClientScreeningMailPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  const loadRouting = async () => {
    setLoading(true);
    try {
      const res = await api.get('/client-screening/mail-routing');
      const inbox = String(res?.data?.routing?.email || '');
      setEmail(inbox);
      setSavedEmail(inbox);
    } catch (err) {
      toast.error(errorToText(err, 'Failed to load client screening inbox'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouting();
  }, []);

  const dirty = useMemo(
    () => (email || '').trim() !== (savedEmail || '').trim(),
    [email, savedEmail],
  );

  const validate = () => {
    const value = (email || '').trim();
    if (!value) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) {
      toast.error('Invalid inbox email');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.put('/client-screening/mail-routing', {
        email: (email || '').trim(),
        optionLabel: CLIENT_SCREENING_INBOX_OPTION.label,
      });
      const inbox = String(res?.data?.routing?.email || '');
      setEmail(inbox);
      setSavedEmail(inbox);
      toast.success('Client screening inbox saved');
    } catch (err) {
      toast.error(errorToText(err, 'Failed to save inbox email'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setEmail(savedEmail);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-600" />
            Client Screening — Inbox Email
          </h1>
          <p className="mt-1 text-sm text-gray-600 max-w-3xl">
            All submissions from{' '}
            <code className="text-xs bg-purple-50 text-purple-900 px-1 py-0.5 rounded">
              {PUBLIC_CLIENT_SCREENING_PATH}
            </code>{' '}
            are sent to this single inbox, regardless of which topics the applicant selects.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-2xl">
          <label htmlFor="cs-inbox-email" className="block text-sm font-semibold text-gray-800 mb-2">
            Inbox email
          </label>
          <p className="text-xs text-gray-500 mb-3">{CLIENT_SCREENING_INBOX_OPTION.label}</p>
          <input
            id="cs-inbox-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || saving}
            placeholder="team@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200/80 disabled:opacity-60"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving || loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty || saving || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClientScreeningMailPage;
