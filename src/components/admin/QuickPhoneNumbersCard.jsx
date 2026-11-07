/**
 * Admin profile card: manage up to 5 quick phone numbers (short name + phone)
 * offered as a dropdown in the WhatsApp send box on report validation pages.
 */
import React, { useEffect, useState } from 'react';
import { Phone, Plus, Trash2, Save, Loader2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useQuickPhoneNumbers,
  MAX_QUICK_PHONE_NUMBERS,
  getApiErrorMessage
} from '../../hooks/useQuickPhoneNumbers';

const MAX_LABEL_LENGTH = 30;

const emptyRow = () => ({ label: '', phone: '' });

const validateRows = (rows) => {
  const filled = rows.filter((r) => r.label.trim() || r.phone.trim());
  const labels = new Set();
  const phones = new Set();
  for (let i = 0; i < filled.length; i += 1) {
    const label = filled[i].label.trim();
    const phone = filled[i].phone.replace(/\D/g, '');
    if (!label) return `Row ${i + 1}: short name is required`;
    if (!phone) return `Row ${i + 1}: phone number is required`;
    if (phone.length < 10 || phone.length > 15) return `Row ${i + 1}: phone number must have 10 to 15 digits`;
    if (labels.has(label.toLowerCase())) return `Short name "${label}" is used more than once`;
    if (phones.has(phone)) return `Phone number ${phone} is added more than once`;
    labels.add(label.toLowerCase());
    phones.add(phone);
  }
  return null;
};

const QuickPhoneNumbersCard = () => {
  const { numbers, loading, save } = useQuickPhoneNumbers();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(numbers.map((n) => ({ label: n.label || '', phone: n.phone || '' })));
  }, [numbers]);

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleSave = async () => {
    const error = validateRows(rows);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      setSaving(true);
      await save(
        rows
          .filter((r) => r.label.trim() || r.phone.trim())
          .map((r) => ({ label: r.label.trim(), phone: r.phone.replace(/\D/g, '') }))
      );
      toast.success('Quick phone numbers saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save quick phone numbers'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MessageCircle size={20} />
            Quick Phone Numbers
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Up to {MAX_QUICK_PHONE_NUMBERS} numbers. Pick them by short name in the WhatsApp send box on
            Report Validation and Banker Reports.
          </p>
        </div>
        <span className="text-sm text-gray-400 shrink-0">
          {rows.length}/{MAX_QUICK_PHONE_NUMBERS}
        </span>
      </div>

      <div className="p-6 space-y-3">
        {loading ? (
          <div className="flex items-center text-gray-500 text-sm">
            <Loader2 size={16} className="animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <>
            {rows.length === 0 && (
              <p className="text-sm text-gray-500">No quick phone numbers yet.</p>
            )}
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                <input
                  type="text"
                  value={row.label}
                  maxLength={MAX_LABEL_LENGTH}
                  onChange={(e) => updateRow(idx, 'label', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Short name (e.g. Ravi Office)"
                />
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={row.phone}
                    onChange={(e) => updateRow(idx, 'phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10-digit mobile or with country code"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl justify-self-start"
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, emptyRow()])}
                disabled={rows.length >= MAX_QUICK_PHONE_NUMBERS}
                className="flex items-center px-4 py-2.5 border border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} className="mr-2" />
                Add number
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                Save Quick Numbers
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickPhoneNumbersCard;
