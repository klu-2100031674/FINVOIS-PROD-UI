import type { AgentRequest } from '~/api/agentRequests';
import { applicantOf, isReportPaid, reportOf } from '~/utils/agentRequest';

// Same client-side filters as the web customer-service queues (csQueueFilters.js).

export type PaymentFilter = '' | 'paid' | 'unpaid';
export type CaFilter = '' | 'none' | 'pending' | 'under_review' | 'approved' | 'rejected';
export type InProgressKind = 'preparation' | 'payment' | 'ca' | 'rejected';

export interface QueueFilters {
  search: string;
  department: string;
  payment: PaymentFilter;
  ca: CaFilter;
}

export const EMPTY_FILTERS: QueueFilters = { search: '', department: '', payment: '', ca: '' };

export const IN_PROGRESS_KINDS: { key: InProgressKind | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'preparation', label: 'Preparation' },
  { key: 'payment', label: 'Payment' },
  { key: 'ca', label: 'With CA' },
  { key: 'rejected', label: 'Rejected' },
];

export function paymentState(request: AgentRequest): 'none' | 'paid' | 'unpaid' {
  const report = reportOf(request);
  if (!report) return 'none';
  return isReportPaid(report) ? 'paid' : 'unpaid';
}

export function caState(request: AgentRequest): Exclude<CaFilter, ''> {
  const vs = reportOf(request)?.validation_status;
  if (vs === 'pending_validation') return 'pending';
  if (vs === 'under_review' || vs === 'approved' || vs === 'rejected') return vs;
  return 'none';
}

/** Which In progress group a request belongs to. Mirrors awaitingActionKind on the server. */
export function inProgressKind(request: AgentRequest): InProgressKind | null {
  const report = reportOf(request);
  const vs = report?.validation_status ?? '';
  if (vs === 'rejected') return 'rejected';
  if (vs === 'pending_validation' || vs === 'under_review') return 'ca';
  if (vs === 'pending_payment' || vs === 'draft' || (vs === 'approved' && !isReportPaid(report))) return 'payment';
  return request.generationStartedAt || request.draftId || request.reportId ? 'preparation' : null;
}

export function departmentOf(request: Pick<AgentRequest, 'departmentId'>): { id: string; name: string } | null {
  const dept = request.departmentId;
  if (!dept) return null;
  if (typeof dept === 'string') return { id: dept, name: '' };
  return dept._id ? { id: dept._id, name: dept.name ?? '' } : null;
}

export function uniqueDepartments(requests: Pick<AgentRequest, 'departmentId'>[]): { value: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const r of requests) {
    const d = departmentOf(r);
    if (d?.name) seen.set(d.id, d.name);
  }
  return [...seen.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

export function matchesSearch(contact: { name: string; phone: string; email: string }, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  if (contact.name.toLowerCase().includes(q) || contact.email.toLowerCase().includes(q) || contact.phone.toLowerCase().includes(q)) return true;
  // Only a term that looks like a phone number is compared by digits, so "Applicant 2" cannot match a number with a 2.
  if (!/^[\d\s+()-]+$/.test(q)) return false;
  const digits = q.replace(/\D/g, '');
  return digits.length >= 2 && contact.phone.replace(/\D/g, '').includes(digits);
}

export function filterRequests(requests: AgentRequest[], filters: QueueFilters): AgentRequest[] {
  return requests.filter((r) => {
    if (!matchesSearch(applicantOf(r), filters.search)) return false;
    if (filters.department && departmentOf(r)?.id !== filters.department) return false;
    if (filters.payment && paymentState(r) !== filters.payment) return false;
    if (filters.ca && caState(r) !== filters.ca) return false;
    return true;
  });
}

export const activeFilterCount = (filters: QueueFilters) =>
  [filters.department, filters.payment, filters.ca].filter(Boolean).length;
