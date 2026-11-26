import type { AgentRequest, LinkedReport, Queue } from '~/api/agentRequests';
import { apiErrorStatus } from '~/utils/errors';

export type AgentTab = 'open' | 'mine' | 'active' | 'done';

export const ACCESS_DENIED_MESSAGE = "You don't have access to this request.";

/**
 * Another agent's request (403), a missing one (404) or a malformed id (400, from a stale link) all read the same,
 * so the screen never confirms whether an id exists.
 */
export const isAccessDenied = (err: unknown) => [400, 403, 404].includes(apiErrorStatus(err) ?? 0);

export const AGENT_TABS: { key: AgentTab; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'mine', label: 'Mine' },
  { key: 'active', label: 'In progress' },
  { key: 'done', label: 'Done' },
];

/** Mine: claimed by or assigned to me, not started. In progress: started, not finished. Done: mine, approved and paid. */
export const TAB_QUEUE: Record<AgentTab, Queue> = { open: 'open', mine: 'assigned', active: 'in-progress', done: 'cs-completed' };

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Same precedence as the web request queue: the customer account first, then what the applicant typed in the form. */
export function applicantOf(request: AgentRequest): { name: string; phone: string; email: string } {
  const data = request.submittedData ?? {};
  const customer = request.customerId;
  const email = text(customer?.email) || text(data.govt_builtin_email) || text(data.email) || text(data.applicantEmail);
  return {
    name:
      text(customer?.name) ||
      text(data.govt_builtin_name) ||
      text(data.applicantName) ||
      text(data.name) ||
      text(data.fullname) ||
      'Applicant',
    phone: text(customer?.phone) || text(data.govt_builtin_phone) || text(data.phone) || text(data.mobile) || text(data.mobileNumber),
    // Accounts created from a phone number carry a placeholder address that is not a real mailbox.
    email: email.endsWith('@phone.customer.finvois') ? '' : email,
  };
}

/** Form name plus the scheme the applicant picked, when both exist: "AP MSME DPR · PMEGP". */
export function schemeLine(request: AgentRequest): string {
  const scheme = text(request.submittedData?.scheme) || text(request.submittedData?.schemeName);
  return [text(request.formId?.name), scheme].filter(Boolean).join(' · ') || 'Request';
}

/** tel: link for the dialer, or null when the number is too short to dial. */
export function telUrl(phone?: string | null): string | null {
  const dialable = String(phone ?? '').replace(/[^\d+]/g, '');
  return dialable.replace(/\D/g, '').length >= 5 ? `tel:${dialable}` : null;
}

/** wa.me link: digits only, with a country code. A 10-digit Indian number gets 91, a leading 0 or 00 is dropped. */
export function whatsappUrl(phone?: string | null): string | null {
  let digits = String(phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

export const workflowKeyOf = (request: AgentRequest) => request.workflow?.key ?? 'pending';

const ref = (value: { _id?: string } | string | null | undefined) => (typeof value === 'object' && value ? value._id : value) ?? null;

export const reportOf = (request: AgentRequest) =>
  request.reportId && typeof request.reportId === 'object' ? request.reportId : null;

export const canClaim = (request: AgentRequest) => request.status === 'open';

/** The server only lets the claimer release, and only before generation starts (workflow still "initiated"). */
export const canRelease = (request: AgentRequest, userId: string) =>
  ref(request.claimedBy) === userId && workflowKeyOf(request) === 'initiated';

/** Assigned by the CA: the agent works it but cannot give it back; the CA unassigns. */
export const isAssignedByCa = (request: AgentRequest, userId: string) =>
  ref(request.assignedTo) === userId && !ref(request.claimedBy);

/** A button shown for convenience; the server still requires an approved, paid report. */
export const canSendToApplicant = (request: AgentRequest) =>
  workflowKeyOf(request) === 'generated' && Boolean(reportOf(request));

export const hasApprovedReport = (request: AgentRequest) => reportOf(request)?.validation_status === 'approved';

/** The server treats a free-credit report as paid when it sorts requests into queues. */
export function isReportPaid(report: LinkedReport | null | undefined): boolean {
  const p = report?.payment;
  return p?.status === 'completed' || p?.is_free_credit === true || p?.is_beta_free === true;
}

/** Why this request's report cannot be sent yet, in the web's wording. Null when nothing blocks it or there is no report. */
export function sendBlockedReason(request: AgentRequest): string | null {
  const report = reportOf(request);
  if (!report) return null;
  if (report.validation_status === 'rejected') return 'This report was rejected and cannot be sent. Generate a new report on the web if needed.';
  if (!isReportPaid(report)) return 'WhatsApp, email and download are available after payment is completed.';
  if (report.validation_status !== 'approved') return 'Sending is available only after CA approval. This screen updates automatically.';
  return null;
}

const REPORT_STATUS_NOTE: Record<string, string> = {
  approved: 'The report is approved. You can send it to the applicant.',
  rejected: 'The CA rejected this report. Generate a new one on the web if needed.',
  under_review: 'A CA is reviewing the report. This updates automatically.',
  pending_validation: 'The report is waiting for CA review. This updates automatically.',
  pending_payment: 'Waiting for the customer to pay.',
};

export const reportStatusNote = (status?: string) => REPORT_STATUS_NOTE[status ?? ''] ?? 'Report generation is in progress.';

/** Statuses that change on their own, so the screen keeps checking while one is showing. */
export const isReportStatusChanging = (status?: string) =>
  status === 'pending_payment' || status === 'pending_validation' || status === 'under_review';

export const departmentName = (request: AgentRequest) =>
  typeof request.departmentId === 'object' && request.departmentId ? (request.departmentId.name ?? '') : '';

export type StepState = 'done' | 'current' | 'todo' | 'rejected';

const STEPS = [
  { key: 'initiated', label: 'Initiated' },
  { key: 'preparation', label: 'Preparing' },
  { key: 'ca_validation', label: 'With CA' },
  { key: 'generated', label: 'Generated' },
];

// Index of the step each workflow key sits on. A rejected report stopped at the CA step.
const ACTIVE_STEP: Record<string, number> = { pending: -1, initiated: 0, preparation: 1, ca_validation: 2, rejected: 2, generated: 3 };

/** Initiated, Preparing, With CA, Generated, each marked done, current, todo, or rejected. */
export function workflowTimeline(key: string): { key: string; label: string; state: StepState }[] {
  const active = ACTIVE_STEP[key] ?? -1;
  return STEPS.map((step, i) => {
    let state: StepState = 'todo';
    if (i < active || (i === active && key === 'generated')) state = 'done';
    else if (i === active) state = key === 'rejected' ? 'rejected' : 'current';
    return { ...step, label: i === active && key === 'rejected' ? 'Rejected' : step.label, state };
  });
}
