/**
 * Report generated / not-generated status column temporarily disabled
 * (applies to both Admin + MSME portal dashboards using this component).
 */
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Trash2,
  TrendingUp,
  ClipboardList,
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
import useAuth from '@/hooks/useAuth';
import api from '@/api/apiClient';
import MsmeDprEmailOverlay from '@/components/msmeDpr/MsmeDprEmailOverlay';
import AdminDprStaffActions from '@/components/govtForms/AdminDprStaffActions';
import { staffHandlerName, workflowFromLead } from '@/utils/dprWorkflowStatus';
import {
  deleteMsmeDprLead,
  fetchMsmeDprLeads,
  updateMsmeDprServiceAvailed,
} from '@/api/msmeDprLeadsAPI';
import {
  MSME_DPR_GENDER_OPTIONS,
  MSME_DPR_LOAN_TYPE_OPTIONS,
  MSME_DPR_RURAL_URBAN_OPTIONS,
  MSME_DPR_SCHEMES,
} from '@/constants/msmeDprSchemes';
import { displayMsmeLoanType } from '@/utils/msmeLoanTypeDisplay';

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

function parseServiceAvailed(value) {
  return value === true || value === 'true';
}

function formatServiceAvailed(value) {
  return parseServiceAvailed(value) ? 'Yes' : 'No';
}

function normalizeSubmission(submission = {}) {
  return {
    ...submission,
    serviceAvailed: parseServiceAvailed(submission.serviceAvailed),
  };
}

function ServiceAvailedCell({ checked, editable, disabled, onChange }) {
  const isAvailed = parseServiceAvailed(checked);
  const label = formatServiceAvailed(checked);
  const labelClass = isAvailed ? 'text-teal-700 font-medium' : 'text-gray-600';

  if (!editable) {
    return <span className={labelClass}>{label}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${labelClass}`}>{label}</span>
      <ServiceAvailedToggle
        checked={isAvailed}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

function ServiceAvailedToggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 ${checked ? 'bg-orange-500' : 'bg-gray-200'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
          }`}
      />
    </button>
  );
}

function ApplicantDetailPanel({ submission }) {
  const docs = Array.isArray(submission?.documents) ? submission.documents : [];
  const hasDescription = Boolean(submission?.description);
  const hasEnterprise = Boolean(submission?.enterpriseType);
  const hasAadhar = Boolean(submission?.aadharNumber);
  const hasPan = Boolean(submission?.panNumber);
  const assets = Array.isArray(submission?.dprAssets) ? submission.dprAssets : [];
  const hasAssets = assets.length > 0;
  const hasLoanTerms = Boolean(
    submission?.workingCapital ||
    submission?.loanTermPeriod ||
    submission?.rateOfInterest ||
    submission?.processingFee ||
    submission?.moratoriumPeriod ||
    submission?.loanAmount
  );

  return (
    <div className="px-4 py-4 bg-gray-50 border-t text-sm text-gray-600 space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
            Loan Type
          </span>
          <span className="text-sm font-semibold text-gray-900">{displayMsmeLoanType(submission.loanType)}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
            Sector
          </span>
          <span className="text-sm font-semibold text-gray-900">{submission.sector || '—'}</span>
        </div>
      </div>

      {/* Identity Badges */}
      {(hasAadhar || hasPan) && (
        <div className="flex flex-wrap items-center gap-3">
          {hasAadhar && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-mono">
              <span className="font-semibold text-amber-700 uppercase tracking-wider text-[10px]">Aadhaar:</span>
              <span>{submission.aadharNumber}</span>
            </div>
          )}
          {hasPan && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-mono">
              <span className="font-semibold text-blue-700 uppercase tracking-wider text-[10px]">PAN:</span>
              <span>{submission.panNumber}</span>
            </div>
          )}
        </div>
      )}

      {hasEnterprise && (
        <p>
          <span className="font-medium text-gray-700">Type of Organisation:</span>{' '}
          {submission.enterpriseType}
          {submission.yearOfRegistration
            ? ` · Year of Registration: ${submission.yearOfRegistration}`
            : ''}
        </p>
      )}

      {(submission?.natureOfBusiness || submission?.schemeAppliedUnder) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {submission.natureOfBusiness && (
            <p>
              <span className="font-medium text-gray-700">Nature of Business:</span>{' '}
              {submission.natureOfBusiness}
            </p>
          )}
          {submission.schemeAppliedUnder && (
            <p>
              <span className="font-medium text-gray-700">Scheme Applied Under:</span>{' '}
              {displayScheme(submission.schemeAppliedUnder)}
            </p>
          )}
        </div>
      )}

      {hasDescription && (
        <p>
          <span className="font-medium text-gray-700">Description:</span> {submission.description}
        </p>
      )}

      {/* Location Details (Rural/Urban, Village/City, Mandal, District) */}
      {(submission?.ruralUrbanCategory || submission?.villageCity || submission?.mandal || submission?.district) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {submission.ruralUrbanCategory && (
            <div className="p-2 bg-gray-100/80 rounded-lg border border-gray-200">
              <span className="text-[10px] font-semibold uppercase text-gray-500 block">Rural / Urban</span>
              <span className="text-xs font-semibold text-gray-800">{submission.ruralUrbanCategory}</span>
            </div>
          )}
          {submission.villageCity && (
            <div className="p-2 bg-gray-100/80 rounded-lg border border-gray-200">
              <span className="text-[10px] font-semibold uppercase text-gray-500 block">Village / City</span>
              <span className="text-xs font-semibold text-gray-800">{submission.villageCity}</span>
            </div>
          )}
          {submission.mandal && (
            <div className="p-2 bg-gray-100/80 rounded-lg border border-gray-200">
              <span className="text-[10px] font-semibold uppercase text-gray-500 block">Mandal</span>
              <span className="text-xs font-semibold text-gray-800">{submission.mandal}</span>
            </div>
          )}
          {submission.district && (
            <div className="p-2 bg-gray-100/80 rounded-lg border border-gray-200">
              <span className="text-[10px] font-semibold uppercase text-gray-500 block">District</span>
              <span className="text-xs font-semibold text-gray-800">{submission.district}</span>
            </div>
          )}
        </div>
      )}

      {/* Other Information required for preparing DPR */}
      {(hasAssets || hasLoanTerms) && (
        <div className="p-3.5 bg-white rounded-xl border border-orange-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Other Information required for preparing DPR
            </h4>
          </div>

          {hasAssets && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 font-semibold">
                    <th className="px-3 py-2 w-8">#</th>
                    <th className="px-3 py-2">Asset Model</th>
                    <th className="px-3 py-2">Asset Category</th>
                    <th className="px-3 py-2 text-right">Amount (₹)</th>
                    <th className="px-3 py-2 text-right">Loan %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assets.map((asset, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{asset.assetModel || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{asset.assetCategory || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-900 font-medium">
                        {asset.amount ? Number(asset.amount).toLocaleString('en-IN') || asset.amount : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700">
                        {asset.loanPercentage ? `${asset.loanPercentage}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasLoanTerms && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {submission.workingCapital && (
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-semibold uppercase text-gray-400 block">Working Capital</span>
                  <span className="text-xs font-semibold text-gray-800 font-mono">
                    ₹{Number(submission.workingCapital).toLocaleString('en-IN') || submission.workingCapital}
                  </span>
                </div>
              )}
              {submission.loanTermPeriod && (
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-semibold uppercase text-gray-400 block">Loan Term</span>
                  <span className="text-xs font-semibold text-gray-800">{submission.loanTermPeriod}</span>
                </div>
              )}
              {submission.rateOfInterest && (
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-semibold uppercase text-gray-400 block">Rate of Interest</span>
                  <span className="text-xs font-semibold text-gray-800">{submission.rateOfInterest}</span>
                </div>
              )}
              {submission.processingFee && (
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-semibold uppercase text-gray-400 block">Processing Fee</span>
                  <span className="text-xs font-semibold text-gray-800">{submission.processingFee}</span>
                </div>
              )}
              {submission.moratoriumPeriod && (
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-semibold uppercase text-gray-400 block">Moratorium (months)</span>
                  <span className="text-xs font-semibold text-gray-800">{submission.moratoriumPeriod}</span>
                </div>
              )}
              {submission.loanAmount && (
                <div className="p-2.5 bg-orange-50/60 rounded-lg border border-orange-200/60">
                  <span className="text-[10px] font-semibold uppercase text-orange-600 block">Total Loan Amount</span>
                  <span className="text-xs font-bold text-orange-950 font-mono">
                    {submission.loanAmount.startsWith('₹') ? submission.loanAmount : `₹${submission.loanAmount}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Submitted: {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : '—'}
      </p>
      {docs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            Documents ({docs.length})
          </p>
          <ul className="space-y-1">
            {docs.map((doc) => (
              <li key={doc.id || doc._id || doc.fileName} className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-700 hover:underline truncate"
                  >
                    {doc.fileName}
                  </a>
                ) : (
                  <span className="text-sm text-gray-600 truncate">{doc.fileName}</span>
                )}
                {doc.kind && (
                  <span className="text-[10px] uppercase text-gray-400 shrink-0">{doc.kind}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Report templates available for generation (same list as CustomerServiceRequestScreen)
const TEMPLATES_LIST = [
  { id: 'frcc1', name: 'Cash Credit Form 1' },
  { id: 'frcc2', name: 'Cash Credit Form 2' },
  { id: 'frcc3', name: 'Cash Credit Form 3' },
  { id: 'frcc4', name: 'Cash Credit Form 4' },
  { id: 'frcc5', name: 'Cash Credit Form 5' },
  { id: 'frcc6', name: 'Cash Credit Form 6' },
  { id: 'frcc7', name: 'Cash Credit Form 7' },
  { id: 'TERM_LOAN_SERVICE_WITHOUT_STOCK', name: 'Term Loan Form' },
  { id: 'TERM_LOAN_CC', name: 'Term Loan Cash Credit Form' },
  { id: 'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK', name: 'Term Loan With Stock Form' },
  { id: 'TERM_LOAN_EV_VEHICLE', name: 'EV Commercial Vehicle' },
  { id: 'TERM_LOAN_OTHER_THAN_EV_VEHICLE', name: 'Other Than EV Commercial Vehicle' },
  { id: 'TERM_LOAN_JCB_VEHICLE', name: 'JCB Vehicle' },
  { id: 'TERM_LOAN_DRONE_VEHICLE', name: 'Drone Vehicle' },
  { id: 'GOLD_LOAN', name: 'Gold Loan' },
];

/**
 * Inline template-selector + "Generate" button rendered per lead row.
 * Visible only when `showGenerateReport` is true.
 */
function GenerateReportCell({ leadId, departmentRequestId, navigate }) {
  const [selected, setSelected] = useState('frcc1');
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-orange-400 focus:outline-none max-w-[140px]"
        title="Select report template"
      >
        {TEMPLATES_LIST.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const params = new URLSearchParams({ templateId: selected, newDraft: '1', msmeLeadId: leadId });
          const requestId = departmentRequestId?._id || departmentRequestId || '';
          if (requestId) params.set('requestId', String(requestId));
          navigate(`/generate?${params.toString()}`);
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shrink-0"
        title="Generate report pre-filled with this submission"
      >
        <ClipboardList className="h-3.5 w-3.5" />
        Go
      </button>
    </div>
  );
}

const MsmeDprDashboard = ({
  showServiceAvailed: _showServiceAvailedProp = false, // Service Availed UI hidden; DB field retained
  showEmailConfig = false,
  showDelete = false,
  showGenerateReport = false,
}) => {
  const showServiceAvailed = false;
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const initialFilters = useMemo(() => getInitialFilters(showServiceAvailed), [showServiceAvailed]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRequests: 0, totalServiceAvailed: 0 });
  const [chartSeries, setChartSeries] = useState({ labels: [], requests: [], serviceAvailed: [] });
  const [submissions, setSubmissions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [emailOverlayOpen, setEmailOverlayOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [timeframe, setTimeframe] = useState('1month');
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [csAgents, setCsAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const loadData = useCallback(
    async (filterParams, pageNum = 1, currentTimeframe = '1month', options = {}) => {
      const silent = Boolean(options?.silent);
      if (!silent) setLoading(true);
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
        setSubmissions((data.submissions || []).map(normalizeSubmission));
        setPagination(
          data.pagination || {
            page: pageNum,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
          }
        );
      } catch (err) {
        if (!silent) {
          toast.error(err?.response?.data?.message || 'Failed to load MSME DPR data');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showServiceAvailed]
  );

  useEffect(() => {
    loadData(appliedFilters, page, timeframe);
  }, [appliedFilters, page, timeframe, loadData]);

  // Clear selection when the page or filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [appliedFilters, page, timeframe]);

  // Keep DPR Status / assign actions live (claim, generate, auto-unclaim).
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(appliedFilters, page, timeframe, { silent: true });
    }, 15000);
    return () => clearInterval(timer);
  }, [appliedFilters, page, timeframe, loadData]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    api.get('/govt-forms/customer-service')
      .then((res) => {
        if (!cancelled) setCsAgents(res.data?.data || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin]);

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
      setSubmissions((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, serviceAvailed: Boolean(nextValue) } : item
        )
      );
      await loadData(appliedFilters, page, timeframe);
      toast.success(nextValue ? 'Marked as service availed' : 'Service availed removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteSubmission = async (id, applicantName) => {
    const label = applicantName || 'this submission';
    if (!window.confirm(`Delete received form data for "${label}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const data = await deleteMsmeDprLead(id);
      if (data?.stats) setStats(data.stats);
      setSubmissions((prev) => prev.filter((item) => item._id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(id));
        return next;
      });
      if (expandedId === id) setExpandedId(null);
      toast.success('Submission deleted');
      await loadData(appliedFilters, page, timeframe);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete submission');
    } finally {
      setDeletingId(null);
    }
  };

  const pageIds = useMemo(
    () => submissions.map((s) => String(s._id)).filter(Boolean),
    [submissions]
  );
  const selectedCount = selectedIds.size;
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleSelectOne = (id) => {
    const key = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (
      !window.confirm(
        `Delete ${ids.length} selected submission${ids.length === 1 ? '' : 's'}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await deleteMsmeDprLead(id);
        deleted += 1;
      } catch {
        failed += 1;
      }
    }
    setSelectedIds(new Set());
    if (expandedId && ids.includes(String(expandedId))) setExpandedId(null);
    await loadData(appliedFilters, page, timeframe);
    if (failed === 0) {
      toast.success(`Deleted ${deleted} submission${deleted === 1 ? '' : 's'}`);
    } else {
      toast.error(`Deleted ${deleted}, failed ${failed}. Refresh and retry failed rows.`);
    }
    setBulkDeleting(false);
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
        // Service availed chart series hidden — DPR workflow status replaces it
      ],
    };
  }, [chartSeries, timeframe, formatLabel, generateEmptyChartData]);

  const emptyMessage = hasActiveFilters(appliedFilters)
    ? 'No submissions match the selected filters.'
    : 'No submissions yet.';

  // Columns: expand, [checkbox], Date, Name, Gender, Mobile, Loan Type, DPR Status, Staff (+ optional Generate / Delete)
  const tableColSpan =
    (showDelete ? 10 : 8) + (showGenerateReport ? 1 : 0);

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

      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-6 max-w-sm">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total DPR Requests received</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRequests}</p>
        </div>
        {/* Service Availed stats card hidden — DPR workflow status replaces it */}
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
                  className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all ${timeframe === opt.val
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
                placeholder="Search by name, mobile, or nature of business..."
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
              className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showAdvancedFilters
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
        <div className="flex flex-wrap items-center gap-3">
          {showDelete && selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={bulkDeleting}
                className="text-sm text-gray-500 hover:text-gray-800 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {bulkDeleting ? 'Deleting…' : `Delete selected (${selectedCount})`}
              </button>
            </div>
          )}
          {pagination.total > 0 && (
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
          )}
        </div>
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
                    {showDelete && (
                      <th className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAllOnPage}
                          disabled={bulkDeleting || pageIds.length === 0}
                          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          title={allOnPageSelected ? 'Deselect all on page' : 'Select all on page'}
                          aria-label="Select all on page"
                        />
                      </th>
                    )}
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Name of Applicant</th>
                    <th className="px-3 py-3">Gender</th>
                    <th className="px-3 py-3">Mobile Number</th>
                    <th className="px-3 py-3">Loan Type</th>
                    <th className="px-3 py-3">DPR Status</th>
                    <th className="px-3 py-3">Staff</th>
                    {showGenerateReport && <th className="px-3 py-3">Generate Report</th>}
                    {showDelete && <th className="px-3 py-3 text-right">Actions</th>}
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
                          {showDelete && (
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(String(s._id))}
                                onChange={() => toggleSelectOne(s._id)}
                                disabled={bulkDeleting}
                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                aria-label={`Select ${s.applicantName || 'submission'}`}
                              />
                            </td>
                          )}
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
                          <td className="px-3 py-3 text-gray-600 max-w-[140px] font-medium">{displayMsmeLoanType(s.loanType)}</td>
                          <td className="px-3 py-3">
                            {(() => {
                              const wf = workflowFromLead(s);
                              return (
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${wf.badgeClass}`}>
                                  {wf.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-3">
                              <AdminDprStaffActions
                                requestLike={s}
                                csAgents={csAgents}
                                adminActions={isAdmin}
                                onChanged={() => loadData(appliedFilters, page, timeframe)}
                              />
                          </td>
                          {showGenerateReport && (
                            <td className="px-3 py-3">
                              <GenerateReportCell leadId={s._id} departmentRequestId={s.departmentRequestId} navigate={navigate} />
                            </td>
                          )}
                          {showDelete && (
                            <td className="px-3 py-3 text-right">
                              <button
                                type="button"
                                disabled={deletingId === s._id || bulkDeleting}
                                onClick={() => handleDeleteSubmission(s._id, s.applicantName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                title="Delete submission"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deletingId === s._id ? '…' : 'Delete'}
                              </button>
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
                  <div className="flex items-start gap-2 p-4">
                    {showDelete && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(String(s._id))}
                        onChange={() => toggleSelectOne(s._id)}
                        disabled={bulkDeleting}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 shrink-0"
                        aria-label={`Select ${s.applicantName || 'submission'}`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : s._id)}
                      className="flex-1 text-left flex items-start gap-3 min-w-0"
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
                      <p className="text-xs text-gray-400 mt-1">
                        {s.natureOfBusiness}
                        {s.enterpriseType
                          ? ` · ${s.enterpriseType}${s.yearOfRegistration ? ` (${s.yearOfRegistration})` : ''}`
                          : ''}
                      </p>
                    </div>
                    </button>
                  </div>
                  {expanded && (
                    <div className="border-t">
                      <div className="px-4 py-3 space-y-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium text-orange-700">Loan Type:</span>{' '}
                          <span className="font-semibold text-gray-900">{displayMsmeLoanType(s.loanType)}</span>
                        </p>
                        <p>
                          <span className="font-medium text-orange-700">Sector:</span>{' '}
                          <span className="font-semibold text-gray-900">{s.sector || '—'}</span>
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Gender:</span> {s.gender}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Scheme:</span>{' '}
                          {displayScheme(s.schemeAppliedUnder)}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Rural / Urban:</span>{' '}
                          {s.ruralUrbanCategory}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Location:</span>{' '}
                          {[s.villageCity, s.mandal, s.district].filter(Boolean).join(', ')}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">DPR Status:</span>{' '}
                          {workflowFromLead(s).label}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Generating report:</span>{' '}
                          {staffHandlerName(s) || '—'}
                        </p>
                        {isAdmin && (
                          <div className="pt-2">
                            <AdminDprStaffActions
                              requestLike={s}
                              csAgents={csAgents}
                              adminActions={isAdmin}
                              onChanged={() => loadData(appliedFilters, page, timeframe)}
                            />
                          </div>
                        )}
                        {/* Service Availed UI hidden
                        <p>
                          <span className="font-medium text-gray-700">Service Availed:</span>{' '}
                          {formatServiceAvailed(s.serviceAvailed)}
                        </p>
                        */}
                        {showGenerateReport && (
                          <div className="pt-2 border-t mt-2">
                            <p className="font-medium text-gray-700 mb-2 text-xs uppercase tracking-wide">Generate Report</p>
                            <GenerateReportCell leadId={s._id} departmentRequestId={s.departmentRequestId} navigate={navigate} />
                          </div>
                        )}
                        {showDelete && (
                          <div className="flex items-center justify-between pt-2 border-t mt-2">
                            <span className="font-medium text-gray-700">Delete submission</span>
                            <button
                              type="button"
                              disabled={deletingId === s._id || bulkDeleting}
                              onClick={() => handleDeleteSubmission(s._id, s.applicantName)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingId === s._id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                      <ApplicantDetailPanel submission={s} />
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
