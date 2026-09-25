import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { getQueue, pickClient, PRIORITY_COLORS } from '../../../services/salesService';
import toast from 'react-hot-toast';

const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

const ConfirmPickModal = ({ client, onClose, onConfirm, picking }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
    <div className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <h2 className="text-base font-semibold text-gray-900 mb-2">Pick this customer?</h2>
      <p className="text-sm text-gray-500 mb-5">
        <span className="text-gray-800 font-medium">{client.customerName}</span> will be assigned to you and removed from the queue.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={picking}
          className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition"
        >
          {picking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const SalesQueuePage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('All');
  const [source, setSource] = useState('');
  const [sources, setSources] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pickTarget, setPickTarget] = useState(null);
  const [picking, setPicking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (priority !== 'All') params.priority = priority;
    if (source) params.source = source;
    getQueue(params)
      .then((res) => {
        const data = res.data;
        setClients(data.clients || data.queue || data || []);
        setTotal(data.total || data.count || 0);
        const allSources = (data.clients || data.queue || []).map((c) => c.source).filter(Boolean);
        setSources([...new Set(allSources)]);
      })
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load queue'))
      .finally(() => setLoading(false));
  }, [search, priority, source, page]);

  useEffect(() => { load(); }, [load]);

  const handlePick = async () => {
    if (!pickTarget) return;
    setPicking(true);
    try {
      await pickClient(pickTarget._id);
      toast.success(`${pickTarget.customerName} assigned to you`);
      setPickTarget(null);
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to pick customer');
    } finally {
      setPicking(false);
    }
  };

  const priorityBadge = (p) => {
    const cls = PRIORITY_COLORS[p] || 'bg-gray-100 text-gray-600 border-gray-200';
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>{p}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Customer Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? 'Loading...' : `${total} customers available`}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            placeholder="Search name, phone, city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => { setPriority(p); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${
                priority === p
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {sources.length > 0 && (
          <select
            className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
          >
            <option value="">All Sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          No customers in queue
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => (
              <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition group shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{c.customerName}</h3>
                    {c.companyName && <p className="text-xs text-gray-500 truncate mt-0.5">{c.companyName}</p>}
                  </div>
                  {priorityBadge(c.priority)}
                </div>
                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  <p className="font-mono text-gray-700">{c.phoneNumber}</p>
                  {c.email && <p className="truncate">{c.email}</p>}
                  {c.city && <p>{c.city}{c.state ? `, ${c.state}` : ''}</p>}
                  {c.source && (
                    <span className="inline-block px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-xs">
                      {c.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                  <button
                    onClick={() => setPickTarget(c)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-medium transition opacity-0 group-hover:opacity-100"
                  >
                    Pick Customer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-sm transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 15)}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 15)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-sm transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {pickTarget && (
        <ConfirmPickModal
          client={pickTarget}
          onClose={() => setPickTarget(null)}
          onConfirm={handlePick}
          picking={picking}
        />
      )}
    </div>
  );
};

export default SalesQueuePage;
