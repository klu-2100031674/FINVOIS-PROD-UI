import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Edit2, Power, Search, Loader2, X, UserCheck, UserX } from 'lucide-react';
import { salesExecutivesAPI } from '../../../services/salesService';
import type { SalesUser } from '../../../types/sales.types';
import toast from 'react-hot-toast';

interface ExecFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const EMPTY_FORM: ExecFormData = { name: '', email: '', phone: '', password: '' };

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SalesExecutivesPage() {
  const [executives, setExecutives] = useState<SalesUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SalesUser | null>(null);
  const [form, setForm] = useState<ExecFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<SalesUser | null>(null);

  function loadExecs() {
    setLoading(true);
    salesExecutivesAPI
      .list({ page, pageSize: 20, search: search || undefined })
      .then((r) => {
        setExecutives(r.data.data);
        setTotal(r.data.total);
      })
      .catch(() => toast.error('Failed to load executives'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadExecs(); }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  }

  function openEdit(exec: SalesUser) {
    setForm({ name: exec.name, email: exec.email, phone: exec.phone ?? '', password: '' });
    setEditTarget(exec);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await salesExecutivesAPI.update(editTarget.id, {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
        });
        toast.success('Executive updated');
        setEditTarget(null);
      } else {
        await salesExecutivesAPI.create(form);
        toast.success('Executive added');
        setAddOpen(false);
      }
      loadExecs();
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!confirmToggle) return;
    setSaving(true);
    try {
      await salesExecutivesAPI.toggleActive(confirmToggle.id);
      toast.success(`Executive ${confirmToggle.isActive ? 'deactivated' : 'activated'}`);
      setConfirmToggle(null);
      loadExecs();
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all';

  const ExecForm = ({ isEdit }: { isEdit: boolean }) => (
    <form onSubmit={handleSave} className="space-y-4">
      {(['name', 'email', 'phone'] as const).map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">{field}</label>
          <input
            type={field === 'email' ? 'email' : 'text'}
            required={field !== 'phone'}
            value={form[field]}
            onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
            className={inputCls}
            placeholder={field === 'phone' ? '+91 98765 43210 (optional)' : ''}
          />
        </div>
      ))}
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className={inputCls}
          />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => { setAddOpen(false); setEditTarget(null); }}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Add Executive'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executives</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} total</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Executive
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : executives.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No executives found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {executives.map((exec) => (
                <tr key={exec.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {exec.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{exec.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{exec.email}</td>
                  <td className="px-4 py-3 text-gray-400">{exec.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      exec.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {exec.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(exec.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => openEdit(exec)}
                        className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmToggle(exec)}
                        className={`p-1.5 rounded-lg transition-all ${
                          exec.isActive
                            ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={exec.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center gap-2 justify-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all"
          >
            Previous
          </button>
          <span className="text-gray-500 text-sm">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addOpen} title="Add Executive" onClose={() => setAddOpen(false)}>
        <ExecForm isEdit={false} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} title="Edit Executive" onClose={() => setEditTarget(null)}>
        <ExecForm isEdit={true} />
      </Modal>

      {/* Toggle Confirm Modal */}
      <Modal
        open={!!confirmToggle}
        title={confirmToggle?.isActive ? 'Deactivate Executive' : 'Activate Executive'}
        onClose={() => setConfirmToggle(null)}
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            {confirmToggle?.isActive
              ? `Are you sure you want to deactivate ${confirmToggle?.name}? They will lose access to the sales portal.`
              : `Activate ${confirmToggle?.name}? They will regain access to the sales portal.`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmToggle(null)}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 ${
                confirmToggle?.isActive
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmToggle?.isActive ? (
                <><UserX className="w-4 h-4" /> Deactivate</>
              ) : (
                <><UserCheck className="w-4 h-4" /> Activate</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
