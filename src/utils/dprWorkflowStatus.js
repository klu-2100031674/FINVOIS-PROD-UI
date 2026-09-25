export const CLAIM_TTL_MS = 15 * 60 * 1000;

export const WORKFLOW_KEYS = {
  pending: 'pending',
  initiated: 'initiated',
  preparation: 'preparation',
  ca_validation: 'ca_validation',
  generated: 'generated',
  rejected: 'rejected',
};

export const WORKFLOW_LABELS = {
  pending: 'Pending',
  initiated: 'Request initiated',
  preparation: 'DPR under preparation',
  ca_validation: 'DPR sent for CA validation',
  generated: 'DPR Generated successfully',
  rejected: 'Rejected',
};

export const WORKFLOW_BADGE_CLASS = {
  pending: 'bg-gray-100 text-gray-800',
  initiated: 'bg-amber-100 text-amber-800',
  preparation: 'bg-blue-100 text-blue-800',
  ca_validation: 'bg-purple-100 text-purple-800',
  generated: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'object') return value._id || value.id || null;
  return value;
}

function reportFromRequest(request, report) {
  if (report && typeof report === 'object' && report.validation_status !== undefined) return report;
  const nested = request?.reportId;
  if (nested && typeof nested === 'object' && nested.validation_status !== undefined) return nested;
  return report || request?.report || null;
}

function isGenerationStarted(request, reportDoc) {
  if (request?.generationStartedAt) return true;
  if (request?.draftId) return true;
  const vs = reportDoc?.validation_status;
  return vs === 'draft' || vs === 'pending_payment';
}

export function getDprWorkflowStatus(request, report) {
  if (request?.workflow?.key && request?.workflow?.label) {
    return {
      key: request.workflow.key,
      label: request.workflow.label,
      badgeClass: WORKFLOW_BADGE_CLASS[request.workflow.key] || WORKFLOW_BADGE_CLASS.pending,
    };
  }

  const reportDoc = reportFromRequest(request, report);
  const vs = reportDoc?.validation_status || null;

  let key = WORKFLOW_KEYS.pending;
  if (vs === 'approved') key = WORKFLOW_KEYS.generated;
  else if (vs === 'rejected') key = WORKFLOW_KEYS.rejected;
  else if (vs === 'pending_validation' || vs === 'under_review') key = WORKFLOW_KEYS.ca_validation;
  else if (isGenerationStarted(request, reportDoc)) key = WORKFLOW_KEYS.preparation;
  else if (request?.reportId && !vs) key = WORKFLOW_KEYS.preparation;
  else {
    const staffed =
      request?.status === 'claimed' ||
      request?.status === 'assigned' ||
      Boolean(idOf(request?.claimedBy) || idOf(request?.assignedTo));
    if (staffed && request?.status !== 'open') key = WORKFLOW_KEYS.initiated;
  }

  return {
    key,
    label: WORKFLOW_LABELS[key],
    badgeClass: WORKFLOW_BADGE_CLASS[key],
  };
}

export function canUnclaimRequest(request, report) {
  return getDprWorkflowStatus(request, report).key === WORKFLOW_KEYS.initiated;
}

export function canAssignRequest(request, report) {
  return getDprWorkflowStatus(request, report).key === WORKFLOW_KEYS.pending;
}

/** Admin can unassign even after claim, assignment, or report generation. */
export function canAdminUnassignRequest(request) {
  if (!request) return false;
  const staffed =
    request.status === 'claimed' ||
    request.status === 'assigned' ||
    Boolean(idOf(request.claimedBy) || idOf(request.assignedTo));
  return staffed && request.status !== 'open';
}

/** Admin can assign any request that currently has no CS owner. */
export function canAdminAssignRequest(request) {
  if (!request) return false;
  return !canAdminUnassignRequest(request);
}

/** Display name of the CS agent assigned to / claiming a request. */
export function staffHandlerName(requestLike) {
  const request = requestLike?.departmentRequest || requestLike;
  const person = request?.assignedTo || request?.claimedBy;
  if (!person || typeof person === 'string') return '';
  return String(person.name || person.email || '').trim();
}

function hasPersistedRef(value) {
  if (!value) return false;
  if (typeof value === 'object') return Boolean(value._id || value.id);
  return String(value).trim() !== '';
}

export function claimExpiresAt(request) {
  if (request?.status !== 'claimed' && request?.status !== 'assigned') return null;
  if (request.generationStartedAt) return null;
  if (hasPersistedRef(request.draftId) || hasPersistedRef(request.reportId)) return null;
  if (!request.claimedAt) return null;
  const claimedAt = new Date(request.claimedAt);
  if (Number.isNaN(claimedAt.getTime())) return null;
  return new Date(claimedAt.getTime() + CLAIM_TTL_MS);
}

export function workflowFromLead(lead) {
  if (lead?.workflow?.key) {
    return {
      key: lead.workflow.key,
      label: lead.workflow.label || WORKFLOW_LABELS[lead.workflow.key],
      badgeClass: WORKFLOW_BADGE_CLASS[lead.workflow.key] || WORKFLOW_BADGE_CLASS.pending,
    };
  }
  const request = lead?.departmentRequest || {
    status: lead?.departmentRequest?.status,
    claimedBy: lead?.departmentRequest?.claimedBy,
    assignedTo: lead?.departmentRequest?.assignedTo,
    draftId: lead?.departmentRequest?.draftId,
    generationStartedAt: lead?.departmentRequest?.generationStartedAt,
    claimedAt: lead?.departmentRequest?.claimedAt,
    reportId: lead?.report,
  };
  return getDprWorkflowStatus(request, lead?.report);
}
