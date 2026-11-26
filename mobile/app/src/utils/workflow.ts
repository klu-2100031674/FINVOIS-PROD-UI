// Port of the assign / unassign rules in FINVOIS-DEV-UI/src/utils/dprWorkflowStatus.js (read-only reference, never
// imported). The server decides too (it refuses a bad assign with 400); this only decides which buttons to offer.
// src/utils/__tests__/workflow.parity.json holds the web function's answers for every combination, see workflow.test.ts.

export type WorkflowKey = 'pending' | 'initiated' | 'preparation' | 'ca_validation' | 'generated' | 'rejected';

type Ref = string | { _id?: string; id?: string; name?: string; email?: string } | null | undefined;
type ReportLike = { validation_status?: string } | string | null | undefined;

/** The slice of a DepartmentRequest the rules read. Populated or bare ids both work. */
export interface WorkflowRequest {
  status?: string | null;
  workflow?: { key?: string; label?: string } | null;
  assignedTo?: Ref;
  claimedBy?: Ref;
  reportId?: ReportLike;
  report?: ReportLike;
  generationStartedAt?: string | null;
  draftId?: unknown;
}

const idOf = (value: Ref): string | null => {
  if (!value) return null;
  if (typeof value === 'object') return value._id || value.id || null;
  return value;
};

function reportOf(request: WorkflowRequest | null | undefined, report?: ReportLike): ReportLike {
  if (report && typeof report === 'object' && report.validation_status !== undefined) return report;
  const nested = request?.reportId;
  if (nested && typeof nested === 'object' && nested.validation_status !== undefined) return nested;
  return report || request?.report || null;
}

const statusOf = (report: ReportLike) => (report && typeof report === 'object' ? report.validation_status : undefined);

/** Same answer as the web's getDprWorkflowStatus(...).key: the server's workflow wins, else derive it. */
export function workflowKey(request: WorkflowRequest | null | undefined, report?: ReportLike): WorkflowKey {
  if (request?.workflow?.key && request.workflow.label) return request.workflow.key as WorkflowKey;

  const vs = statusOf(reportOf(request, report));
  if (vs === 'approved') return 'generated';
  if (vs === 'rejected') return 'rejected';
  if (vs === 'pending_validation' || vs === 'under_review') return 'ca_validation';
  if (request?.generationStartedAt || request?.draftId || vs === 'draft' || vs === 'pending_payment') return 'preparation';
  if (request?.reportId && !vs) return 'preparation';
  return isStaffed(request) ? 'initiated' : 'pending';
}

/** True while a staff member owns the request (claimed or assigned). An open request is never staffed. */
export function isStaffed(request: WorkflowRequest | null | undefined): boolean {
  if (!request) return false;
  const staffed =
    request.status === 'claimed' ||
    request.status === 'assigned' ||
    Boolean(idOf(request.claimedBy) || idOf(request.assignedTo));
  return staffed && request.status !== 'open';
}

/** With the CA or already generated: assignment can no longer change. */
export function isLocked(request: WorkflowRequest | null | undefined, report?: ReportLike): boolean {
  const key = workflowKey(request, report);
  return key === 'ca_validation' || key === 'generated';
}

export function canAdminAssign(request: WorkflowRequest | null | undefined, report?: ReportLike): boolean {
  if (!request || isLocked(request, report)) return false;
  return !isStaffed(request);
}

export function canAdminUnassign(request: WorkflowRequest | null | undefined, report?: ReportLike): boolean {
  if (!request || isLocked(request, report)) return false;
  return isStaffed(request);
}

/** Name of the staff member handling the request, or an empty string. */
export function staffHandlerName(request: WorkflowRequest | null | undefined): string {
  const person = request?.assignedTo || request?.claimedBy;
  if (!person || typeof person === 'string') return '';
  return String(person.name || person.email || '').trim();
}
