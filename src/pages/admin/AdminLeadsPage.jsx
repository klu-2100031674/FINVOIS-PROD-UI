/**
 * Admin Leads List Page
 * View and manage all registered leads
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllLeads, toggleLeadStatus, resendLeadCredentials, assignLeadCredits } from '@/store/slices/leadSlice';
import {
  Plus,
  Search,
  Edit,
  UserCheck,
  Mail,
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Loader2,
  CreditCard,
  RefreshCw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

const AdminLeadsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { leads, loading, error } = useSelector((state) => state.lead);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [resendingId, setResendingId] = useState(null);

  // Credits modal
  const [creditModal, setCreditModal]   = useState(null); // { id, name, current }
  const [creditInput, setCreditInput]   = useState('');
  const [creditAction, setCreditAction] = useState('add');
  const [creditSaving, setCreditSaving] = useState(false);

  const openCreditModal = (e, lead) => {
    e.stopPropagation();
    setCreditModal({ id: lead._id, name: lead.name, current: lead.credits ?? 0 });
    setCreditInput('');
    setCreditAction('add');
  };

  const handleSaveCredits = async () => {
    const val = parseInt(creditInput, 10);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid number'); return; }
    setCreditSaving(true);
    try {
      await dispatch(assignLeadCredits({ id: creditModal.id, credits: val, action: creditAction })).unwrap();
      toast.success(`Credits updated for ${creditModal.name}`);
      setCreditModal(null);
      dispatch(fetchAllLeads({ limit: 200 }));
    } catch (err) {
      toast.error(err || 'Failed to update credits');
    } finally {
      setCreditSaving(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAllLeads({ limit: 200 }));
  }, [dispatch]);

  const handleResendCredentials = async (lead) => {
    setResendingId(lead._id);
    try {
      await dispatch(resendLeadCredentials(lead._id)).unwrap();
      toast.success(`Credentials resent to ${lead.email}`);
    } catch (err) {
      toast.error(err || 'Failed to resend credentials');
    } finally {
      setResendingId(null);
    }
  };

  const handleToggleStatus = async (lead) => {
    const newStatus = !lead.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} lead "${lead.name}"? They will receive an email notification.`)) return;
    try {
      await dispatch(toggleLeadStatus({ id: lead._id, isActive: newStatus })).unwrap();
      toast.success(`Lead ${newStatus ? 'activated' : 'deactivated'} — notification email sent.`);
    } catch {
      toast.error('Failed to update lead status');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filtered = leads.filter(
    (l) =>
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.services?.some((s) =>
        (s.name || s).toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal = sortBy === 'createdAt' ? new Date(a.createdAt) : (a[sortBy] || '');
    let bVal = sortBy === 'createdAt' ? new Date(b.createdAt) : (b[sortBy] || '');
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Provider Management</h1>
            <p className="text-muted-foreground mt-1">
              Register and manage service providers who receive DPR notifications
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/leads/register')}
            className="flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Service Provider
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => dispatch(fetchAllLeads({ limit: 200 }))}
              className="ml-auto px-3 py-1 text-sm border border-red-300 rounded-lg hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold mt-1">{leads.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserCheck className="h-6 w-6 text-[#7e22ce]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Leads</p>
                <p className="text-3xl font-bold mt-1">
                  {leads.filter((l) => l.isActive !== false).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive Leads</p>
                <p className="text-3xl font-bold mt-1">
                  {leads.filter((l) => l.isActive === false).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads by name, email, or linked service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">All Leads ({sorted.length})</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7e22ce] mx-auto" />
                <p className="mt-3 text-muted-foreground">Loading leads...</p>
              </div>
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No leads match your search' : 'No leads registered yet'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/admin/leads/register')}
                  className="px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8]"
                >
                  Register your first lead
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-[#7e22ce]"
                      >
                        Name <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Linked Services</th>
                    <th className="text-left py-3 px-4 font-medium">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-[#7e22ce]"
                      >
                        Registered <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Credits</th>
                    <th className="text-left py-3 px-4 font-medium">Assign Credits</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((lead) => (
                    <tr key={lead._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{lead.name}</td>
                      <td className="py-3 px-4 text-gray-600">{lead.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {lead.services && lead.services.length > 0 ? (
                            lead.services.map((s) => (
                              <span
                                key={s._id || s}
                                className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                              >
                                {s.name || s}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <span className={`font-medium ${(lead.freeLeadsUsed || 0) < 3 ? 'text-green-600' : (lead.credits || 0) > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            {(lead.freeLeadsUsed || 0) < 3
                              ? `Free (${3 - (lead.freeLeadsUsed || 0)} left)`
                              : (lead.credits || 0) > 0
                                ? `${lead.credits} credits`
                                : 'Locked'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => openCreditModal(e, lead)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                        >
                          <CreditCard className="h-3 w-3" /> Credits
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {lead.isActive !== false ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                              <CheckCircle className="h-4 w-4" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                              <XCircle className="h-4 w-4" /> Inactive
                            </span>
                          )}
                          {lead.passwordResetRequired && (
                            <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                              <ShieldAlert className="h-3.5 w-3.5" /> Not activated
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/leads/${lead._id}`)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Edit lead"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(lead)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              lead.isActive !== false
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={lead.isActive !== false ? 'Deactivate lead' : 'Activate lead'}
                          >
                            {lead.isActive !== false
                              ? <ToggleRight className="h-5 w-5" />
                              : <ToggleLeft className="h-5 w-5" />
                            }
                          </button>
                          {lead.passwordResetRequired && (
                            <button
                              onClick={() => handleResendCredentials(lead)}
                              disabled={resendingId === lead._id}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Resend credentials email"
                            >
                              {resendingId === lead._id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Mail className="h-4 w-4" />
                              }
                            </button>
                          )}
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
      {/* ── Assign Credits Modal ───────────────────────────────────────── */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assign Credits</h3>
                <p className="text-sm text-gray-500 mt-0.5">{creditModal.name}</p>
              </div>
              <button onClick={() => setCreditModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Credits</span>
              <span className="text-2xl font-bold text-purple-600">{creditModal.current}</span>
            </div>

            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setCreditAction('add')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  creditAction === 'add' ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                + Add Credits
              </button>
              <button
                onClick={() => setCreditAction('set')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  creditAction === 'set' ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                = Set Credits
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {creditAction === 'add' ? 'Credits to Add' : 'Set Total Credits To'}
              </label>
              <input
                type="number"
                min="0"
                value={creditInput}
                onChange={e => setCreditInput(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-lg font-semibold"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveCredits()}
              />
              {creditInput && !isNaN(parseInt(creditInput, 10)) && (
                <p className="text-xs text-gray-400 mt-1">
                  {creditAction === 'add'
                    ? `New total: ${creditModal.current + parseInt(creditInput, 10)} credits`
                    : `Will be set to: ${parseInt(creditInput, 10)} credits`}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setCreditModal(null)}
                className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredits}
                disabled={creditSaving || !creditInput}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creditSaving
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <CreditCard className="h-4 w-4" />
                }
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminLeadsPage;
