import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, RefreshCw, TrendingUp, Activity, XCircle, Calendar } from 'lucide-react';
import { AdminLayout } from '../../../components/layouts';
import SalesCrmSubNav from './SalesCrmSubNav';
import {
  adminGetPerformanceReport,
  adminGetDailyActivity,
  adminGetConversionsReport,
  adminGetPendingFollowUps,
  adminGetRejectedReport,
  adminListManagers,
} from '../../../services/salesService';

const TABS = [
  { id: 'performance', label: 'Performance',    icon: TrendingUp },
  { id: 'activity',    label: 'Daily Activity',  icon: Activity   },
  { id: 'conversions', label: 'Conversions',     icon: TrendingUp },
  { id: 'followups',   label: 'Follow-Ups',      icon: Calendar   },
  { id: 'rejected',    label: 'Rejected Leads',  icon: XCircle    },
];

const inputCls = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none bg-white';

const TableShell = ({ heads, children, empty }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {heads.map((h) => (
            <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
    {empty && (
      <div className="text-center py-12 text-gray-400 text-sm">{empty}</div>
    )}
  </div>
);

// ── Performance ───────────────────────────────────────────────────────────────
const PerformanceTab = ({ managerId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    adminGetPerformanceReport(managerId ? { managerId } : {})
      .then((res) => setRows(res.data?.data || res.data || []))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [managerId]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7e22ce]" /></div>;
  if (error)   return <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"><AlertCircle size={15} />{error}</div>;

  return (
    <TableShell
      heads={['Executive', 'Picked', 'Contacted', 'Converted', 'Rejected', 'Pending FU']}
      empty={rows.length === 0 ? 'No data available' : null}
    >
      {rows.map((r) => (
        <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50 transition">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#7e22ce] text-sm font-bold">
                {r.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-400">{r.email}</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 text-gray-700 font-medium">{r.picked}</td>
          <td className="px-6 py-4 text-blue-600">{r.contacted}</td>
          <td className="px-6 py-4 font-semibold text-green-600">{r.converted}</td>
          <td className="px-6 py-4 text-red-500">{r.rejected}</td>
          <td className="px-6 py-4 text-yellow-600">{r.pending}</td>
        </tr>
      ))}
    </TableShell>
  );
};

// ── Daily Activity ────────────────────────────────────────────────────────────
const ActivityTab = ({ managerId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const ICONS = { call: '📞', message: '💬', email: '📧', meeting: '🤝', 'follow-up': '📅', note: '📝' };

  const load = useCallback(() => {
    setLoading(true);
    adminGetDailyActivity({ date, ...(managerId ? { managerId } : {}) })
      .then((res) => setRows(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date, managerId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={13} /> Refresh
        </button>
        <span className="text-sm text-gray-400">{rows.length} activities</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7e22ce]" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No activity recorded on this date</div>
      ) : (
        <div className="space-y-2">
          {rows.map((act) => (
            <div key={act._id} className="flex items-start gap-3 px-4 py-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition">
              <span className="text-lg flex-shrink-0">{ICONS[act.activityType] || '📝'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{act.clientId?.customerName || 'Unknown'}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-[#7e22ce] border border-purple-100">{act.stage}</span>
                </div>
                {act.note && <p className="text-xs text-gray-400 mt-0.5">{act.note}</p>}
                <p className="text-xs text-gray-300 mt-1">by {act.executiveId?.name} · {new Date(act.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Conversions ───────────────────────────────────────────────────────────────
const ConversionsTab = ({ managerId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminGetConversionsReport({
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo   ? { dateTo }   : {}),
      ...(managerId ? { managerId } : {}),
    })
      .then((res) => setRows(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, managerId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" className={inputCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" className={inputCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw size={13} /> Apply
        </button>
        <span className="text-sm text-gray-400">{rows.length} conversions</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7e22ce]" /></div>
      ) : (
        <TableShell
          heads={['Customer', 'Phone', 'City', 'Assigned To', 'Converted On']}
          empty={rows.length === 0 ? 'No conversions found for the selected range' : null}
        >
          {rows.map((c) => (
            <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50 transition">
              <td className="px-6 py-4 font-medium text-gray-900">{c.customerName}</td>
              <td className="px-6 py-4 text-gray-500">{c.phoneNumber}</td>
              <td className="px-6 py-4 text-gray-400">{c.city || '—'}</td>
              <td className="px-6 py-4 text-gray-500">{c.assignedTo?.name || '—'}</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
};

// ── Follow-Ups ────────────────────────────────────────────────────────────────
const FollowUpsTab = ({ managerId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminGetPendingFollowUps(managerId ? { managerId } : {})
      .then((res) => setRows(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [managerId]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7e22ce]" /></div>;
  if (rows.length === 0) return <div className="text-center py-12 text-gray-400 text-sm">No pending follow-ups</div>;

  return (
    <div className="space-y-3">
      {rows.map((entry) => (
        <div key={entry.executiveId} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition">
          <p className="text-sm font-medium text-gray-800">{entry.executiveName}</p>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
              {entry.overdueCount} overdue
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
              {entry.upcomingCount} upcoming
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Rejected ──────────────────────────────────────────────────────────────────
const RejectedTab = ({ managerId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminGetRejectedReport(managerId ? { managerId } : {})
      .then((res) => setRows(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [managerId]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7e22ce]" /></div>;

  return (
    <TableShell
      heads={['Customer', 'Phone', 'Rejection Reason', 'Assigned To', 'Date']}
      empty={rows.length === 0 ? 'No rejected leads' : null}
    >
      {rows.map((c) => (
        <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50 transition">
          <td className="px-6 py-4 font-medium text-gray-900">{c.customerName}</td>
          <td className="px-6 py-4 text-gray-500">{c.phoneNumber}</td>
          <td className="px-6 py-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
              {c.rejectionReason || '—'}
            </span>
          </td>
          <td className="px-6 py-4 text-gray-400">{c.assignedTo?.name || '—'}</td>
          <td className="px-6 py-4 text-gray-400 text-xs">{new Date(c.updatedAt).toLocaleDateString()}</td>
        </tr>
      ))}
    </TableShell>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminSalesReportsPage = () => {
  const [activeTab, setActiveTab]       = useState('performance');
  const [managers, setManagers]         = useState([]);
  const [filterManagerId, setFilterManagerId] = useState('');

  useEffect(() => {
    adminListManagers()
      .then((res) => {
        const d = res.data?.data || res.data;
        setManagers(d?.managers || d || []);
      })
      .catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SalesCrmSubNav />
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
            <p className="text-muted-foreground mt-1">Full visibility across all teams</p>
          </div>
          {managers.length > 0 && (
            <select
              value={filterManagerId}
              onChange={(e) => setFilterManagerId(e.target.value)}
              className={inputCls}
            >
              <option value="">All Managers</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-[#7e22ce] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6">
            {activeTab === 'performance' && <PerformanceTab  managerId={filterManagerId} />}
            {activeTab === 'activity'    && <ActivityTab     managerId={filterManagerId} />}
            {activeTab === 'conversions' && <ConversionsTab  managerId={filterManagerId} />}
            {activeTab === 'followups'   && <FollowUpsTab    managerId={filterManagerId} />}
            {activeTab === 'rejected'    && <RejectedTab     managerId={filterManagerId} />}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSalesReportsPage;
