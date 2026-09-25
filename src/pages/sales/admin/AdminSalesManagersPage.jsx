import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Loader2, AlertCircle, X, CheckCircle,
  KeyRound, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../../components/layouts';
import SalesCrmSubNav from './SalesCrmSubNav';
import {
  adminListManagers, adminCreateManager, adminUpdateManager,
  adminResetManagerPassword, adminGetManagerDetail,
} from '../../../services/salesService';

// ── Manager Create/Edit Modal ─────────────────────────────────────────────────
const ManagerModal = ({ manager, onClose, onSaved }) => {
  const isEdit = !!manager;
  const [form, setForm] = useState({
    name: manager?.name || '',
    email: manager?.email || '',
    password: '',
    isActive: manager?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await adminUpdateManager(manager._id, { name: form.name, email: form.email, isActive: form.isActive });
        toast.success('Manager updated');
      } else {
        await adminCreateManager({ name: form.name, email: form.email, password: form.password });
        toast.success('Manager created successfully');
      }
      onSaved();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Sales Manager' : 'Create Sales Manager'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-600 text-sm">
            <AlertCircle size={15} /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Manager full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="manager@company.com"
              required
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
          )}
          {isEdit && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-[#7e22ce]' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-600">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#7e22ce] hover:bg-[#6b21a8] text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {isEdit ? 'Update' : 'Create Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Reset Password Modal ──────────────────────────────────────────────────────
const ResetPasswordModal = ({ manager, onClose }) => {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminResetManagerPassword(manager._id, password);
      toast.success(`Password reset for ${manager.name}`);
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Set a new password for <span className="font-medium text-gray-800">{manager.name}</span></p>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-600 text-sm">
            <AlertCircle size={15} /><span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={6}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm transition">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#7e22ce] hover:bg-[#6b21a8] text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Expandable row showing a manager's executives ─────────────────────────────
const ManagerRow = ({ manager, onEdit, onReset, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !detail) {
      setLoadingDetail(true);
      try {
        const res = await adminGetManagerDetail(manager._id);
        setDetail(res.data?.data || res.data);
      } catch {
        // ignore
      } finally {
        setLoadingDetail(false);
      }
    }
    setExpanded((v) => !v);
  };

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-gray-50 transition">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#7e22ce] text-sm font-bold">
              {manager.name?.[0]?.toUpperCase()}
            </div>
            <span className="font-medium text-gray-900">{manager.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-gray-500 text-sm">{manager.email}</td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${manager.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {manager.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users size={14} />{manager.executiveCount ?? 0}
          </span>
        </td>
        <td className="px-6 py-4 text-gray-400 text-sm">
          {manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : '—'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(manager)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onReset(manager)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              title="Reset password"
            >
              <KeyRound size={14} />
            </button>
            <button
              onClick={() => onToggle(manager)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${manager.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
            >
              {manager.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={handleExpand} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b bg-gray-50">
          <td colSpan={6} className="px-6 py-3">
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 size={13} className="animate-spin" /> Loading executives…
              </div>
            ) : detail?.executives?.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-400 mb-2">Executives under {manager.name}</p>
                {detail.executives.map((exec) => (
                  <div key={exec._id} className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-[#7e22ce] text-xs font-bold">
                      {exec.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{exec.name}</span>
                    <span className="text-xs text-gray-400">{exec.email}</span>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${exec.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {exec.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-1">No executives assigned yet.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminSalesManagersPage = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [filterActive, setFilterActive] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (filterActive !== '') params.isActive = filterActive;
    adminListManagers(params)
      .then((res) => {
        const d = res.data?.data || res.data;
        setManagers(d?.managers || d || []);
      })
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load managers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterActive]);

  const toggleActive = async (manager) => {
    try {
      await adminUpdateManager(manager._id, { isActive: !manager.isActive });
      toast.success(`${manager.name} ${!manager.isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Update failed');
    }
  };

  const activeCount = managers.filter((m) => m.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SalesCrmSubNav />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Managers</h1>
            <p className="text-muted-foreground mt-1">Create and manage sales manager accounts</p>
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium text-sm transition"
          >
            <Plus size={16} />
            Create Manager
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Managers</p>
                <p className="text-3xl font-bold mt-1">{managers.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-[#7e22ce]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold mt-1">{activeCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-3xl font-bold mt-1">{managers.length - activeCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <X className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Filter + Table */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Managers ({managers.length})</h2>
            <div className="flex gap-1">
              {[['', 'All'], ['true', 'Active'], ['false', 'Inactive']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilterActive(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterActive === val ? 'bg-[#7e22ce] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7e22ce] mx-auto" />
                <p className="mt-3 text-muted-foreground text-sm">Loading managers…</p>
              </div>
            </div>
          ) : managers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No managers found. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Manager', 'Email', 'Status', 'Executives', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {managers.map((mgr) => (
                    <ManagerRow
                      key={mgr._id}
                      manager={mgr}
                      onEdit={(m) => setModal(m)}
                      onReset={(m) => setResetModal(m)}
                      onToggle={toggleActive}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ManagerModal
          manager={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {resetModal && (
        <ResetPasswordModal
          manager={resetModal}
          onClose={() => { setResetModal(null); }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminSalesManagersPage;
