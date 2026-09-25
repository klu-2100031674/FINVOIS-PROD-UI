import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';
import { getManagerFollowUps, listExecutives } from '../../../services/salesService';

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  missed: 'bg-red-50 text-red-600 border-red-200',
};

const rowColor = (followUp) => {
  if (followUp.status === 'completed') return '';
  const date = new Date(followUp.followUpDate);
  const now = new Date();
  if (date < now) return 'bg-red-50 border-l-2 border-l-red-400';
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'bg-orange-50 border-l-2 border-l-orange-400';
  return '';
};

const today = () => new Date().toISOString().slice(0, 10);
const monthAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

const SalesManagerFollowUpsPage = () => {
  const [followUps, setFollowUps] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ executiveId: '', status: '', from: monthAgo(), to: today() });

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    getManagerFollowUps(params)
      .then((res) => setFollowUps(res.data.followUps || res.data || []))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    listExecutives().then((res) => setExecutives(res.data.executives || res.data || [])).catch(() => {});
  }, []);

  const selectCls = 'px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition';

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Follow-Ups</h1>
        <p className="text-sm text-gray-500 mt-0.5">Team follow-up schedule</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Executive</label>
          <select className={selectCls} value={filters.executiveId} onChange={(e) => setF('executiveId', e.target.value)}>
            <option value="">All executives</option>
            {executives.map((ex) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select className={selectCls} value={filters.status} onChange={(e) => setF('status', e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" className={selectCls} value={filters.from} onChange={(e) => setF('from', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" className={selectCls} value={filters.to} onChange={(e) => setF('to', e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No follow-ups match your filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Client', 'Executive', 'Purpose', 'Scheduled', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {followUps.map((f) => (
                  <tr key={f._id} className={`border-b border-gray-100 last:border-0 ${rowColor(f)}`}>
                    <td className="px-4 py-3 text-gray-800 font-medium">{f.clientId?.customerName || f.clientName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{f.executiveId?.name || f.executiveName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-48 truncate">{f.purpose}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-400" />
                        {new Date(f.followUpDate).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${STATUS_COLORS[f.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesManagerFollowUpsPage;
