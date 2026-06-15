/**
 * Admin Banks Page
 * Lead Manager / Admin can add, edit, remove banks that receive DPRs
 * Supports multiple email addresses per bank with duplicate validation.
 */

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllBanks, createBank, updateBank, deleteBank } from '@/store/slices/bankSlice';
import { Landmark, Plus, Edit, Trash2, X, Loader2, AlertCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { name: '', emails: [], phone: '', branchName: '', address: '', contactPerson: '', notes: '' };

// ── Multi-email tag input ──────────────────────────────────────────────────
const EmailTagInput = ({ emails, onChange }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const addEmail = (raw) => {
    const val = raw.trim().toLowerCase();
    if (!val) return;
    if (!EMAIL_RE.test(val)) { setError(`"${val}" is not a valid email`); return; }
    if (emails.includes(val)) { setError(`"${val}" is already added`); return; }
    setError('');
    onChange([...emails, val]);
    setInput('');
  };

  const removeEmail = (email) => onChange(emails.filter(e => e !== email));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(input);
    } else if (e.key === 'Backspace' && !input && emails.length) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handleBlur = () => { if (input.trim()) addEmail(input); };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.focus()}
        className="min-h-[42px] w-full border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#7e22ce] focus-within:border-[#7e22ce] cursor-text flex flex-wrap gap-1.5"
      >
        {emails.map(email => (
          <span
            key={email}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium"
          >
            {email}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
              className="hover:text-purple-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={emails.length === 0 ? 'Type email and press Enter or comma…' : 'Add another…'}
          className="flex-1 min-w-[180px] text-sm outline-none bg-transparent"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {emails.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">A bank can have multiple email addresses — all will receive the DPR.</p>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────
const AdminBanksPage = () => {
  const dispatch = useDispatch();
  const { banks, loading, error } = useSelector((state) => state.bank);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchAllBanks()); }, [dispatch]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (bank) => {
    setEditTarget(bank);
    setForm({
      name:          bank.name          || '',
      emails:        bank.emails        || [],
      phone:         bank.phone         || '',
      branchName:    bank.branchName    || '',
      address:       bank.address       || '',
      contactPerson: bank.contactPerson || '',
      notes:         bank.notes         || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Bank name is required');
    setSaving(true);
    try {
      if (editTarget) {
        await dispatch(updateBank({ id: editTarget._id, ...form })).unwrap();
        toast.success('Bank updated successfully');
      } else {
        await dispatch(createBank(form)).unwrap();
        toast.success('Bank added successfully');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err || 'Failed to save bank');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bank) => {
    if (!window.confirm(`Remove bank "${bank.name}"?`)) return;
    try {
      await dispatch(deleteBank(bank._id)).unwrap();
      toast.success('Bank removed');
    } catch {
      toast.error('Failed to remove bank');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bank Management</h1>
            <p className="text-muted-foreground mt-1">Manage banks that can receive DPR notifications</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium"
          >
            <Plus className="h-4 w-4" /> Add Bank
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Banks</p>
              <p className="text-3xl font-bold mt-1">{banks.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Landmark className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">All Banks ({banks.length})</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#7e22ce]" />
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-12">
              <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No banks added yet</p>
              <button onClick={openCreate} className="px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8]">
                Add your first bank
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">Bank Name</th>
                    <th className="text-left py-3 px-4 font-medium">Contact Person</th>
                    <th className="text-left py-3 px-4 font-medium">Emails</th>
                    <th className="text-left py-3 px-4 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 font-medium">Branch</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map((bank) => (
                    <tr key={bank._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{bank.name}</td>
                      <td className="py-3 px-4 text-gray-600">{bank.contactPerson || '—'}</td>
                      <td className="py-3 px-4">
                        {(bank.emails || []).length === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {bank.emails.map(email => (
                              <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                                <Mail className="h-3 w-3" />{email}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{bank.phone || '—'}</td>
                      <td className="py-3 px-4 text-gray-600">{bank.branchName || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(bank)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Edit bank"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(bank)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Remove bank"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">{editTarget ? 'Edit Bank' : 'Add New Bank'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. State Bank of India"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
              </div>

              {/* Multi-email */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Addresses
                  {form.emails.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-gray-500">({form.emails.length} added)</span>
                  )}
                </label>
                <EmailTagInput
                  emails={form.emails}
                  onChange={emails => setForm(f => ({ ...f, emails }))}
                />
              </div>

              {/* Other fields */}
              {[
                { label: 'Contact Person', key: 'contactPerson', placeholder: 'Branch manager name' },
                { label: 'Phone',          key: 'phone',          placeholder: '+91 9999999999' },
                { label: 'Branch Name',    key: 'branchName',     placeholder: 'e.g. Main Branch' },
                { label: 'Address',        key: 'address',        placeholder: 'Branch address' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editTarget ? 'Save Changes' : 'Add Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBanksPage;
