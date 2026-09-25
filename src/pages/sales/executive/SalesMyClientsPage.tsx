import { useState, useEffect } from 'react';
import { Phone, Building2, MapPin, Search, Loader2 } from 'lucide-react';
import { salesClientsAPI } from '../../../services/salesService';
import type { SalesClient, ClientStage } from '../../../types/sales.types';
import { getStageBadgeClass, format } from '../../../utils/salesUtils';
import SalesClientDetailDrawer from '../../../components/sales/SalesClientDetailDrawer';
import toast from 'react-hot-toast';

const STAGE_TABS: Array<ClientStage | 'All'> = [
  'All', 'Assigned', 'Contacted', 'Interested', 'Follow-Up', 'Negotiation', 'Converted', 'Rejected',
];

export default function SalesMyClientsPage() {
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stageTab, setStageTab] = useState<ClientStage | 'All'>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<SalesClient | null>(null);

  function loadClients() {
    setLoading(true);
    salesClientsAPI
      .mine({
        page,
        pageSize: 20,
        stage: stageTab !== 'All' ? stageTab : undefined,
        search: search || undefined,
      })
      .then((r) => { setClients(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load clients'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadClients(); }, [page, stageTab, search]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClientUpdated(updated: SalesClient) {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedClient(updated);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">My Customers</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total} assigned to you</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customers…"
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        />
      </div>

      {/* Stage filter tabs */}
      <div className="flex flex-wrap gap-1">
        {STAGE_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStageTab(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              stageTab === s
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No customers found</p>
          <p className="text-xs mt-1">Try a different stage filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedClient(c)}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-violet-500/30 hover:bg-white/8 transition-all cursor-pointer"
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

              <div className="space-y-1.5">
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
                {c.lastActivityAt && (
                  <p className="text-gray-600 text-xs">Last activity: {format.date(c.lastActivityAt)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Previous</button>
          <span className="text-gray-500 text-sm">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Next</button>
        </div>
      )}

      <SalesClientDetailDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onClientUpdated={handleClientUpdated}
        isManager={false}
      />
    </div>
  );
}
