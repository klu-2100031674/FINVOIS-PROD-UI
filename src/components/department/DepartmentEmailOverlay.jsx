import { useEffect, useState } from 'react';
import { Mail, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/common/Modal';
import api, { apiErrorMessage } from '@/api/apiClient';

const MAX_EMAILS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyRow = () => ({ email: '', enabled: true, sendDocuments: false });

const normalizeRows = (list) => {
  if (!Array.isArray(list) || !list.length) return [emptyRow()];
  return list.map((item) => {
    if (typeof item === 'string') {
      return { email: item, enabled: true, sendDocuments: false };
    }
    return {
      email: String(item?.email || ''),
      enabled: item?.enabled !== false,
      sendDocuments: Boolean(item?.sendDocuments),
    };
  });
};

const DepartmentEmailOverlay = ({ isOpen, onClose, departmentId }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([emptyRow()]);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (!isOpen || !departmentId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/govt-forms/departments/${departmentId}/email-config`);
        setRows(normalizeRows(res.data?.emails));
        setSubject(res.data?.subject || '');
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to load email configuration'));
        setRows([emptyRow()]);
        setSubject('');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, departmentId]);

  const updateRow = (index, patch) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleAdd = () => {
    if (rows.length >= MAX_EMAILS) {
      toast.error(`You can add up to ${MAX_EMAILS} emails`);
      return;
    }
    setRows((prev) => [...prev, emptyRow()]);
  };

  const handleRemove = (index) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyRow()];
    });
  };

  const validate = () => {
    const payload = [];
    for (const row of rows) {
      const email = String(row.email || '').trim().toLowerCase();
      if (!email) continue;
      if (!EMAIL_RE.test(email)) {
        toast.error(`Invalid email: ${email}`);
        return null;
      }
      payload.push({
        email,
        enabled: row.enabled !== false,
        sendDocuments: Boolean(row.sendDocuments),
      });
    }
    return payload;
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
      setRows(normalizeRows(res.data?.emails));
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
      size="md"
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
          Configure recipients for this department. Enable/disable and document attachments are set per email.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
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

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500">
                Recipient Emails (Up to {MAX_EMAILS})
              </label>
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) => updateRow(index, { email: e.target.value })}
                      placeholder={`Email ${index + 1}`}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      disabled={rows.length === 1 && !row.email.trim()}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                      aria-label="Remove email"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 pl-0.5">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.enabled !== false}
                        onChange={(e) =>
                          updateRow(index, {
                            enabled: e.target.checked,
                            ...(e.target.checked ? {} : { sendDocuments: false }),
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Enable email
                    </label>
                    <label
                      className={`inline-flex items-center gap-2 text-sm text-gray-700 ${
                        row.enabled !== false ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(row.sendDocuments)}
                        disabled={row.enabled === false}
                        onChange={(e) => updateRow(index, { sendDocuments: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                      />
                      Send documents
                    </label>
                  </div>
                </div>
              ))}
              {rows.length < MAX_EMAILS && (
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
