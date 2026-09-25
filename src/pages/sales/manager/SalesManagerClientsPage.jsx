import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, AlertCircle, X, ChevronDown } from 'lucide-react';
import { getManagerClients, listExecutives, reassignClient, STAGE_COLORS, PRIORITY_COLORS } from '../../../services/salesService';
import SalesClientDetailDrawer from '../shared/SalesClientDetailDrawer';
import toast from 'react-hot-toast';

const STAGES = ['', 'Available', 'Assigned', 'Contacted', 'Interested', 'Follow-Up', 'Negotiation', 'Converted', 'Rejected'];
const PRIORITIES = ['', 'High', 'Medium', 'Low'];

const Badge = ({ label, colorMap }) => {
  const cls = colorMap[label] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  );
};

const ReassignModal = ({ client, executives, onClose, onDone }) => {
  const [execId, setExecId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!execId) return;
    setSaving(true);
    try {
      await reassignClient(client._id, { executiveId: execId, reason });
      toast.success('Client reassigned');
      onDone();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Reassign failed');
    } finally {
      setSaving(false);
    }
  };

  const selectCls = 'w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
  const inputCls = selectCls;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Reassign Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Reassigning: <span className="text-gray-800">{client.customerName}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Assign to Executive</label>
            <select className={selectCls} value={execId} onChange={(e) => setExecId(e.target.value)} required>
              <option value="">Select executive...</option>
              {executives.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Reason (optional)</label>
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for reassignment" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition">Cancel</button>
            <button type="submit" disabled={saving || !execId} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Reassign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SalesManagerClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ stage: '', executiveId: '', priority: '', city: '' });
  const [selectedClient, setSelectedClient] = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    getManagerClients(params)
      .then((res) => setClients(res.data.clients || res.data || []))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    listExecutives().then((res) => setExecutives(res.data.executives || res.data || [])).catch(() => {});
  }, []);

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const selectCls = 'px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition';

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">All Customers</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and manage all customer records</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-gray-400" />
        <select className={selectCls} value={filters.stage} onChange={(e) => setF('stage', e.target.value)}>
          {STAGES.map((s) => <option key={s} value={s}>{s || 'All Stages'}</option>)}
        </select>
        <select className={selectCls} value={filters.executiveId} onChange={(e) => setF('executiveId', e.target.value)}>
          <option value="">All Executives</option>
          {executives.map((ex) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
        </select>
        <select className={selectCls} value={filters.priority} onChange={(e) => setF('priority', e.target.value)}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
        </select>
        <input
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => setF('city', e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No clients match your filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Customer', 'Phone', 'City', 'Priority', 'Stage', 'Assigned To', 'Updated'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => setSelectedClient(c)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 text-gray-800 font-medium">{c.customerName}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.phoneNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{c.city || '—'}</td>
                    <td className="px-4 py-3"><Badge label={c.priority} colorMap={PRIORITY_COLORS} /></td>
                    <td className="px-4 py-3"><Badge label={c.stage} colorMap={STAGE_COLORS} /></td>
                    <td className="px-4 py-3 text-gray-500">{c.assignedTo?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedClient && (
        <SalesClientDetailDrawer
          client={selectedClient}
          isManager
          executives={executives}
          onClose={() => setSelectedClient(null)}
          onReassign={() => { setReassignTarget(selectedClient); setSelectedClient(null); }}
          onUpdate={load}
        />
      )}

      {reassignTarget && (
        <ReassignModal
          client={reassignTarget}
          executives={executives}
          onClose={() => setReassignTarget(null)}
          onDone={() => { setReassignTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default SalesManagerClientsPage;
