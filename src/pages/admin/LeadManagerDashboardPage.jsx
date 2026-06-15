/**
 * Service Manager Dashboard
 * Stats cards + charts + provider table + individual provider detail panel
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLMSummary, fetchLMMonthly, fetchLMSourceBreakdown,
  fetchLMProviders, fetchLMRecentActivity, fetchLMProviderDetail,
} from '@/store/slices/leadManagerAnalyticsSlice';
import { assignLeadCredits } from '@/store/slices/leadSlice';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import {
  Users, FileText, Mail, CreditCard, Unlock, Activity,
  RefreshCw, TrendingUp, ChevronRight, X, Lock, CheckCircle,
  ArrowLeft, Search, ChevronLeft, Plus, Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ── helpers ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
);

const SourceBadge = ({ source }) => {
  const MAP = {
    dpr_generation:  { label: 'DPR Auto', cls: 'bg-green-100 text-green-700'   },
    form_submission: { label: 'Form',     cls: 'bg-blue-100 text-blue-700'     },
    manual:          { label: 'Manual',   cls: 'bg-purple-100 text-purple-700' },
  };
  const { label, cls } = MAP[source] || { label: source, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
};

const StatusBadge = ({ status }) => {
  const MAP = {
    free:   'bg-green-100 text-green-700',
    paid:   'bg-blue-100 text-blue-700',
    locked: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${MAP[status] || ''}`}>
      {status}
    </span>
  );
};

const BAR_OPTS = {
  responsive: true,
  plugins: { legend: { position: 'top' } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};
const DONUT_OPTS = { responsive: true, plugins: { legend: { position: 'bottom' } } };

// ── Provider Detail Panel ──────────────────────────────────────────────────
const ProviderDetailPanel = ({ onClose }) => {
  const { providerDetail, detailLoading } = useSelector(s => s.lmAnalytics);

  if (detailLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  );
  if (!providerDetail) return null;

  const { provider, stats, monthly, serviceBreakdown, recentActivity } = providerDetail;

  const barData = {
    labels: monthly.labels,
    datasets: [
      { label: 'DPR Auto',  data: monthly.dprData,  backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 4 },
      { label: 'Form',      data: monthly.formData, backgroundColor: 'rgba(16,185,129,0.7)',  borderRadius: 4 },
    ],
  };

  const serviceBarData = serviceBreakdown.length ? {
    labels: serviceBreakdown.map(s => s.name),
    datasets: [{
      label: 'Notifications',
      data: serviceBreakdown.map(s => s.count),
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderRadius: 4,
    }],
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">{provider.name}</h2>
          <p className="text-gray-500 text-sm">{provider.email}</p>
        </div>
        <StatusBadge status={provider.status} />
        {provider.isActive
          ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
          : <span className="flex items-center gap-1 text-red-500 text-xs"><X className="h-3.5 w-3.5" /> Inactive</span>
        }
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent',    value: stats.total,     color: 'bg-purple-500', icon: Mail       },
          { label: 'This Month',    value: stats.thisMonth, color: 'bg-blue-500',   icon: TrendingUp },
          { label: 'DPR Auto',      value: stats.dprLeads,  color: 'bg-green-500',  icon: FileText   },
          { label: 'Form Leads',    value: stats.formLeads, color: 'bg-orange-500', icon: Activity   },
        ].map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Credit info */}
      <div className="bg-white rounded-xl border p-5 flex items-center gap-6">
        <div>
          <p className="text-sm text-gray-500">Free Leads Used</p>
          <p className="text-2xl font-bold">{provider.freeLeadsUsed} <span className="text-sm text-gray-400">/ 3</span></p>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <p className="text-sm text-gray-500">Credits Remaining</p>
          <p className="text-2xl font-bold">{provider.creditsRemaining}</p>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <p className="text-sm text-gray-500">Linked Services</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {provider.services?.length
              ? provider.services.map(s => (
                <span key={s._id} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.name}</span>
              ))
              : <span className="text-gray-400 text-sm">None</span>
            }
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">Monthly Notifications (Last 6 Months)</h3>
          <Bar data={barData} options={BAR_OPTS} />
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">By Service</h3>
          {serviceBarData
            ? <Bar data={serviceBarData} options={BAR_OPTS} />
            : <div className="flex items-center justify-center h-40 text-gray-400">No data</div>
          }
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold">Recent Notifications</h3>
        </div>
        <div className="divide-y">
          {recentActivity.length === 0
            ? <div className="text-center py-8 text-gray-400">No activity yet</div>
            : recentActivity.map((r, i) => (
              <div key={r._id || i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.service?.name || '—'}</p>
                  <p className="text-xs text-gray-400">
                    {r.dpr?.client_name ? `Client: ${r.dpr.client_name} · ` : ''}
                    {r.receivedAt ? new Date(r.receivedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                  </p>
                </div>
                <SourceBadge source={r.source} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 10;

// ── Main Dashboard ─────────────────────────────────────────────────────────
const LeadManagerDashboardPage = () => {
  const dispatch = useDispatch();
  const { summary, monthly, sourceBreakdown, providers, recentActivity, loading } =
    useSelector(s => s.lmAnalytics);

  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [providerSearch, setProviderSearch]         = useState('');
  const [providerPage, setProviderPage]             = useState(1);

  // Credits modal state
  const [creditModal, setCreditModal]   = useState(null); // { id, name, current }
  const [creditInput, setCreditInput]   = useState('');
  const [creditAction, setCreditAction] = useState('add'); // 'add' | 'set'
  const [creditSaving, setCreditSaving] = useState(false);

  const openCreditModal = (e, p) => {
    e.stopPropagation(); // don't trigger row click → detail panel
    setCreditModal({ id: p.id, name: p.name, current: p.creditsRemaining ?? 0 });
    setCreditInput('');
    setCreditAction('add');
  };

  const handleSaveCredits = async () => {
    const val = parseInt(creditInput, 10);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid number'); return; }
    setCreditSaving(true);
    try {
      await dispatch(assignLeadCredits({ id: creditModal.id, credits: val, action: creditAction })).unwrap();
      toast.success(`Credits updated for ${creditModal.name}`);
      setCreditModal(null);
      dispatch(fetchLMProviders()); // refresh table
      dispatch(fetchLMSummary());   // refresh stat cards
    } catch (err) {
      toast.error(err || 'Failed to update credits');
    } finally {
      setCreditSaving(false);
    }
  };

  const loadAll = () => {
    dispatch(fetchLMSummary());
    dispatch(fetchLMMonthly());
    dispatch(fetchLMSourceBreakdown());
    dispatch(fetchLMProviders());
    dispatch(fetchLMRecentActivity());
  };

  useEffect(() => { loadAll(); }, []);

  const handleProviderClick = (id) => {
    setSelectedProviderId(id);
    dispatch(fetchLMProviderDetail(id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── chart data ─────────────────────────────────────────────────────────
  const barData = monthly ? {
    labels: monthly.labels,
    datasets: [
      { label: 'DPR Auto',  data: monthly.dprData,  backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 4 },
      { label: 'Form',      data: monthly.formData, backgroundColor: 'rgba(16,185,129,0.7)',  borderRadius: 4 },
    ],
  } : null;

  const doughnutData = sourceBreakdown ? {
    labels: ['DPR Auto', 'Form', 'Manual'],
    datasets: [{
      data: [sourceBreakdown.dpr_generation, sourceBreakdown.form_submission, sourceBreakdown.manual],
      backgroundColor: ['rgba(124,58,237,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)'],
      borderWidth: 2,
    }],
  } : null;

  const providerBarData = providers.length ? {
    labels: providers.map(p => p.name),
    datasets: [{
      label: 'Total Notifications',
      data: providers.map(p => p.totalLeadsReceived),
      backgroundColor: providers.map(p =>
        p.status === 'locked' ? 'rgba(239,68,68,0.7)' :
        p.status === 'paid'   ? 'rgba(59,130,246,0.7)' :
                                'rgba(124,58,237,0.7)'
      ),
      borderRadius: 4,
    }],
  } : null;

  const lockedCount = providers.filter(p => p.status === 'locked').length;
  const freeCount   = providers.filter(p => p.status === 'free').length;
  const paidCount   = providers.filter(p => p.status === 'paid').length;

  // ── Provider detail view ───────────────────────────────────────────────
  if (selectedProviderId) {
    return (
      <AdminLayout>
        <div className="pb-10">
          <ProviderDetailPanel onClose={() => setSelectedProviderId(null)} />
        </div>
      </AdminLayout>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Manager Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of all notifications, providers and credits</p>
          </div>
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Sent"      value={summary?.totalLeadsShared}                 sub="All time"             icon={Mail}       color="bg-purple-500" />
          <StatCard label="DPR Auto"        value={summary?.bySource?.dpr_generation   ?? 0}  sub="DPR triggers"         icon={FileText}   color="bg-green-500"  />
          <StatCard label="Form Leads"      value={summary?.bySource?.form_submission   ?? 0}  sub="Contact forms"        icon={Activity}   color="bg-blue-500"   />
          <StatCard label="Providers"       value={providers.length}                           sub={`${freeCount} free · ${paidCount} paid · ${lockedCount} locked`} icon={Users} color="bg-indigo-500" />
          <StatCard label="Free Used"       value={summary?.freeLeadsUsed}                     sub="Across all providers" icon={Unlock}     color="bg-teal-500"   />
          <StatCard label="Credits Left"    value={summary?.totalCreditsRemaining}             sub="Paid credits"         icon={CreditCard} color="bg-orange-500" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h2 className="font-semibold text-lg">Monthly Notifications (Last 6 Months)</h2>
            </div>
            {barData
              ? <Bar data={barData} options={BAR_OPTS} />
              : <div className="flex items-center justify-center h-48 text-gray-400">No data yet</div>
            }
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-lg">Lead Source Split</h2>
            </div>
            {doughnutData ? (
              <div className="flex flex-col items-center">
                <div className="w-48 h-48"><Doughnut data={doughnutData} options={DONUT_OPTS} /></div>
                <div className="mt-4 space-y-1 w-full">
                  {[
                    { label: 'DPR Auto', val: sourceBreakdown?.dpr_generation  ?? 0, cls: 'bg-purple-500' },
                    { label: 'Form',     val: sourceBreakdown?.form_submission  ?? 0, cls: 'bg-green-500'  },
                    { label: 'Manual',   val: sourceBreakdown?.manual           ?? 0, cls: 'bg-amber-500'  },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${cls}`} />
                        <span className="text-gray-600">{label}</span>
                      </div>
                      <span className="font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="flex items-center justify-center h-48 text-gray-400">No data yet</div>}
          </div>
        </div>

        {/* Per provider bar */}
        {providerBarData && (
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-lg">Notifications Per Service Provider</h2>
              <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Free</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500  inline-block" /> Paid</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500   inline-block" /> Locked</span>
              </div>
            </div>
            <Bar data={providerBarData} options={BAR_OPTS} />
          </div>
        )}

        {/* Recent activity — full width */}
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold">Recent Notifications</h2>
          </div>
          <div className="divide-y overflow-y-auto max-h-72">
            {recentActivity.length === 0
              ? <div className="text-center py-8 text-gray-400">No activity yet</div>
              : recentActivity.map((r, i) => (
                <div key={r._id || i} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.lead?.name || '—'}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {r.service?.name || '—'}
                      {r.dpr?.client_name ? ` · ${r.dpr.client_name}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.receivedAt ? new Date(r.receivedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                    </p>
                  </div>
                  <SourceBadge source={r.source} />
                </div>
              ))
            }
          </div>
        </div>

        {/* ── Service Provider Status — full-width table with search + pagination ── */}
        {(() => {
          const filtered = providers.filter(p =>
            !providerSearch ||
            p.name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
            p.email?.toLowerCase().includes(providerSearch.toLowerCase())
          );
          const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          const safePage   = Math.min(providerPage, totalPages);
          const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

          return (
            <div className="bg-white rounded-xl border">
              {/* Table header */}
              <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <h2 className="font-semibold">Service Provider Status</h2>
                  <span className="text-xs text-gray-400 ml-1">({filtered.length} providers)</span>
                </div>
                <div className="sm:ml-auto relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={providerSearch}
                    onChange={e => { setProviderSearch(e.target.value); setProviderPage(1); }}
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">#</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Provider</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">DPR Auto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Form</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Free Used</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Credits</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Assign Credits</th>
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-gray-400">
                          {providerSearch ? `No providers match "${providerSearch}"` : 'No providers yet'}
                        </td>
                      </tr>
                    ) : paginated.map((p, idx) => (
                      <tr
                        key={p.id}
                        onClick={() => handleProviderClick(p.id)}
                        className="border-b hover:bg-purple-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {(safePage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.email}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold">{p.totalLeadsReceived ?? 0}</td>
                        <td className="py-3 px-4 text-green-700 font-medium">{p.dprLeads  ?? 0}</td>
                        <td className="py-3 px-4 text-blue-700  font-medium">{p.formLeads ?? 0}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {p.freeLeadsUsed ?? 0} <span className="text-gray-400">/ 3</span>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <span className={p.creditsRemaining > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
                            {p.creditsRemaining ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => openCreditModal(e, p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                          >
                            <CreditCard className="h-3 w-3" /> Credits
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setProviderPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                      <button
                        key={pg}
                        onClick={() => setProviderPage(pg)}
                        className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                          pg === safePage
                            ? 'bg-purple-600 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      onClick={() => setProviderPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* ── Assign Credits Modal ─────────────────────────────────────────── */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assign Credits</h3>
                <p className="text-sm text-gray-500 mt-0.5">{creditModal.name}</p>
              </div>
              <button onClick={() => setCreditModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Current credits info */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Credits</span>
              <span className="text-2xl font-bold text-purple-600">{creditModal.current}</span>
            </div>

            {/* Action toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setCreditAction('add')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                  creditAction === 'add' ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Plus className="h-4 w-4" /> Add Credits
              </button>
              <button
                onClick={() => setCreditAction('set')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                  creditAction === 'set' ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Minus className="h-4 w-4" /> Set Credits
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {creditAction === 'add' ? 'Credits to Add' : 'Set Total Credits To'}
              </label>
              <input
                type="number"
                min="0"
                value={creditInput}
                onChange={e => setCreditInput(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-lg font-semibold"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveCredits()}
              />
              {creditInput && !isNaN(parseInt(creditInput, 10)) && (
                <p className="text-xs text-gray-400 mt-1">
                  {creditAction === 'add'
                    ? `New total: ${creditModal.current + parseInt(creditInput, 10)} credits`
                    : `Will be set to: ${parseInt(creditInput, 10)} credits`
                  }
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setCreditModal(null)}
                className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredits}
                disabled={creditSaving || !creditInput}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creditSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default LeadManagerDashboardPage;
