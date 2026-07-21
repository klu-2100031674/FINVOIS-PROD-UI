import { useEffect, useState } from 'react';
import { Mail, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/common/Modal';
import api, { apiErrorMessage } from '@/api/apiClient';

const MAX_EMAILS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DepartmentEmailOverlay = ({ isOpen, onClose, departmentId }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emails, setEmails] = useState(['']);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (!isOpen || !departmentId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/govt-forms/departments/${departmentId}/email-config`);
        const list = Array.isArray(res.data?.emails) ? res.data.emails : [];
        setEmails(list.length ? list : ['']);
        setSubject(res.data?.subject || '');
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to load email configuration'));
        setEmails(['']);
        setSubject('');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, departmentId]);

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
    const validEmails = validate();
    if (validEmails === null) return;

    setSaving(true);
    try {
      const res = await api.put(`/govt-forms/departments/${departmentId}/email-config`, {
        emails: validEmails,
        subject: subject.trim(),
      });
      const savedEmails = Array.isArray(res.data?.emails) ? res.data.emails : [];
      setEmails(savedEmails.length ? savedEmails : ['']);
      setSubject(res.data?.subject || '');
      toast.success('Email configuration saved successfully');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save email configuration'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Department — Notification Emails"
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
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 flex items-start gap-2">
          <Mail className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          Configure emails and custom subject for notifications sent when forms are submitted for this department.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subject Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500">
                Email Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New Form Request Received"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            {/* Emails List */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500">
                Recipient Emails (Up to {MAX_EMAILS})
              </label>
              {emails.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder={`Email ${index + 1}`}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
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
                  className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Add email
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DepartmentEmailOverlay;
