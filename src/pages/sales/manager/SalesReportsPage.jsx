import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  getPerformanceReport,
  getDailyActivityReport,
  getConversionsReport,
  getPendingFollowUpsReport,
  getRejectedReport,
  listExecutives,
  STAGE_COLORS,
} from '../../../services/salesService';

const TABS = ['Performance', 'Daily Activity', 'Conversions', 'Pending Follow-Ups', 'Rejected'];

const thCls = 'text-left px-4 py-3 text-gray-500 font-medium text-xs';
const tdCls = 'px-4 py-3 text-gray-700 text-sm';

const Table = ({ headers, rows, empty = 'No data yet' }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          {headers.map((h) => <th key={h} className={thCls}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} className="text-center py-12 text-gray-400 text-sm">{empty}</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
            {row.map((cell, j) => <td key={j} className={tdCls}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DateInput = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
    />
  </div>
);

const today = () => new Date().toISOString().slice(0, 10);
const monthAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

const SalesReportsPage = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [executives, setExecutives] = useState([]);

  // Daily activity filters
  const [dailyDate, setDailyDate] = useState(today());
  const [dailyExec, setDailyExec] = useState('');

  // Conversions filters
  const [convFrom, setConvFrom] = useState(monthAgo());
  const [convTo, setConvTo] = useState(today());

  useEffect(() => {
    listExecutives().then((res) => setExecutives(res.data.executives || res.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');
    setData(null);
    const loaders = [
      () => getPerformanceReport(),
      () => getDailyActivityReport(dailyDate, dailyExec || undefined),
      () => getConversionsReport({ from: convFrom, to: convTo }),
      () => getPendingFollowUpsReport(),
      () => getRejectedReport(),
    ];
    loaders[tab]()
      .then((res) => setData(res.data))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [tab, dailyDate, dailyExec, convFrom, convTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderContent = () => {
    if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;
    if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle size={15} />{error}</div>;

    switch (tab) {
      case 0: {
        const rows = (data?.executives || data || []).map((ex) => [
          ex.name || ex.executiveName,
          ex.picked || 0,
          ex.contacted || 0,
          ex.converted || 0,
          ex.rejected || 0,
          ex.pending || 0,
        ]);
        return <Table headers={['Executive', 'Picked', 'Contacted', 'Converted', 'Rejected', 'Pending']} rows={rows} />;
      }
      case 1: {
        const activities = data?.activities || data || [];
        return (
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">No activity on this date</p>
            ) : activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-700 text-xs font-bold">{a.activityType?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm">{a.note}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {a.executiveId?.name || a.executiveName} · {a.clientId?.customerName || a.clientName} · {new Date(a.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                {a.stage && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STAGE_COLORS[a.stage] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {a.stage}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      }
      case 2: {
        const items = data?.clients || data || [];
        const rows = items.map((c) => [
          c.customerName,
          c.phoneNumber,
          c.assignedTo?.name || '—',
          c.city || '—',
          new Date(c.updatedAt).toLocaleDateString(),
        ]);
        return <Table headers={['Customer', 'Phone', 'Executive', 'City', 'Converted On']} rows={rows} />;
      }
      case 3: {
        const grouped = data?.byExecutive || data || [];
        return (
          <div className="space-y-5">
            {grouped.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">No pending follow-ups</p>
            ) : grouped.map((group, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 px-1">{group.executiveName || group.name}</h3>
                <div className="space-y-1.5">
                  {(group.followUps || group.items || []).map((f, j) => {
                    const daysOverdue = Math.floor((Date.now() - new Date(f.followUpDate)) / 86400000);
                    return (
                      <div key={j} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-gray-800 text-sm">{f.clientId?.customerName || f.clientName}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{f.purpose}</p>
                        </div>
                        {daysOverdue > 0 && (
                          <span className="text-red-400 text-xs font-medium">{daysOverdue}d overdue</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      }
      case 4: {
        const items = data?.clients || data || [];
        const rows = items.map((c) => [
          c.customerName,
          c.assignedTo?.name || '—',
          c.rejectionReason || '—',
          new Date(c.updatedAt).toLocaleDateString(),
        ]);
        return <Table headers={['Customer', 'Executive', 'Rejection Reason', 'Date']} rows={rows} />;
      }
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sales performance analytics</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              tab === i ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters for certain tabs */}
      {tab === 1 && (
        <div className="flex flex-wrap gap-4 items-end p-4 bg-gray-50 border border-gray-100 rounded-xl">
          <DateInput label="Date" value={dailyDate} onChange={setDailyDate} />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Executive (optional)</label>
            <select
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              value={dailyExec}
              onChange={(e) => setDailyExec(e.target.value)}
            >
              <option value="">All executives</option>
              {executives.map((ex) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
            </select>
          </div>
        </div>
      )}
      {tab === 2 && (
        <div className="flex flex-wrap gap-4 items-end p-4 bg-gray-50 border border-gray-100 rounded-xl">
          <DateInput label="From" value={convFrom} onChange={setConvFrom} />
          <DateInput label="To" value={convTo} onChange={setConvTo} />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-2 shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};

export default SalesReportsPage;
