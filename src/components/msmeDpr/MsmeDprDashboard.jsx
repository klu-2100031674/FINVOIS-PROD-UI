import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Mail,
  ExternalLink,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import toast from 'react-hot-toast';
import MsmeDprEmailOverlay from '@/components/msmeDpr/MsmeDprEmailOverlay';
import {
  fetchMsmeDprLeads,
  updateMsmeDprServiceAvailed,
} from '@/api/msmeDprLeadsAPI';
import {
  MSME_DPR_GENDER_OPTIONS,
  MSME_DPR_LOAN_TYPE_OPTIONS,
  MSME_DPR_RURAL_URBAN_OPTIONS,
  MSME_DPR_SCHEMES,
} from '@/constants/msmeDprSchemes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const PAGE_SIZE = 25;

const BASE_FILTERS = {
  search: '',
  ruralUrbanCategory: '',
  gender: '',
  startDate: '',
  endDate: '',
  schemeAppliedUnder: '',
  loanType: '',
  district: '',
};

const LINE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { position: 'top' } },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { grid: { display: false } },
  },
};

function displayScheme(value) {
  return value === 'CMEGP' ? 'CMEP' : value;
}

function getInitialFilters(showServiceAvailed) {
  if (showServiceAvailed) {
    return { ...BASE_FILTERS, serviceAvailed: '' };
  }
  return { ...BASE_FILTERS };
}

function buildApiFilters(filters, showServiceAvailed) {
  if (showServiceAvailed) {
    return { ...filters };
  }
  const { serviceAvailed: _omit, ...rest } = filters;
  return rest;
}

function hasActiveFilters(filters) {
  return Object.values(filters).some((v) => String(v).trim() !== '');
}

function ServiceAvailedToggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-orange-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ApplicantDetailPanel({ submission }) {
  if (!submission.description) return null;
  return (
    <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
      <p>
        <span className="font-medium text-gray-700">Description:</span> {submission.description}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        Submitted: {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : '—'}
      </p>
    </div>
  );
}

const MsmeDprDashboard = ({
  showServiceAvailed = false,
  showEmailConfig = false,
}) => {
  const initialFilters = useMemo(() => getInitialFilters(showServiceAvailed), [showServiceAvailed]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRequests: 0, totalServiceAvailed: 0 });
  const [chartSeries, setChartSeries] = useState({ labels: [], requests: [], serviceAvailed: [] });
  const [submissions, setSubmissions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [emailOverlayOpen, setEmailOverlayOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [timeframe, setTimeframe] = useState('1month');
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const loadData = useCallback(
    async (filterParams, pageNum = 1, currentTimeframe = '1month') => {
      setLoading(true);
      try {
        const data = await fetchMsmeDprLeads({
          ...buildApiFilters(filterParams, showServiceAvailed),
          page: pageNum,
          limit: PAGE_SIZE,
          timeframe: currentTimeframe,
        });
        setStats(data.stats || { totalRequests: 0, totalServiceAvailed: 0 });
        setChartSeries(
          data.chartSeries || { labels: [], requests: [], serviceAvailed: [] }
        );
        setSubmissions(data.submissions || []);
        setPagination(
          data.pagination || {
            page: pageNum,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
          }
        );
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load MSME DPR data');
      } finally {
        setLoading(false);
      }
    },
    [showServiceAvailed]
  );

  useEffect(() => {
    loadData(appliedFilters, page, timeframe);
  }, [appliedFilters, page, timeframe, loadData]);

  const handleApplyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    setAppliedFilters(initialFilters);
  };

  const handleToggleServiceAvailed = async (id, nextValue) => {
    setTogglingId(id);
    try {
      await updateMsmeDprServiceAvailed(id, nextValue);
      await loadData(appliedFilters, page);
      toast.success(nextValue ? 'Marked as service availed' : 'Service availed removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const formatLabel = useCallback((label) => {
    try {
      if (!label) return '';
      // Hourly: YYYY-MM-DD HH:00
      if (label.includes(' ')) {
        const [datePart, timePart] = label.split(' ');
        const date = new Date(datePart);
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        return `${day} ${month}, ${timePart}`;
      }
      // Daily: YYYY-MM-DD
      if (label.split('-').length === 3) {
        const date = new Date(label);
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
      }
      // Monthly: YYYY-MM
      if (label.split('-').length === 2) {
        const [year, monthNum] = label.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[parseInt(monthNum, 10) - 1];
        return `${month} ${year}`;
      }
      return label;
    } catch (e) {
      return label;
    }
  }, []);

  const generateEmptyChartData = useCallback((timeframe) => {
    const labels = [];
    const now = new Date();
    
    if (timeframe === '1d') {
      // Last 24 hours
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        labels.push(`${yyyy}-${mm}-${dd} ${hh}:00`);
      }
    } else if (timeframe === '1w') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        labels.push(`${yyyy}-${mm}-${dd}`);
      }
    } else if (timeframe === '1month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        labels.push(`${yyyy}-${mm}-${dd}`);
      }
    } else { // '1year'
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        labels.push(`${yyyy}-${mm}`);
      }
    }

    return {
      labels,
      requests: new Array(labels.length).fill(0),
      serviceAvailed: new Array(labels.length).fill(0),
    };
  }, []);

  const trendChartData = useMemo(() => {
    let labels = chartSeries.labels || [];
    let requests = chartSeries.requests || [];
    let serviceAvailed = chartSeries.serviceAvailed || [];

    if (labels.length === 0) {
      const emptyData = generateEmptyChartData(timeframe);
      labels = emptyData.labels;
      requests = emptyData.requests;
      serviceAvailed = emptyData.serviceAvailed;
    }

    return {
      labels: labels.map(formatLabel),
      datasets: [
        {
          label: 'Requests received',
          data: requests,
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(249, 115, 22)',
        },
        {
          label: 'Service availed',
          data: serviceAvailed,
          borderColor: 'rgb(20, 184, 166)',
          backgroundColor: 'rgba(20, 184, 166, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(20, 184, 166)',
        },
      ],
    };
  }, [chartSeries, timeframe, formatLabel, generateEmptyChartData]);

  const emptyMessage = hasActiveFilters(appliedFilters)
    ? 'No submissions match the selected filters.'
    : 'No submissions yet.';

  const tableColSpan = showServiceAvailed ? 14 : 13;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MSME AI DPR Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {showServiceAvailed
              ? 'Applicant submissions and service status'
              : 'Applicant submissions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open('/msme-dpr-lead-data', '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50"
          >
            <ExternalLink className="h-4 w-4" />
            MSME Link
          </button>
          {showEmailConfig && (
            <button
              type="button"
              onClick={() => setEmailOverlayOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          )}
          <button
            type="button"
            onClick={() => loadData(appliedFilters, page)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {showEmailConfig && (
        <MsmeDprEmailOverlay
          isOpen={emailOverlayOpen}
          onClose={() => setEmailOverlayOpen(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total DPR Requests received</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRequests}</p>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total DPR Service Availed</p>
          <p className="text-3xl font-bold text-teal-600 mt-1">{stats.totalServiceAvailed}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTrendChart((prev) => !prev)}
          className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50/80 transition-colors"
          aria-expanded={showTrendChart}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Trend Analysis</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 shrink-0">
            {showTrendChart ? 'Hide graph' : 'Show graph'}
            {showTrendChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
        {showTrendChart && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="flex justify-end gap-1.5 mb-4">
              {[
                { val: '1d', label: '1D' },
                { val: '1w', label: '1W' },
                { val: '1month', label: '1M' },
                { val: '1year', label: '1Y' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimeframe(opt.val);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all ${
                    timeframe === opt.val
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {trendChartData ? (
              <div className="h-72">
                <Line data={trendChartData} options={LINE_OPTS} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                No data for selected filters
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <form onSubmit={handleApplyFilters} className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
            <select
              value={filters.ruralUrbanCategory}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, ruralUrbanCategory: e.target.value }))
              }
              className="w-full lg:w-52 shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
              title="Filter by rural / urban"
            >
              <option value="">All rural / urban</option>
              {MSME_DPR_RURAL_URBAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select
              value={filters.gender}
              onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
              className="w-full lg:w-36 shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
              title="Filter by gender"
            >
              <option value="">All genders</option>
              {MSME_DPR_GENDER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search by applicant name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showAdvancedFilters
                  ? 'border-orange-300 bg-orange-50 text-orange-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              aria-expanded={showAdvancedFilters}
            >
              <SlidersHorizontal size={16} />
              Advanced filters
              {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="pt-3 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Scheme</label>
                  <select
                    value={filters.schemeAppliedUnder}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, schemeAppliedUnder: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                  >
                    <option value="">All schemes</option>
                    {MSME_DPR_SCHEMES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loan type</label>
                  <select
                    value={filters.loanType}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, loanType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                  >
                    <option value="">All loan types</option>
                    {MSME_DPR_LOAN_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">District</label>
                  <input
                    type="text"
                    value={filters.district}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, district: e.target.value }))
                    }
                    placeholder="Search district..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                {showServiceAvailed && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Service availed
                    </label>
                    <select
                      value={filters.serviceAvailed}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, serviceAvailed: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                )}
              </div>
              {hasActiveFilters(filters) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          Applicant wise
        </h2>
        {pagination.total > 0 && (
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-3 py-3 w-8" />
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Name of Applicant</th>
                    <th className="px-3 py-3">Gender</th>
                    <th className="px-3 py-3">Mobile Number</th>
                    <th className="px-3 py-3">Nature of Business</th>
                    <th className="px-3 py-3">Scheme Applied Under</th>
                    <th className="px-3 py-3">Loan Type</th>
                    <th className="px-3 py-3">Rural / Urban</th>
                    <th className="px-3 py-3">Village / City</th>
                    <th className="px-3 py-3">Mandal</th>
                    <th className="px-3 py-3">District</th>
                    <th className="px-3 py-3">Need CA Stamp</th>
                    {showServiceAvailed && <th className="px-3 py-3">Service Availed</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((s) => {
                    const expanded = expandedId === s._id;
                    return (
                      <Fragment key={s._id}>
                        <tr className="hover:bg-gray-50/50">
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : s._id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                            {s.createdAt
                              ? new Date(s.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-900">
                            {s.applicantName}
                          </td>
                          <td className="px-3 py-3 text-gray-600">{s.gender}</td>
                          <td className="px-3 py-3 text-gray-600">{s.mobileNumber}</td>
                          <td className="px-3 py-3 text-gray-600">{s.natureOfBusiness}</td>
                          <td className="px-3 py-3 text-gray-600">
                            {displayScheme(s.schemeAppliedUnder)}
                          </td>
                          <td className="px-3 py-3 text-gray-600 max-w-[140px]">{s.loanType}</td>
                          <td className="px-3 py-3 text-gray-600 max-w-[120px]">
                            {s.ruralUrbanCategory}
                          </td>
                          <td className="px-3 py-3 text-gray-600">{s.villageCity}</td>
                          <td className="px-3 py-3 text-gray-600">{s.mandal}</td>
                          <td className="px-3 py-3 text-gray-600">{s.district}</td>
                          <td className="px-3 py-3 text-gray-600">{s.needCaStamp || 'No'}</td>
                          {showServiceAvailed && (
                            <td className="px-3 py-3">
                              <ServiceAvailedToggle
                                checked={Boolean(s.serviceAvailed)}
                                disabled={togglingId === s._id}
                                onChange={(val) => handleToggleServiceAvailed(s._id, val)}
                              />
                            </td>
                          )}
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={tableColSpan} className="p-0">
                              <ApplicantDetailPanel submission={s} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {submissions.map((s) => {
              const expanded = expandedId === s._id;
              return (
                <div key={s._id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : s._id)}
                    className="w-full text-left p-4 flex items-start gap-3"
                  >
                    {expanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-normal shrink-0">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                        <h3 className="font-semibold text-gray-900 truncate">{s.applicantName}</h3>
                      </div>
                      <p className="text-sm text-gray-500">{s.mobileNumber}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.natureOfBusiness}</p>
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 space-y-2 text-sm text-gray-600 border-t pt-3">
                      <p>
                        <span className="font-medium text-gray-700">Gender:</span> {s.gender}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Scheme:</span>{' '}
                          {displayScheme(s.schemeAppliedUnder)}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Loan Type:</span> {s.loanType}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Rural / Urban:</span>{' '}
                        {s.ruralUrbanCategory}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Village / City:</span>{' '}
                        {s.villageCity}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Mandal:</span> {s.mandal}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">District:</span> {s.district}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Need CA Stamp:</span> {s.needCaStamp || 'No'}
                      </p>
                      {s.description && (
                        <p>
                          <span className="font-medium text-gray-700">Description:</span>{' '}
                          {s.description}
                        </p>
                      )}
                      {showServiceAvailed && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-medium text-gray-700">Service Availed</span>
                          <ServiceAvailedToggle
                            checked={Boolean(s.serviceAvailed)}
                            disabled={togglingId === s._id}
                            onChange={(val) => handleToggleServiceAvailed(s._id, val)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || loading}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MsmeDprDashboard;
