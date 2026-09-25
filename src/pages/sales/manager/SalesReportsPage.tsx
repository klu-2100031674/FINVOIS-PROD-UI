import { useState, useEffect } from 'react';
import { BarChart3, Activity, TrendingUp, CalendarClock, XCircle, Loader2 } from 'lucide-react';
import { salesReportsAPI, salesExecutivesAPI } from '../../../services/salesService';
import type { SalesClient, SalesFollowUp, SalesUser, SalesActivity } from '../../../types/sales.types';
import type { RejectionReason } from '../../../types/sales.types';
import { getStageBadgeClass, format } from '../../../utils/salesUtils';
import toast from 'react-hot-toast';

type TabId = 'performance' | 'activity' | 'conversions' | 'followups' | 'rejected';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'performance', label: 'Performance', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'activity', label: 'Daily Activity', icon: <Activity className="w-4 h-4" /> },
  { id: 'conversions', label: 'Conversions', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'followups', label: 'Pending Follow-Ups', icon: <CalendarClock className="w-4 h-4" /> },
  { id: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
];

const REJECTION_LABELS: Record<RejectionReason, string> = {
  not_interested: 'Not Interested',
  budget_constraint: 'Budget Constraint',
  competitor_chosen: 'Chose Competitor',
  wrong_contact: 'Wrong Contact',
  duplicate: 'Duplicate',
  no_response: 'No Response',
  other: 'Other',
};

export default function SalesReportsPage() {
  const [tab, setTab] = useState<TabId>('performance');
  const [loading, setLoading] = useState(false);

  const [perfData, setPerfData] = useState<Array<SalesUser & { stats: { totalAssigned: number; converted: number; rejected: number; conversionRate: number; todayActivities: number } }>>([]);
  const [activityData, setActivityData] = useState<SalesActivity[]>([]);
  const [conversionsData, setConversionsData] = useState<SalesClient[]>([]);
  const [followUpsData, setFollowUpsData] = useState<SalesFollowUp[]>([]);
  const [rejectedData, setRejectedData] = useState<SalesClient[]>([]);

  const [filterExec, setFilterExec] = useState('');
  const [executives, setExecutives] = useState<SalesUser[]>([]);

  useEffect(() => {
    salesExecutivesAPI.list({ pageSize: 100 }).then((r) => setExecutives(r.data.data)).catch(() => null);
  }, []);

  useEffect(() => {
    setLoading(true);
    const p: Promise<void> = (() => {
      switch (tab) {
        case 'performance':
          return salesReportsAPI.executivePerformance().then((r) => setPerfData(r.data)).catch(() => { toast.error('Failed to load'); });
        case 'activity':
          return salesReportsAPI.dailyActivity({ executiveId: filterExec || undefined }).then((r) => setActivityData(r.data)).catch(() => { toast.error('Failed to load'); });
        case 'conversions':
          return salesReportsAPI.conversions().then((r) => setConversionsData(r.data)).catch(() => { toast.error('Failed to load'); });
        case 'followups':
          return salesReportsAPI.pendingFollowUps().then((r) => setFollowUpsData(r.data)).catch(() => { toast.error('Failed to load'); });
        case 'rejected':
          return salesReportsAPI.rejected().then((r) => setRejectedData(r.data)).catch(() => { toast.error('Failed to load'); });
      }
    })();
    p.finally(() => setLoading(false));
  }, [tab, filterExec]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-gray-400 text-sm mt-0.5">Sales analytics and insights</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      {(tab === 'activity') && (
        <div className="flex gap-3">
          <select
            value={filterExec}
            onChange={(e) => setFilterExec(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          >
            <option value="">All Executives</option>
            {executives.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          {tab === 'performance' && (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500">
                  {['Executive', 'Assigned', 'Converted', 'Rejected', 'In Progress', 'Rate'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {perfData.map((exec) => (
                  <tr key={exec.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {exec.name.charAt(0)}
                        </div>
                        <span className="text-white">{exec.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{exec.stats.totalAssigned}</td>
                    <td className="px-4 py-3 text-emerald-300">{exec.stats.converted}</td>
                    <td className="px-4 py-3 text-red-300">{exec.stats.rejected}</td>
                    <td className="px-4 py-3 text-blue-300">{exec.stats.totalAssigned - exec.stats.converted - exec.stats.rejected}</td>
                    <td className="px-4 py-3">
                      <span className="text-violet-300 font-medium">{exec.stats.conversionRate.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'activity' && (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500">
                  {['Executive', 'Client', 'Type', 'Note', 'Time'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activityData.map((a) => (
                  <tr key={a.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white">{a.executiveName}</td>
                    <td className="px-4 py-3 text-gray-400">{a.clientId}</td>
                    <td className="px-4 py-3">
                      <span className="bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full text-xs">{a.type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{a.note}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{format.dateTime(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'conversions' && (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500">
                  {['Client', 'Phone', 'Executive', 'Converted On'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {conversionsData.map((c) => (
                  <tr key={c.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{c.phone}</td>
                    <td className="px-4 py-3 text-gray-400">{c.assignedTo?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-emerald-300 text-xs">{c.convertedAt ? format.date(c.convertedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'followups' && (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500">
                  {['Client', 'Executive', 'Scheduled', 'Note'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {followUpsData.map((fu) => (
                  <tr key={fu.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white">{fu.client.name}</p>
                      <p className="text-gray-500 text-xs">{fu.client.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fu.executiveName}</td>
                    <td className="px-4 py-3 text-yellow-300 text-xs">{format.dateTime(fu.scheduledAt)}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{fu.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'rejected' && (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500">
                  {['Client', 'Phone', 'Executive', 'Reason', 'Stage'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rejectedData.map((c) => (
                  <tr key={c.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{c.phone}</td>
                    <td className="px-4 py-3 text-gray-400">{c.assignedTo?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {c.rejectionReason ? (
                        <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full text-xs">
                          {REJECTION_LABELS[c.rejectionReason]}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStageBadgeClass(c.stage)}>{c.stage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Empty state */}
          {((tab === 'performance' && perfData.length === 0) ||
            (tab === 'activity' && activityData.length === 0) ||
            (tab === 'conversions' && conversionsData.length === 0) ||
            (tab === 'followups' && followUpsData.length === 0) ||
            (tab === 'rejected' && rejectedData.length === 0)) && !loading && (
            <div className="text-center py-16 text-gray-500">No data available</div>
          )}
        </div>
      )}
    </div>
  );
}
