import { useState, useEffect } from 'react';
import { CalendarClock, Loader2, ChevronDown } from 'lucide-react';
import { salesFollowUpsAPI, salesExecutivesAPI } from '../../../services/salesService';
import type { SalesFollowUp, SalesUser, FollowUpStatus } from '../../../types/sales.types';
import { getStageBadgeClass, format } from '../../../utils/salesUtils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SalesManagerFollowUpsPage() {
  const [followUps, setFollowUps] = useState<SalesFollowUp[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterExec, setFilterExec] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [executives, setExecutives] = useState<SalesUser[]>([]);

  useEffect(() => {
    salesExecutivesAPI.list({ pageSize: 100 }).then((r) => setExecutives(r.data.data)).catch(() => null);
  }, []);

  function loadFollowUps() {
    setLoading(true);
    salesFollowUpsAPI
      .all({
        page,
        pageSize: 20,
        executiveId: filterExec || undefined,
        status: filterStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      .then((r) => { setFollowUps(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load follow-ups'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadFollowUps(); }, [page, filterExec, filterStatus, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusColors: Record<FollowUpStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    overdue: 'bg-red-500/20 text-red-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    cancelled: 'bg-gray-500/20 text-gray-400',
  };

  const selectCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none pr-8';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">All Follow-Ups</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select value={filterExec} onChange={(e) => { setFilterExec(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All Executives</option>
            {executives.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className={selectCls}>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>

        <button
          onClick={() => { setFilterExec(''); setFilterStatus(''); setDateFrom(''); setDateTo(''); setPage(1); }}
          className="border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-all"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <CalendarClock className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            No follow-ups found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500">
                  {['Client', 'Executive', 'Stage', 'Scheduled', 'Status', 'Note'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {followUps.map((fu) => (
                  <tr key={fu.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{fu.client.name}</p>
                      <p className="text-gray-500 text-xs">{fu.client.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fu.executiveName}</td>
                    <td className="px-4 py-3">
                      <span className={getStageBadgeClass(fu.client.stage)}>{fu.client.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{format.dateTime(fu.scheduledAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[fu.status]}`}>
                        {fu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{fu.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Previous</button>
          <span className="text-gray-500 text-sm">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-all">Next</button>
        </div>
      )}
    </div>
  );
}
