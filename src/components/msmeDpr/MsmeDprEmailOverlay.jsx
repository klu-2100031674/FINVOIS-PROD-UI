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

const errorToText = (err, fallback) => {
  if (typeof err === 'string') return err;
  return err?.response?.data?.message || err?.message || fallback;
};

const MsmeDprEmailOverlay = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([emptyRow()]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMsmeDprNotificationEmails();
        setRows(normalizeRows(data?.emails));
      } catch (err) {
        toast.error(errorToText(err, 'Failed to load notification emails'));
        setRows([emptyRow()]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

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
    const valid = validate();
    if (valid === null) return;
    setSaving(true);
    try {
      const data = await saveMsmeDprNotificationEmails(valid);
      setRows(normalizeRows(data?.emails));
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
          Add up to {MAX_EMAILS} emails. Enable/disable and document attachments are set per address.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="space-y-3">
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
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
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
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
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
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 disabled:opacity-50"
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
