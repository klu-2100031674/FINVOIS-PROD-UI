import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Building2, CheckCircle2, Loader2, X, Filter } from 'lucide-react';
import { salesClientsAPI } from '../../../services/salesService';
import type { SalesClient } from '../../../types/sales.types';
import { getStageBadgeClass } from '../../../utils/salesUtils';
import toast from 'react-hot-toast';

function ConfirmPickDialog({
  client,
  onConfirm,
  onCancel,
  loading,
}: {
  client: SalesClient;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-gray-900 border border-white/10 rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Confirm Pick Customer</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-white font-medium">{client.name}</p>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Phone className="w-3.5 h-3.5" />
            {client.phone}
          </div>
          {client.company && (
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <Building2 className="w-3.5 h-3.5" />
              {client.company}
            </div>
          )}
          {(client.city || client.state) && (
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {[client.city, client.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm mb-5">
          This customer will be assigned to you. You can then begin contacting them.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Pick Customer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesQueuePage() {
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [confirmClient, setConfirmClient] = useState<SalesClient | null>(null);

  function loadQueue() {
    setLoading(true);
    salesClientsAPI
      .queue({ page, pageSize: 18, search: search || undefined, city: cityFilter || undefined })
      .then((r) => { setClients(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load queue'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadQueue(); }, [page, search, cityFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePick() {
    if (!confirmClient) return;
    setPicking(true);
    try {
      await salesClientsAPI.pick(confirmClient.id);
      toast.success(`${confirmClient.name} assigned to you!`);
      setConfirmClient(null);
      loadQueue();
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Pick failed');
    } finally {
      setPicking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Queue</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total} available customers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, company…"
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all w-64"
          />
        </div>
        <input
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          placeholder="Filter by city…"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all w-40"
        />
        {(search || cityFilter) && (
          <button
            onClick={() => { setSearch(''); setCityFilter(''); setPage(1); }}
            className="flex items-center gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-all"
          >
            <Filter className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No customers available in the queue</p>
          <p className="text-gray-600 text-sm mt-1">Check back later for new customers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-violet-500/30 hover:bg-white/8 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{c.name}</p>
                    {c.company && <p className="text-gray-500 text-xs">{c.company}</p>}
                  </div>
                </div>
                <span className={getStageBadgeClass(c.stage)}>{c.stage}</span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {c.phone}
                </div>
                {(c.city || c.state) && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {[c.city, c.state].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              <button
                onClick={() => setConfirmClient(c)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-all opacity-80 group-hover:opacity-100"
              >
                <CheckCircle2 className="w-4 h-4" />
                Pick Customer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 18 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Previous</button>
          <span className="text-gray-500 text-sm">Page {page} of {Math.ceil(total / 18)}</span>
          <button disabled={page >= Math.ceil(total / 18)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Next</button>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmClient && (
        <ConfirmPickDialog
          client={confirmClient}
          onConfirm={handlePick}
          onCancel={() => setConfirmClient(null)}
          loading={picking}
        />
      )}
    </div>
  );
}
