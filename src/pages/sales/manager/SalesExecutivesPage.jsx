import { useState, useEffect } from 'react';
import { Plus, Edit2, Loader2, AlertCircle, X, CheckCircle } from 'lucide-react';
import { listExecutives, createExecutive, updateExecutive } from '../../../services/salesService';
import toast from 'react-hot-toast';

const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition';
const labelCls = 'block text-sm font-medium text-gray-600 mb-1.5';

const ExecutiveModal = ({ exec, onClose, onSaved }) => {
  const isEdit = !!exec;
  const [form, setForm] = useState({ name: exec?.name || '', email: exec?.email || '', password: '', isActive: exec?.isActive ?? true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, isActive: form.isActive };
      if (!isEdit || form.password) payload.password = form.password;
      if (isEdit) {
        await updateExecutive(exec._id, payload);
        toast.success('Executive updated');
      } else {
        await createExecutive({ ...payload, password: form.password });
        toast.success('Executive created');
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
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Executive' : 'Add Executive'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-600 text-sm">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" required />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@company.com" required />
          </div>
          <div>
            <label className={labelCls}>{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input type="password" className={inputCls} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" {...(!isEdit ? { required: true } : {})} />
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={`w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-purple-600' : 'bg-gray-200'} relative`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-600">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SalesExecutivesPage = () => {
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | exec object

  const load = () => {
    setLoading(true);
    listExecutives()
      .then((res) => setExecutives(res.data.executives || res.data || []))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (exec) => {
    try {
      await updateExecutive(exec._id, { isActive: !exec.isActive });
      toast.success(`${exec.name} ${!exec.isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Update failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Executives</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your sales team</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium transition shadow-lg shadow-purple-200"
        >
          <Plus size={16} />
          Add Executive
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-purple-600" size={28} />
          </div>
        ) : executives.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No executives yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {executives.map((exec, i) => (
                <tr key={exec._id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                        {exec.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-gray-800 font-medium">{exec.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{exec.email}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(exec)} className="flex items-center gap-2 group">
                      <div className={`w-9 h-5 rounded-full transition-colors ${exec.isActive ? 'bg-purple-600' : 'bg-gray-200'} relative`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${exec.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <span className={`text-xs font-medium ${exec.isActive ? 'text-purple-700' : 'text-gray-400'}`}>
                        {exec.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setModal(exec)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-xs transition"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ExecutiveModal
          exec={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
};

export default SalesExecutivesPage;
