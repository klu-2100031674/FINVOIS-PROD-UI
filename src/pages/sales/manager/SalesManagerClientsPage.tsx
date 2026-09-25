import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, ChevronDown } from 'lucide-react';
import { salesClientsAPI, salesExecutivesAPI } from '../../../services/salesService';
import type { SalesClient, ClientStage, SalesUser } from '../../../types/sales.types';
import { getStageBadgeClass, format } from '../../../utils/salesUtils';
import SalesClientDetailDrawer from '../../../components/sales/SalesClientDetailDrawer';
import toast from 'react-hot-toast';

const STAGES: Array<ClientStage | 'All'> = [
  'All', 'Available', 'Assigned', 'Contacted', 'Interested',
  'Follow-Up', 'Negotiation', 'Converted', 'Rejected',
];

export default function SalesManagerClientsPage() {
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<ClientStage | 'All'>('All');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [executives, setExecutives] = useState<SalesUser[]>([]);
  const [selectedClient, setSelectedClient] = useState<SalesClient | null>(null);

  function loadClients() {
    setLoading(true);
    salesClientsAPI
      .all({
        page,
        pageSize: 20,
        search: search || undefined,
        stage: stage !== 'All' ? stage : undefined,
        assignedTo: assignedTo || undefined,
      })
      .then((r) => { setClients(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load clients'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadClients(); }, [page, search, stage, assignedTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    salesExecutivesAPI.list({ pageSize: 100, isActive: true }).then((r) => setExecutives(r.data.data)).catch(() => null);
  }, []);

  function handleClientUpdated(updated: SalesClient) {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedClient(updated);
  }

  const selectCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none pr-8';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">All Customers</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, phone, email…"
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all w-60"
          />
        </div>

        <div className="relative">
          <select
            value={stage}
            onChange={(e) => { setStage(e.target.value as ClientStage | 'All'); setPage(1); }}
            className={selectCls}
          >
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={assignedTo}
            onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
            className={selectCls}
          >
            <option value="">All Executives</option>
            {executives.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <button
          onClick={() => { setSearch(''); setStage('All'); setAssignedTo(''); setPage(1); }}
          className="flex items-center gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-all"
        >
          <Filter className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No clients found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Stage</th>
                  <th className="text-left px-4 py-3 font-medium">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/3 cursor-pointer transition-colors"
                    onClick={() => setSelectedClient(c)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className={getStageBadgeClass(c.stage)}>{c.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{c.assignedTo?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.lastActivityAt ? format.date(c.lastActivityAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Previous</button>
          <span className="text-gray-500 text-sm">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Next</button>
        </div>
      )}

      {/* Detail Drawer */}
      <SalesClientDetailDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onClientUpdated={handleClientUpdated}
        isManager={true}
        executives={executives}
      />
    </div>
  );
}
