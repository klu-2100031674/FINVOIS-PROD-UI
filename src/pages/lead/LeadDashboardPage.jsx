import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutLead } from '@/store/slices/leadAuthSlice';
import {
  fetchLeadAnalytics,
  fetchMonthlyLeads,
  fetchServiceWiseLeads,
  fetchTrendComparison,
  fetchSourceWise,
  fetchRecentActivity,
  fetchSubmissions
} from '@/store/slices/leadAnalyticsSlice';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  LogOut, TrendingUp, TrendingDown, Users, Calendar,
  FileText, Zap, Activity, Clock, ArrowUpRight, ArrowDownRight,
  Search, ChevronLeft, ChevronRight, LayoutDashboard, Table2,
  RefreshCw, Filter
} from 'lucide-react';
import finvoisLogo from '@/assets/finvois.png';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

// ── Chart options ──────────────────────────────────────────────────────────────
const chartBase = {
  responsive: true, maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 10, cornerRadius: 8 }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } }, beginAtZero: true }
  }
};
const doughnutOpts = {
  responsive: true, maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } },
    tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 10, cornerRadius: 8 }
  }
};
const lineOpts = {
  ...chartBase,
  plugins: {
    ...chartBase.plugins,
    legend: { position: 'top', labels: { padding: 16, font: { size: 12 }, usePointStyle: true } }
  }
};

// ── Small helpers ──────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const relTime = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const SOURCE_LABELS = { form_submission: 'Form Submission', dpr_generation: 'DPR Generation' };

// ── Reusable sub-components ────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, badge, badgeColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-bold text-gray-900 leading-none">{value ?? 0}</p>
      {badge !== undefined && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeColor}`}>{badge}</span>
      )}
    </div>
  </div>
);

const EmptyChart = () => (
  <div className="flex flex-col items-center justify-center py-14 gap-2">
    <Activity className="h-8 w-8 text-gray-200" />
    <p className="text-sm text-gray-400">No data available yet</p>
  </div>
);

const EmptyTable = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <FileText className="h-10 w-10 text-gray-200" />
    <p className="text-base font-medium text-gray-400">No submissions found</p>
    <p className="text-sm text-gray-400">Form submissions will appear here once received.</p>
  </div>
);

// ── Submission detail modal ────────────────────────────────────────────────────
const SubmissionModal = ({ submission, onClose }) => {
  if (!submission) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{submission.service}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(submission.receivedAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              submission.source === 'form_submission'
                ? 'bg-indigo-50 text-indigo-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              {SOURCE_LABELS[submission.source] || submission.source}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">✕</button>
          </div>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-3">
          {submission.fields.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No field data recorded.</p>
          ) : (
            submission.fields.map((f, i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold text-gray-500 w-36 shrink-0 pt-0.5">{f.label}</span>
                <span className="text-sm text-gray-900 break-all">{String(f.value)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
const LeadDashboardPage = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { user }  = useSelector(s => s.leadAuth);
  const {
    summary, monthlyData, serviceWiseData, trendData,
    sourceWiseData, recentActivity, submissions, loading
  } = useSelector(s => s.leadAnalytics);

  const [activeTab,  setActiveTab]  = useState('overview');  // 'overview' | 'submissions'
  const [search,     setSearch]     = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState(null);

  // fetch overview data
  useEffect(() => {
    if (!user?.id) return;
    const id   = user.id;
    const year = new Date().getFullYear().toString();
    dispatch(fetchLeadAnalytics(id));
    dispatch(fetchMonthlyLeads({ leadId: id, year }));
    dispatch(fetchServiceWiseLeads(id));
    dispatch(fetchTrendComparison(id));
    dispatch(fetchSourceWise(id));
    dispatch(fetchRecentActivity(id));
  }, [dispatch, user?.id]);

  // fetch submissions whenever tab/page/filter changes
  const loadSubmissions = useCallback(() => {
    if (!user?.id) return;
    dispatch(fetchSubmissions({ leadId: user.id, page, limit: 20, source: sourceFilter, search }));
  }, [dispatch, user?.id, page, sourceFilter, search]);

  useEffect(() => {
    if (activeTab === 'submissions') loadSubmissions();
  }, [activeTab, loadSubmissions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadSubmissions();
  };

  const handleLogout = () => { dispatch(logoutLead()); navigate('/auth'); };

  const trend = summary ? {
    diff: summary.leadsThisMonth - summary.leadsLastMonth,
    percent: summary.leadsLastMonth > 0
      ? Math.abs(((summary.leadsThisMonth - summary.leadsLastMonth) / summary.leadsLastMonth) * 100).toFixed(1)
      : summary.leadsThisMonth > 0 ? '100' : '0',
    isPositive: summary.leadsThisMonth >= summary.leadsLastMonth
  } : null;

  const totalForms = sourceWiseData?.datasets?.[0]?.data?.[0] ?? 0;
  const totalDPR   = sourceWiseData?.datasets?.[0]?.data?.[1] ?? 0;
  const avgPerMonth = summary?.totalLeads && monthlyData?.labels?.length > 0
    ? (summary.totalLeads / monthlyData.labels.length).toFixed(1) : '—';
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'L';

  const totalPages = Math.ceil((submissions.total || 0) / 20);

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={finvoisLogo} alt="Finvois" className="h-9 w-auto" />
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Lead Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-purple-700">{initials}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-none">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-gray-100">
          {[
            { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
            { id: 'submissions',  label: 'Submissions',  icon: Table2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'submissions' && submissions.total > 0 && (
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {submissions.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <h2 className="text-2xl font-bold font-['Manrope']">
                  Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
                </h2>
                <p className="text-purple-200 text-sm mt-1">
                  Here's your lead activity overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-purple-200 text-xs">Avg leads / month</p>
                <p className="text-4xl font-bold">{avgPerMonth}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
                  <p className="text-sm text-gray-500 mt-3">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {/* 5 stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatCard label="Total Leads"       value={summary?.totalLeads}      icon={Users}        iconBg="bg-purple-50"  iconColor="text-purple-600" />
                  <StatCard label="This Month"        value={summary?.leadsThisMonth}  icon={Calendar}     iconBg="bg-blue-50"    iconColor="text-blue-600"
                    badge={trend ? `${trend.isPositive ? '▲' : '▼'} ${trend.percent}%` : undefined}
                    badgeColor={trend?.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} />
                  <StatCard label="Last Month"        value={summary?.leadsLastMonth}  icon={trend?.isPositive ? TrendingUp : TrendingDown}
                    iconBg={trend?.isPositive ? 'bg-green-50' : 'bg-red-50'}  iconColor={trend?.isPositive ? 'text-green-600' : 'text-red-500'} />
                  <StatCard label="Form Submissions"  value={totalForms}               icon={FileText}     iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
                  <StatCard label="DPR Generated"     value={totalDPR}                 icon={Zap}          iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                </div>

                {/* Monthly bar + Source doughnut */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-800">Monthly Lead Volume</h3>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{new Date().getFullYear()}</span>
                    </div>
                    {monthlyData?.labels?.length > 0 ? (
                      <Bar data={{ ...monthlyData, datasets: [{ ...monthlyData.datasets[0], backgroundColor: 'rgba(124,58,237,0.15)', borderColor: 'rgb(124,58,237)', borderWidth: 2, borderRadius: 6, hoverBackgroundColor: 'rgba(124,58,237,0.35)' }] }} options={chartBase} />
                    ) : <EmptyChart />}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Lead Source Breakdown</h3>
                    {sourceWiseData?.datasets?.[0]?.data?.some(v => v > 0) ? (
                      <Doughnut data={sourceWiseData} options={doughnutOpts} />
                    ) : <EmptyChart />}
                  </div>
                </div>

                {/* Trend + Service doughnut */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">This Month vs Last Month (Daily)</h3>
                    {trendData?.labels?.length > 0 ? (
                      <Line data={{ ...trendData, datasets: trendData.datasets.map((ds, i) => ({ ...ds, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, backgroundColor: i === 0 ? 'rgba(124,58,237,0.08)' : 'rgba(16,185,129,0.08)', borderColor: i === 0 ? 'rgb(124,58,237)' : 'rgb(16,185,129)' })) }} options={lineOpts} />
                    ) : <EmptyChart />}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Leads by Service</h3>
                    {serviceWiseData?.labels?.length > 0 ? (
                      <Doughnut data={serviceWiseData} options={doughnutOpts} />
                    ) : <EmptyChart />}
                  </div>
                </div>

                {/* Recent Activity + MoM + Source split */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
                    <button onClick={() => setActiveTab('submissions')} className="text-xs text-purple-600 hover:underline">View all →</button>
                  </div>
                  {recentActivity?.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {recentActivity.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.source === 'form_submission' ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                              {item.source === 'form_submission' ? <FileText className="h-4 w-4 text-indigo-500" /> : <Zap className="h-4 w-4 text-emerald-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.service}</p>
                              <p className="text-xs text-gray-400 capitalize">{SOURCE_LABELS[item.source]}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="h-3.5 w-3.5" />
                            {relTime(item.receivedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Activity className="h-8 w-8 text-gray-200" />
                      <p className="text-sm text-gray-400">No recent activity yet</p>
                    </div>
                  )}
                </div>

                {/* MoM + Source split */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Month-over-Month Change</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-bold text-gray-900">
                          {trend ? (trend.isPositive ? '+' : '-') + Math.abs(trend.diff) : '—'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">leads vs last month</p>
                      </div>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${trend?.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                        {trend?.isPositive ? <ArrowUpRight className="h-8 w-8 text-green-600" /> : <ArrowDownRight className="h-8 w-8 text-red-500" />}
                      </div>
                    </div>
                    {trend && (
                      <div className={`mt-4 text-sm font-medium px-3 py-2 rounded-xl ${trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {trend.isPositive ? '▲' : '▼'} {trend.percent}% change from last month
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Lead Source Split</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Form Submissions', value: totalForms, total: totalForms + totalDPR, color: 'bg-indigo-500', icon: FileText, ic: 'text-indigo-500' },
                        { label: 'DPR Generation',   value: totalDPR,   total: totalForms + totalDPR, color: 'bg-emerald-500', icon: Zap,      ic: 'text-emerald-500' }
                      ].map(({ label, value, total, color, icon: Icon, ic }) => {
                        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                        return (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <Icon className={`h-3.5 w-3.5 ${ic}`} />
                                <span className="text-sm text-gray-700">{label}</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{value} <span className="text-xs font-normal text-gray-400">({pct}%)</span></span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════ SUBMISSIONS TAB ══════════════════ */}
        {activeTab === 'submissions' && (
          <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Form Submissions</h2>
                <p className="text-sm text-gray-500">All enquiries submitted through your service pages</p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Source filter */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <Filter className="h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={sourceFilter}
                    onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
                    className="outline-none bg-transparent text-gray-700 text-sm cursor-pointer"
                  >
                    <option value="">All Sources</option>
                    <option value="form_submission">Form Submissions</option>
                    <option value="dpr_generation">DPR Generation</option>
                  </select>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <input
                    type="text"
                    placeholder="Search by name, email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-3 py-2 text-sm outline-none w-48 text-gray-700 placeholder-gray-400"
                  />
                  <button type="submit" className="px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                    <Search className="h-4 w-4" />
                  </button>
                </form>

                {/* Refresh */}
                <button
                  onClick={loadSubmissions}
                  disabled={submissions.loading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${submissions.loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {submissions.loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                    <p className="text-sm text-gray-400 mt-3">Loading submissions...</p>
                  </div>
                </div>
              ) : submissions.items.length === 0 ? (
                <EmptyTable />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Received</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {submissions.items.map((row, idx) => {
                        const get = (keys) => {
                          for (const k of keys) {
                            const f = row.fields.find(f => f.key.toLowerCase() === k || f.label.toLowerCase() === k);
                            if (f) return f.value;
                          }
                          return '—';
                        };
                        const rowNum = (page - 1) * 20 + idx + 1;
                        return (
                          <tr key={row.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{rowNum}</td>
                            <td className="px-5 py-3.5">
                              <span className="font-medium text-gray-900">{row.service}</span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-700">{get(['name', 'full name', 'fullname'])}</td>
                            <td className="px-5 py-3.5">
                              <a href={`mailto:${get(['email'])}`} className="text-purple-600 hover:underline">
                                {get(['email'])}
                              </a>
                            </td>
                            <td className="px-5 py-3.5 text-gray-700">{get(['phone', 'mobile', 'phone number', 'mobile number'])}</td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                                row.source === 'form_submission'
                                  ? 'bg-indigo-50 text-indigo-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {row.source === 'form_submission' ? <FileText className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                                {SOURCE_LABELS[row.source]}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">{fmtDate(row.receivedAt)}</td>
                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => setSelected(row)}
                                className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, submissions.total)} of {submissions.total} submissions
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                            p === page
                              ? 'bg-purple-600 text-white'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Detail modal */}
      <SubmissionModal submission={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default LeadDashboardPage;
