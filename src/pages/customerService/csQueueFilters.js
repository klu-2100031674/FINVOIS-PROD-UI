/**
 * CS queue client-side filters (Testing).
 */

import { getDprWorkflowStatus } from '../../utils/dprWorkflowStatus';

export const CS_QUEUE_FILTER_STORAGE_KEY = 'cs-queue-filters:v1';

export const EMPTY_CS_QUEUE_FILTERS = {
  department: '',
  queueStatus: '', // open | claimed | assigned | completed | ''
  payment: '', // unpaid | paid | ''
  caStatus: '', // pending | under_review | approved | rejected | none | ''
};

export function loadCsQueueFilters() {
  try {
    const raw = localStorage.getItem(CS_QUEUE_FILTER_STORAGE_KEY);
    if (!raw) return { ...EMPTY_CS_QUEUE_FILTERS };
    const parsed = JSON.parse(raw);
    return { ...EMPTY_CS_QUEUE_FILTERS, ...parsed };
  } catch {
    return { ...EMPTY_CS_QUEUE_FILTERS };
  }
}

export function saveCsQueueFilters(filters) {
  try {
    localStorage.setItem(CS_QUEUE_FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    /* ignore */
  }
}

export function displayDepartmentName(name) {
  const raw = String(name || '').trim();
  if (!raw) return '—';
  if (/^ap\s*test$/i.test(raw)) return 'AP MSME';
  return raw;
}

function paymentState(req) {
  const report = req?.reportId;
  if (!report) return 'none';
  return report?.payment?.status === 'completed' ? 'paid' : 'unpaid';
}

function caState(req) {
  const vs = req?.reportId?.validation_status;
  if (!vs || vs === 'draft' || vs === 'pending_payment') return 'none';
  if (vs === 'pending_validation') return 'pending';
  if (vs === 'under_review') return 'under_review';
  if (vs === 'approved') return 'approved';
  if (vs === 'rejected') return 'rejected';
  return 'none';
}

export function getRequestApplicantText(req = {}) {
  const data = req.submittedData || {};
  const fields = req.formId?.fields || [];
  const nameField = fields.find(
    (f) =>
      f.id &&
      (f.id.toLowerCase().includes('name') ||
        f.label?.toLowerCase().includes('name') ||
        f.label?.toLowerCase().includes('applicant'))
  );
  const dynamicName = nameField ? data[nameField.id] : null;
  return (
    req.customerId?.name ||
    dynamicName ||
    data.govt_builtin_name ||
    data.applicantName ||
    data.name ||
    data.fullname ||
    ''
  );
}

export function uniqueDepartmentsFromRequests(requests = []) {
  const map = new Map();
  for (const req of requests) {
    const id = req.departmentId?._id || req.departmentId;
    const name = displayDepartmentName(req.departmentId?.name);
    if (id) map.set(String(id), name);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterCsQueueRequests(requests = [], filters = EMPTY_CS_QUEUE_FILTERS) {
  const department = String(filters.department || '').trim();
  const queueStatus = String(filters.queueStatus || '').trim();
  const payment = String(filters.payment || '').trim();
  const caStatus = String(filters.caStatus || '').trim();

  return requests.filter((req) => {
    if (department) {
      const id = String(req.departmentId?._id || req.departmentId || '');
      if (id !== department) return false;
    }
    if (queueStatus) {
      if (String(req.status || '') !== queueStatus) return false;
    }
    if (payment) {
      const state = paymentState(req);
      if (payment === 'paid' && state !== 'paid') return false;
      if (payment === 'unpaid' && state !== 'unpaid') return false;
    }
    if (caStatus) {
      if (caState(req) !== caStatus) return false;
    }
    return true;
  });
}

export function requestCaBadge(req) {
  const state = caState(req);
  const map = {
    none: { text: 'No report', className: 'bg-gray-100 text-gray-600' },
    pending: { text: 'CA Pending', className: 'bg-yellow-100 text-yellow-800' },
    under_review: { text: 'Under CA', className: 'bg-blue-100 text-blue-800' },
    approved: { text: 'Validated', className: 'bg-green-100 text-green-800' },
    rejected: { text: 'Queried', className: 'bg-red-100 text-red-800' },
  };
  return map[state] || map.none;
}

export function requestPaymentBadge(req) {
  const state = paymentState(req);
  if (state === 'paid') return { text: 'Paid', className: 'bg-emerald-100 text-emerald-800' };
  if (state === 'unpaid') return { text: 'Unpaid', className: 'bg-amber-100 text-amber-800' };
  return { text: '—', className: 'bg-gray-100 text-gray-500' };
}

export function requestWorkflowLabel(req) {
  return getDprWorkflowStatus(req, req.reportId)?.label || '—';
}
