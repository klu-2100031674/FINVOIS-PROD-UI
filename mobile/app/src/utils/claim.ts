import { apiErrorMessage, apiErrorStatus } from '~/utils/errors';

// Mirrors CLAIM_TTL_MS in FINVOIS-DEV-API src/utils/dprWorkflowStatus.js. The server is the authority (a job returns a
// stale claim to Open); this only drives the countdown, so a skewed phone clock shows a wrong time, never a wrong state.
export const CLAIM_TTL_MS = 15 * 60 * 1000;
export const CLAIM_TICK_MS = 30 * 1000;

/** The slice of a DepartmentRequest the claim timer reads. */
export interface ClaimFields {
  status?: string | null;
  claimedAt?: string | null;
  generationStartedAt?: string | null;
  draftId?: unknown;
  reportId?: unknown;
}

function hasRef(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === 'object') return Boolean((value as { _id?: unknown; id?: unknown })._id || (value as { id?: unknown }).id);
  return String(value).trim() !== '';
}

/** Port of claimExpiresAt(): only a claimed or assigned request that has not started generation can expire. */
export function claimExpiresAt(request: ClaimFields | null | undefined): Date | null {
  if (!request) return null;
  if (request.status !== 'claimed' && request.status !== 'assigned') return null;
  if (request.generationStartedAt) return null;
  if (hasRef(request.draftId) || hasRef(request.reportId)) return null;
  if (!request.claimedAt) return null;
  const claimedAt = new Date(request.claimedAt);
  if (Number.isNaN(claimedAt.getTime())) return null;
  return new Date(claimedAt.getTime() + CLAIM_TTL_MS);
}

/** Milliseconds left on the claim (zero or negative once expired), or null when no timer applies. */
export function claimMsLeft(request: ClaimFields | null | undefined, now: number = Date.now()): number | null {
  const expires = claimExpiresAt(request);
  return expires ? expires.getTime() - now : null;
}

/** Rounds up, so a fresh claim reads "15 min" and the last minute reads "1 min". */
export function formatClaimLeft(ms: number): string {
  if (ms <= 0) return 'Claim expiring now';
  return `Claim expires in ${Math.ceil(ms / 60000)} min`;
}

/** Claim failed because someone else got there first (the API answers 400 "not open for claiming"). */
export function isClaimConflict(err: unknown): boolean {
  const status = apiErrorStatus(err);
  return status === 400 || status === 409;
}

export function claimErrorMessage(err: unknown): string {
  if (isClaimConflict(err)) return 'Another agent claimed this request.';
  return apiErrorMessage(err, "Couldn't claim this request. Try again.");
}

export function releaseErrorMessage(err: unknown): string {
  return apiErrorMessage(err, "Couldn't release this request. Try again.");
}
