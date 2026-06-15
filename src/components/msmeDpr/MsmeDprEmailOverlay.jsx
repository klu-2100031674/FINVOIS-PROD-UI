import { useEffect, useState } from 'react';
import { Mail, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/common/Modal';
import {
  fetchMsmeDprNotificationEmails,
  saveMsmeDprNotificationEmails,
} from '@/api/msmeDprLeadsAPI';

const MAX_EMAILS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorToText = (err, fallback) => {
  if (typeof err === 'string') return err;
  return err?.response?.data?.message || err?.message || fallback;
};

const MsmeDprEmailOverlay = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emails, setEmails] = useState(['']);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMsmeDprNotificationEmails();
        const list = Array.isArray(data?.emails) ? data.emails : [];
        setEmails(list.length ? list : ['']);
      } catch (err) {
        toast.error(errorToText(err, 'Failed to load notification emails'));
        setEmails(['']);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  const handleEmailChange = (index, value) => {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  };

  const handleAdd = () => {
    if (emails.length >= MAX_EMAILS) {
      toast.error(`You can add up to ${MAX_EMAILS} emails`);
      return;
    }
    setEmails((prev) => [...prev, '']);
  };

  const handleRemove = (index) => {
    setEmails((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [''];
    });
  };

  const validate = () => {
    const trimmed = emails.map((e) => e.trim()).filter(Boolean);
    for (const email of trimmed) {
      if (!EMAIL_RE.test(email)) {
        toast.error(`Invalid email: ${email}`);
        return null;
      }
    }
    return trimmed;
  };

  const handleSave = async () => {
    const valid = validate();
    if (valid === null) return;
    setSaving(true);
    try {
      const data = await saveMsmeDprNotificationEmails(valid);
      const saved = Array.isArray(data?.emails) ? data.emails : [];
      setEmails(saved.length ? saved : ['']);
      toast.success('Notification emails saved');
      onClose();
    } catch (err) {
      toast.error(errorToText(err, 'Failed to save notification emails'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MSME DPR — Notification Emails"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 flex items-start gap-2">
          <Mail className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          Add up to {MAX_EMAILS} email addresses. Each will receive a notification when a new MSME
          DPR lead form is submitted.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder={`Email ${index + 1}`}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={emails.length === 1 && !email.trim()}
                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  aria-label="Remove email"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {emails.length < MAX_EMAILS && (
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-4 w-4" />
                Add email
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MsmeDprEmailOverlay;
