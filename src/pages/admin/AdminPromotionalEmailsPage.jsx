/**
 * Admin Promotional Emails Page
 * Manage the list of promotional email recipients who receive lead notifications
 * whenever a user generates a report on Finvois.
 */
import React, { useEffect, useState } from 'react';
import { Mail, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, X, Save } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AdminPromotionalEmailsPage = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({ email: '', name: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/promotional-emails');
      setEmails(res.data?.data || []);
    } catch {
      toast.error('Failed to load promotional emails');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email address';
    if (!form.name.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmail = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      await api.post('/promotional-emails', {
        email: form.email.trim(),
        name: form.name.trim(),
        notes: form.notes.trim()
      });
      toast.success('Email added to promotional list');
      setShowModal(false);
      setForm({ email: '', name: '', notes: '' });
      setFormErrors({});
      fetchEmails();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add email';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      setTogglingId(id);
      const res = await api.patch(`/promotional-emails/${id}/toggle`);
      setEmails(prev => prev.map(e => e._id === id ? res.data.data : e));
      toast.success(`Email ${res.data.data.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this email from the promotional list?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/promotional-emails/${id}`);
      setEmails(prev => prev.filter(e => e._id !== id));
      toast.success('Email removed');
    } catch {
      toast.error('Failed to remove email');
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = emails.filter(e => e.is_active).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Promotional Emails</h1>
              <p className="text-gray-500 text-sm">Recipients who get notified when a user generates a report</p>
            </div>
          </div>
          <button
            onClick={() => { setShowModal(true); setForm({ email: '', name: '', notes: '' }); setFormErrors({}); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Email
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{emails.length}</p>
              <p className="text-xs text-gray-500">Total Emails</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <ToggleRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
              <p className="text-xs text-gray-500">Active Recipients</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <ToggleLeft className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{emails.length - activeCount}</p>
              <p className="text-xs text-gray-500">Inactive</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <p className="text-sm text-gray-500">
              These email addresses will receive a <strong>lead notification</strong> every time any user generates a report — with the user's name, email, and phone number.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Mail className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No promotional emails added yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-purple-600 text-sm font-medium hover:underline"
              >
                Add the first one
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-5 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-600">Notes</th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-600">Added</th>
                    <th className="text-center py-3 px-5 font-semibold text-gray-600">Status</th>
                    <th className="text-center py-3 px-5 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map(e => (
                    <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-5 font-medium text-gray-800 truncate max-w-[120px]" title={e.name}>{e.name}</td>
                      <td className="py-3 px-5 text-gray-600 truncate max-w-[180px]" title={e.email}>{e.email}</td>
                      <td className="py-3 px-5 text-gray-400 text-xs max-w-xs truncate">{e.notes || '—'}</td>
                      <td className="py-3 px-5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex justify-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            e.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {e.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggle(e._id)}
                            disabled={togglingId === e._id}
                            title={e.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              e.is_active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {togglingId === e._id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : e.is_active
                                ? <ToggleRight className="w-4 h-4" />
                                : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(e._id)}
                            disabled={deletingId === e._id}
                            title="Remove"
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {deletingId === e._id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
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

      {/* Add Email Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 font-['Manrope']">Add Promotional Email</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="recipient@example.com"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${
                    formErrors.email ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Loan Manager"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${
                    formErrors.name ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Bank relationship manager"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmail}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Add Email
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPromotionalEmailsPage;
