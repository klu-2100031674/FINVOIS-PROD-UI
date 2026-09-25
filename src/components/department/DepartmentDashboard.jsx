import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LogOut,
  Inbox,
  Check,
  ClipboardList,
  UserCheck,
  BarChart3,
  Clock,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  SlidersHorizontal,
  TrendingUp,
  RefreshCw,
  Mail,
  User,
  Eye,
  Download,
  X,
  MessageSquare,
  FileSpreadsheet,
  PanelRightOpen,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import DepartmentEmailOverlay from './DepartmentEmailOverlay';
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
import api, { apiErrorMessage } from '../../api/apiClient';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import finvoisLogo from '../../assets/finvois.png';
import RequestChatPanel from './RequestChatPanel';
import {
  WORKFLOW_KEYS,
  WORKFLOW_LABELS,
  canAssignRequest,
  canUnclaimRequest,
  getDprWorkflowStatus,
} from '../../utils/dprWorkflowStatus';

async function fetchDeptRequestReportBlob(requestId, kind = 'pdf', inline = false) {
  const qs = kind === 'pdf' && inline ? '?inline=1' : '';
  return api.get(`/govt-forms/requests/${requestId}/report/${kind}${qs}`, {
    responseType: 'blob',
  });
}

async function viewApprovedRequestPdf(requestId) {
  const res = await fetchDeptRequestReportBlob(requestId, 'pdf', true);
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function downloadApprovedRequestFile(requestId, kind = 'pdf') {
  const res = await fetchDeptRequestReportBlob(requestId, kind, false);
  const type =
    kind === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';
  const blob = new Blob([res.data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = kind === 'excel' ? `report-${requestId}.xlsx` : `report-${requestId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function ApprovedReportActions({ requestId }) {
  const [busy, setBusy] = useState(null);

  const run = async (action, fn) => {
    try {
      setBusy(action);
      await fn();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to open report'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <button
        type="button"
        disabled={!!busy}
        onClick={(e) => {
          e.stopPropagation();
          run('view', () => viewApprovedRequestPdf(requestId));
        }}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
        title="View PDF"
      >
        <Eye className="h-4 w-4 shrink-0" />
        {busy === 'view' ? 'Opening…' : 'View report'}
      </button>
      <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
        <button
          type="button"
          disabled={!!busy}
          onClick={(e) => {
            e.stopPropagation();
            run('pdf', () => downloadApprovedRequestFile(requestId, 'pdf'));
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          title="Download PDF"
        >
          <Download className="h-4 w-4 shrink-0 text-gray-500" />
          {busy === 'pdf' ? '…' : 'PDF'}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={(e) => {
            e.stopPropagation();
            run('excel', () => downloadApprovedRequestFile(requestId, 'excel'));
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          title="Download Excel"
        >
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
          {busy === 'excel' ? '…' : 'Excel'}
        </button>
      </div>
    </div>
  );
}

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

const PAGE_SIZE = 10;

function getDeptReportStatus(req) {
  const wf = getDprWorkflowStatus(req, req.reportId);
  return {
    label: wf.label,
    badgeClass: wf.badgeClass,
    filterKey: wf.key,
  };
}

const BUILTIN_FIELD_IDS = {
  name: 'govt_builtin_name',
  email: 'govt_builtin_email',
  phone: 'govt_builtin_phone',
};

function formatFieldValue(val) {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'object' && val.fileName) return val.fileName;
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

function findFieldByKind(fields, kind) {
  if (!fields?.length) return null;
  if (kind === 'name') {
    return fields.find(
      (f) =>
        f.id === BUILTIN_FIELD_IDS.name ||
        (f.type === 'text' && f.id.toLowerCase().includes('name'))
    );
  }
  if (kind === 'email') {
    return fields.find((f) => f.type === 'email' || f.id === BUILTIN_FIELD_IDS.email);
  }
  if (kind === 'phone') {
    return fields.find(
      (f) =>
        f.type === 'phone' ||
        f.id === BUILTIN_FIELD_IDS.phone ||
        f.id.toLowerCase().includes('mobile')
    );
  }
  return null;
}

function findNatureOfBusinessField(fields) {
  if (!fields?.length) return null;
  return fields.find((f) => {
    const id = String(f.id || '').toLowerCase();
    const label = String(f.label || '').toLowerCase();
    return (
      id.includes('nature_of_business') ||
      id.includes('natureofbusiness') ||
      label.includes('nature of business')
    );
  });
}

const getContactValue = (submittedData, fields, kind) => {
  const field = findFieldByKind(fields, kind);
  if (!field || !submittedData) return '—';
  return formatFieldValue(submittedData[field.id]);
};

const getNatureOfBusinessValue = (submittedData, fields) => {
  const field = findNatureOfBusinessField(fields);
  if (!field || !submittedData) return '—';
  return formatFieldValue(submittedData[field.id]);
};

function isPrimaryField(field) {
  if (
    field.id === BUILTIN_FIELD_IDS.name ||
    field.id === BUILTIN_FIELD_IDS.email ||
    field.id === BUILTIN_FIELD_IDS.phone
  ) {
    return true;
  }
  if (field.type === 'email' || field.type === 'phone') return true;
  if (field.type === 'text' && field.id.toLowerCase().includes('name')) return true;
  return false;
}

function collectFormFileDocs(request) {
  const fields = request?.formId?.fields || [];
  const submittedData = request?.submittedData || {};
  const docs = [];
  for (const field of fields) {
    if (String(field?.type || '').toLowerCase() !== 'file') continue;
    const val = submittedData[field.id];
    if (!val || typeof val !== 'object' || !val.fileName) continue;
    const href = val.base64 || val.dataUrl || val.data || val.url || null;
    docs.push({
      id: `form-file-${field.id}`,
      fileName: val.fileName,
      kind: 'document',
      url: href,
      source: 'form',
    });
  }
  return docs;
}

function RequestDetailPanel({ request }) {
  const fields = request.formId?.fields || [];
  const submittedData = request.submittedData || {};
  const detailFields = fields.filter((f) => !isPrimaryField(f));
  const formFileDocs = useMemo(() => collectFormFileDocs(request), [request]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const requestId = request?._id;
    if (!requestId) return undefined;

    const load = async () => {
      setDocsLoading(true);
      try {
        const res = await api.get(`/govt-forms/requests/${requestId}/documents`);
        if (!cancelled) {
          setUploadedDocs(Array.isArray(res.data?.data) ? res.data.data : []);
        }
      } catch {
        if (!cancelled) setUploadedDocs([]);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [request?._id]);

  const docs = useMemo(() => {
    const merged = [...formFileDocs];
    const seen = new Set(formFileDocs.map((d) => String(d.fileName || '').toLowerCase()));
    for (const doc of uploadedDocs) {
      const name = String(doc.fileName || '').toLowerCase();
      if (name && seen.has(name)) continue;
      if (name) seen.add(name);
      merged.push(doc);
    }
    return merged;
  }, [formFileDocs, uploadedDocs]);

  const hasDetails = detailFields.length > 0;
  const hasDocs = docs.length > 0;
  const requestId = request?._id;
  const reportStatus = getDeptReportStatus(request);
  const reportApproved = reportStatus.filterKey === 'generated';

  return (
    <div className="space-y-5 text-sm text-gray-600">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Form</p>
          <p className="font-medium text-gray-900">{request.formId?.name || 'Deleted Form'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${reportStatus.badgeClass}`}
          >
            {reportStatus.label}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500">Applicant</p>
          <p className="font-medium text-gray-900">
            {getContactValue(submittedData, fields, 'name')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Submitted</p>
          <p className="font-medium text-gray-900">
            {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="font-medium text-gray-900 break-all">
            {getContactValue(submittedData, fields, 'email')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="font-medium text-gray-900">
            {getContactValue(submittedData, fields, 'phone')}
          </p>
        </div>
      </div>

      {reportApproved && requestId ? (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Generated report</h4>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
            <ApprovedReportActions requestId={requestId} />
          </div>
        </section>
      ) : (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Generated report</h4>
          <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
            No approved report available yet.
          </p>
        </section>
      )}

      {hasDetails && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional form details</h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-gray-200 bg-white p-3">
            {detailFields.map((field) => (
              <div key={field.id}>
                <dt className="text-xs text-gray-500">{field.label}</dt>
                <dd className="font-medium text-gray-800 mt-0.5 break-words">
                  {formatFieldValue(submittedData[field.id])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Documents ({docs.length})
        </h4>
        {docsLoading && !hasDocs ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
            Loading documents…
          </p>
        ) : !hasDocs ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
            No documents uploaded.
          </p>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id || doc._id || doc.fileName}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              >
                <div className="min-w-0 flex items-start gap-2">
                  <FileText className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.fileName}</p>
                    {doc.kind ? (
                      <p className="text-xs text-gray-500 uppercase">{doc.kind}</p>
                    ) : null}
                  </div>
                </div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Download size={14} />
                    Open
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {requestId && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <MessageSquare size={14} className="text-purple-700" />
            Chat
          </h4>
          <RequestChatPanel
            requestId={String(requestId)}
            apiBase={`/govt-forms/requests/${requestId}`}
            status={request.status}
            readOnly
            compact
          />
        </section>
      )}
    </div>
  );
}

function generateLabels(timeframe) {
  const labels = [];
  const now = new Date();
  if (timeframe === '1d') {
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      labels.push(`${yyyy}-${mm}-${dd} ${hh}:00`);
    }
  } else if (timeframe === '1w') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      labels.push(`${yyyy}-${mm}-${dd}`);
    }
  } else if (timeframe === '1month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      labels.push(`${yyyy}-${mm}-${dd}`);
    }
  } else { // '1year'
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      labels.push(`${yyyy}-${mm}`);
    }
  }
  return labels;
}

function formatLabel(label) {
  try {
    if (!label) return '';
    if (label.includes(' ')) {
      const [datePart, timePart] = label.split(' ');
      const date = new Date(datePart);
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      return `${day} ${month}, ${timePart}`;
    }
    if (label.split('-').length === 3) {
      const date = new Date(label);
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      return `${day} ${month}`;
    }
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
}

const DepartmentDashboard = ({ adminView = false, showServiceAvailed: _showServiceAvailedProp = false }) => {
  const showServiceAvailed = false; // Service Availed UI hidden; DB field retained
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [timeframe, setTimeframe] = useState('1month');

  const [requests, setRequests] = useState([]);
  const [csAgents, setCsAgents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Filters State
  const initialFilters = useMemo(() => ({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    serviceAvailed: '',
  }), []);

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // Pagination State
  const [page, setPage] = useState(1);

  // Request Details & Assignment Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assigningTo, setAssigningTo] = useState('');
  const [emailOverlayOpen, setEmailOverlayOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (adminView) {
      const searchParams = new URLSearchParams(location.search);
      const deptId = searchParams.get('departmentId') || '';
      setSelectedDeptId(deptId);
    }
  }, [location.search, adminView]);

  useEffect(() => {
    fetchRequests();
  }, [selectedDeptId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const promises = [fetchCsAgents()];
      if (adminView) {
        promises.push(fetchDepartments());
      } else {
        promises.push(fetchRequests());
      }
      await Promise.all(promises);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/govt-forms/departments');
      const list = res.data?.data || [];
      setDepartments(list);
      // All Departments disabled — default to first department when none selected
      if (adminView && list.length > 0) {
        const searchParams = new URLSearchParams(location.search);
        const fromUrl = searchParams.get('departmentId') || '';
        if (!fromUrl && !selectedDeptId) {
          const firstId = String(list[0]._id);
          setSelectedDeptId(firstId);
          navigate(`/admin/department-name?departmentId=${encodeURIComponent(firstId)}`, {
            replace: true,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const params = {};
      if (adminView && selectedDeptId) {
        params.departmentId = selectedDeptId;
      }
      const res = await api.get('/govt-forms/requests', { params });
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load requests');
    }
  };

  const fetchCsAgents = async () => {
    try {
      const res = await api.get('/govt-forms/customer-service');
      setCsAgents(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load Customer Service agents');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchRequests();
      toast.success('Dashboard refreshed');
    } catch (err) {
      toast.error('Refresh failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Request Operations ---
  const handleAssign = async (reqId) => {
    if (!assigningTo) {
      toast.error('Select a Customer Service agent first');
      return;
    }
    try {
      await api.post(`/govt-forms/requests/${reqId}/assign`, { csUserId: assigningTo });
      toast.success('Request assigned successfully');
      setSelectedRequest(null);
      setAssigningTo('');
      fetchRequests();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to assign request'));
    }
  };

  const handleCancelAssignment = async (reqId) => {
    try {
      await api.post(`/govt-forms/requests/${reqId}/admin-release`);
      toast.success('Request returned to Pending');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to unclaim request'));
    }
  };

  const handleToggleServiceAvailed = async (reqId, checked) => {
    setTogglingId(reqId);
    try {
      await api.patch(`/govt-forms/requests/${reqId}/service-availed`, { serviceAvailed: checked });
      toast.success('Service availed status updated');
      fetchRequests();
    } catch (err) {
      toast.error('Failed to update service availed status');
    } finally {
      setTogglingId(null);
    }
  };

  // Filter requests locally
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Search filter — applicant name, mobile, nature of business (also form/email/id)
      if (appliedFilters.search.trim()) {
        const query = appliedFilters.search.toLowerCase().trim();
        const queryDigits = query.replace(/\D/g, '');
        const reqId = req._id.toLowerCase();
        const formName = (req.formId?.name || '').toLowerCase();
        const fields = req.formId?.fields || [];
        const submittedData = req.submittedData || {};
        const name = getContactValue(submittedData, fields, 'name').toLowerCase();
        const email = getContactValue(submittedData, fields, 'email').toLowerCase();
        const phone = getContactValue(submittedData, fields, 'phone').toLowerCase();
        const phoneDigits = phone.replace(/\D/g, '');
        const natureOfBusiness = getNatureOfBusinessValue(submittedData, fields).toLowerCase();
        const matchesId = reqId.includes(query);
        const matchesForm = formName.includes(query);
        const matchesName = name.includes(query);
        const matchesEmail = email.includes(query);
        const matchesPhone =
          phone.includes(query) || (queryDigits.length > 0 && phoneDigits.includes(queryDigits));
        const matchesNature = natureOfBusiness.includes(query);
        if (
          !matchesId &&
          !matchesForm &&
          !matchesName &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesNature
        ) {
          return false;
        }
      }

      // 2. DPR workflow status filter
      if (appliedFilters.status) {
        const statusMeta = getDeptReportStatus(req);
        if (statusMeta.filterKey !== appliedFilters.status) return false;
      }

      // 3. Date range filter
      if (appliedFilters.startDate) {
        const start = new Date(appliedFilters.startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(req.createdAt) < start) return false;
      }
      if (appliedFilters.endDate) {
        const end = new Date(appliedFilters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(req.createdAt) > end) return false;
      }

      // 4. Service Availed filter
      if (showServiceAvailed && appliedFilters.serviceAvailed) {
        const isAvailed = !!req.serviceAvailed;
        if (appliedFilters.serviceAvailed === 'true' && !isAvailed) return false;
        if (appliedFilters.serviceAvailed === 'false' && isAvailed) return false;
      }

      return true;
    });
  }, [requests, appliedFilters, showServiceAvailed]);

  // Frontend Pagination
  const paginatedRequests = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRequests.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRequests, page]);

  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE) || 1;

  // Stats cards calculation
  const stats = useMemo(() => {
    const total = requests.length;
    const generated = requests.filter((r) => r.reportId).length;
    const serviceAvailedCount = requests.filter((r) => r.serviceAvailed).length;
    return { total, generated, serviceAvailedCount };
  }, [requests]);

  // Chart data calculation
  const trendChartData = useMemo(() => {
    if (requests.length === 0) return null;

    const labels = generateLabels(timeframe);
    const requestsCounts = new Array(labels.length).fill(0);
    const serviceAvailedCounts = new Array(labels.length).fill(0);

    requests.forEach((req) => {
      const d = new Date(req.createdAt);
      let key = '';
      if (timeframe === '1d') {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        key = `${yyyy}-${mm}-${dd} ${hh}:00`;
      } else if (timeframe === '1w' || timeframe === '1month') {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        key = `${yyyy}-${mm}-${dd}`;
      } else { // '1year'
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        key = `${yyyy}-${mm}`;
      }

      const idx = labels.indexOf(key);
      if (idx !== -1) {
        requestsCounts[idx]++;
        if (req.serviceAvailed) {
          serviceAvailedCounts[idx]++;
        }
      }
    });

    const datasets = [
      {
        label: 'Requests Received',
        data: requestsCounts,
        borderColor: 'rgb(249, 115, 22)', // Orange border like MSME
        backgroundColor: 'rgba(249, 115, 22, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(249, 115, 22)',
      }
    ];

    if (showServiceAvailed) {
      datasets.push({
        label: 'Service Availed',
        data: serviceAvailedCounts,
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(20, 184, 166)',
      });
    }

    return {
      labels: labels.map(formatLabel),
      datasets,
    };
  }, [requests, timeframe, showServiceAvailed]);

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

  const emptyMessage =
    appliedFilters.search ||
    appliedFilters.status ||
    appliedFilters.startDate ||
    appliedFilters.endDate ||
    appliedFilters.serviceAvailed
      ? 'No requests match the selected filters.'
      : 'No requests received yet.';

  const renderDashboardContent = () => {
    return (
      <div className="space-y-6">
        {/* Department Selector for Admin */}
        {adminView && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Select Department View
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-72 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-gray-50 text-sm outline-none transition-all font-medium"
            >
              {/* All Departments option temporarily disabled
              <option value="">All Departments</option>
              */}
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-['Manrope']">
              {adminView ? 'Department Requests Portal' : 'Govt Form Requests Dashboard'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Applicant submissions and report statuses</p>
          </div>
          <div className="flex items-center gap-2">
            {((adminView && selectedDeptId) || (!adminView && user?._id)) && (
              <button
                type="button"
                onClick={() => setEmailOverlayOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all shadow-sm font-semibold text-sm"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm font-semibold text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 ${showServiceAvailed ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Requests received</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Reports Generated</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{stats.generated}</p>
          </div>
          {showServiceAvailed && (
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Service Availed</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">{stats.serviceAvailedCount}</p>
            </div>
          )}
        </div>

        {/* Trend Chart */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowChart((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50/80 transition-colors"
            aria-expanded={showChart}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-gray-900 font-['Manrope']">Trend Analysis</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 shrink-0">
              {showChart ? 'Hide graph' : 'Show graph'}
              {showChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          {showChart && (
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

        {/* Advanced Filters */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <form onSubmit={handleApplyFilters} className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full lg:w-44 shrink-0 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-transparent bg-white text-sm"
                title="Filter by DPR Status"
              >
                <option value="">All Statuses</option>
                <option value={WORKFLOW_KEYS.pending}>{WORKFLOW_LABELS.pending}</option>
                <option value={WORKFLOW_KEYS.initiated}>{WORKFLOW_LABELS.initiated}</option>
                <option value={WORKFLOW_KEYS.preparation}>{WORKFLOW_LABELS.preparation}</option>
                <option value={WORKFLOW_KEYS.ca_validation}>{WORKFLOW_LABELS.ca_validation}</option>
                <option value={WORKFLOW_KEYS.generated}>{WORKFLOW_LABELS.generated}</option>
                <option value={WORKFLOW_KEYS.rejected}>{WORKFLOW_LABELS.rejected}</option>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 text-sm font-semibold shadow-sm transition-all"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                  showAdvancedFilters
                    ? 'border-orange-300 bg-orange-50 text-orange-850'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                aria-expanded={showAdvancedFilters}
              >
                <SlidersHorizontal size={16} />
                Filters
                {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showAdvancedFilters && (
              <div className="pt-3 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  {showServiceAvailed && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Service Availed</label>
                      <select
                        value={filters.serviceAvailed}
                        onChange={(e) => setFilters((prev) => ({ ...prev, serviceAvailed: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                      >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  )}
                </div>
                {(filters.startDate || filters.endDate || filters.search || filters.status || filters.serviceAvailed) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline font-semibold"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Requests List Title */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 font-['Manrope']">
            <FileText className="h-5 w-5 text-orange-500" />
            Requests list
          </h2>
          {filteredRequests.length > 0 && (
            <p className="text-sm text-gray-500 font-medium">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredRequests.length)} of {filteredRequests.length}
            </p>
          )}
        </div>

        {/* Table & Lists */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-gray-500 font-medium">{emptyMessage}</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-3 py-3">Form Name</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Phone No</th>
                      <th className="px-3 py-3">DPR Status</th>
                      <th className="px-3 py-3">Assigned Staff</th>
                      <th className="px-3 py-3">Submitted</th>
                      {showServiceAvailed && <th className="px-3 py-3">Service Availed</th>}
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedRequests.map((req) => {
                      const fields = req.formId?.fields || [];
                      const submittedData = req.submittedData || {};
                      const reportStatus = getDeptReportStatus(req);
                      let assignee = '—';
                      if (req.status === 'assigned') assignee = req.assignedTo?.name || 'Assigned';
                      else if (req.status === 'claimed') assignee = req.claimedBy?.name || 'Claimed';

                      return (
                        <tr key={req._id} className="hover:bg-gray-50/50">
                          <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                            {req.formId?.name || 'Deleted Form'}
                          </td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                            {getContactValue(submittedData, fields, 'email')}
                          </td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                            {getContactValue(submittedData, fields, 'phone')}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${reportStatus.badgeClass}`}
                            >
                              {reportStatus.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{assignee}</td>
                          <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleString()}
                          </td>
                          {showServiceAvailed && (
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={!!req.serviceAvailed}
                                disabled={togglingId === req._id}
                                onChange={(e) => handleToggleServiceAvailed(req._id, e.target.checked)}
                                className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4 border-gray-300 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailRequest(req)}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-semibold transition-all"
                                title="View chat, documents, and report"
                              >
                                <PanelRightOpen className="h-3.5 w-3.5" />
                                View details
                              </button>
                              {isAdmin && (canAssignRequest(req, req.reportId) || canUnclaimRequest(req, req.reportId)) && (
                              <button
                                type="button"
                                onClick={() => setSelectedRequest(req)}
                                className="text-xs px-3 py-1.5 border border-purple-200 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 font-semibold transition-all"
                              >
                                Manage Staff
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-3">
              {paginatedRequests.map((req) => {
                const fields = req.formId?.fields || [];
                const submittedData = req.submittedData || {};
                const reportStatus = getDeptReportStatus(req);
                let assignee = '—';
                if (req.status === 'assigned') assignee = req.assignedTo?.name || 'Assigned';
                else if (req.status === 'claimed') assignee = req.claimedBy?.name || 'Claimed';

                return (
                  <div key={req._id} className="bg-white border rounded-2xl overflow-hidden shadow-sm p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{req.formId?.name || 'Deleted Form'}</h3>
                        <p className="text-sm text-gray-500">{getContactValue(submittedData, fields, 'email')}</p>
                        <p className="text-sm text-gray-500">{getContactValue(submittedData, fields, 'phone')}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Staff: {assignee}</p>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${reportStatus.badgeClass}`}
                      >
                        {reportStatus.label}
                      </span>
                    </div>
                    {showServiceAvailed && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-semibold text-gray-700">Service Availed</span>
                        <input
                          type="checkbox"
                          checked={!!req.serviceAvailed}
                          disabled={togglingId === req._id}
                          onChange={(e) => handleToggleServiceAvailed(req._id, e.target.checked)}
                          className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4 border-gray-300 cursor-pointer"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDetailRequest(req)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-semibold transition-all"
                      >
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        View details
                      </button>
                      {isAdmin && (canAssignRequest(req, req.reportId) || canUnclaimRequest(req, req.reportId)) && (
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="text-xs px-3 py-1.5 border border-purple-200 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 font-semibold transition-all"
                      >
                        Manage Staff
                      </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 px-4 py-2.5 border rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 px-4 py-2.5 border rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
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

  return (
    <div className={adminView ? "space-y-6" : "min-h-screen bg-gray-50 font-['Inter'] flex flex-col"}>
      {/* Top Header */}
      {!adminView && (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={finvoisLogo} alt="Finvois" className="h-9 w-auto" />
            <span className="h-5 w-px bg-gray-300"></span>
            <span className="text-sm font-semibold text-[#7e22ce] bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {user?.name || 'Department'} Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/department/profile"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors border border-gray-200"
            >
              <User size={16} />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>
      )}

      {/* Main Container */}
      {adminView ? (
        renderDashboardContent()
      ) : (
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {renderDashboardContent()}
        </main>
      )}

      {/* Request detail drawer (chat, documents, report) */}
      {detailRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close detail"
            onClick={() => setDetailRequest(null)}
          />
          <div className="relative h-full w-full max-w-xl bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request detail</h3>
                <p className="text-xs text-gray-500">Documents, chat, and generated report</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailRequest(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <RequestDetailPanel request={detailRequest} />
            </div>
          </div>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Assign Request</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Form Metadata */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-bold text-purple-900 text-sm">{selectedRequest.formId?.name}</h3>
                <p className="text-xs text-purple-700 mt-1">
                  Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
                <div className="mt-2 text-xs font-semibold px-2 py-0.5 bg-white text-purple-800 rounded border border-purple-200 inline-block">
                  STATUS: {getDeptReportStatus(selectedRequest).label.toUpperCase()}
                </div>
              </div>

              {/* Assignment Workflow — admin only, Pending assign / Request initiated unclaim */}
              {isAdmin && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Staff Owner Control</h4>

                  {canUnclaimRequest(selectedRequest, selectedRequest.reportId) && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-800">
                        Current Owner:{' '}
                        <strong>
                          {selectedRequest.status === 'assigned'
                            ? selectedRequest.assignedTo?.name
                            : selectedRequest.claimedBy?.name}
                        </strong>
                      </div>
                      <button
                        onClick={() => handleCancelAssignment(selectedRequest._id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800"
                      >
                        Unclaim
                      </button>
                    </div>
                  )}

                  {canAssignRequest(selectedRequest, selectedRequest.reportId) && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Select Customer Service agent
                        </label>
                        <select
                          value={assigningTo}
                          onChange={(e) => setAssigningTo(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce] bg-white"
                        >
                          <option value="">-- Choose Agent --</option>
                          {csAgents.map((cs) => (
                            <option key={cs._id} value={cs._id}>
                              {cs.name} ({cs.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleAssign(selectedRequest._id)}
                        className="w-full px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] text-sm font-semibold transition-colors"
                      >
                        Confirm Assignment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
      {((adminView && selectedDeptId) || (!adminView && user?._id)) && (
        <DepartmentEmailOverlay
          isOpen={emailOverlayOpen}
          onClose={() => setEmailOverlayOpen(false)}
          departmentId={adminView ? selectedDeptId : user._id}
        />
      )}
    </div>
  );
};

export default DepartmentDashboard;
