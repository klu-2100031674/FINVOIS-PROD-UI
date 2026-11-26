// Pure validation of a push or deep-link target. No React Native imports so Node tests can load it.
// A payload is only ever a hint about where to look: the screen it opens re-fetches with the user's own session.
export const PUSH_TYPES = ['dpr_assigned', 'report_approved', 'claim_expiring', 'dpr_submitted', 'enquiry_submitted', 'report_submitted', 'report_rejected', 'pending_digest'] as const;
export type PushType = (typeof PUSH_TYPES)[number];
export type PushRole = 'admin' | 'customer_service';
export interface PushTarget {
  type: PushType;
  id: string;
}

const ID_RE = /^[a-f0-9]{24}$/;

/** Shape check only: allow-listed type and a 24-char hex id. Anything else is null. */
export function parsePushData(data: unknown): PushTarget | null {
  if (!data || typeof data !== 'object') return null;
  const { type, id } = data as Record<string, unknown>;
  if (typeof type !== 'string' || typeof id !== 'string') return null;
  if (!(PUSH_TYPES as readonly string[]).includes(type) || !ID_RE.test(id)) return null;
  return { type: type as PushType, id };
}

/**
 * New DPRs, MSME enquiries and the twice-daily pending summary go to both roles; report_submitted (waiting for
 * CA approval) is admin only; the rest (assigned, approved, rejected, claim expiring) are for agents only.
 */
export const allowedForRole = (type: PushType, role: PushRole) =>
  type === 'dpr_submitted' ||
  type === 'enquiry_submitted' ||
  type === 'pending_digest' ||
  (type === 'report_submitted' ? role === 'admin' : role === 'customer_service');

// Generic copy only, same wording the server sends (docs/08). Shown instead of the payload's own text.
export const PUSH_COPY: Record<PushType, { title: string; body: string }> = {
  dpr_assigned: { title: 'New DPR assigned', body: 'Open the app to view it.' },
  report_approved: { title: 'Report approved', body: 'A report is ready to send.' },
  claim_expiring: { title: 'Claim expiring soon', body: 'A request will be released soon.' },
  dpr_submitted: { title: 'New DPR submitted', body: 'Open the app to view pending requests.' },
  enquiry_submitted: { title: 'New MSME enquiry', body: 'Open the app to view the enquiry.' },
  report_submitted: { title: 'Report waiting for approval', body: 'A report needs CA validation.' },
  report_rejected: { title: 'Report needs changes', body: 'A report was sent back. Open the app to see why.' },
  // The server's system notification carries the counts; the in-app banner stays generic.
  pending_digest: { title: 'Pending work', body: 'Some work from today or yesterday is still waiting.' },
};
