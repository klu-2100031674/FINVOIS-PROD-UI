import { AxiosError } from 'axios';
import {
  CLAIM_TTL_MS,
  claimErrorMessage,
  claimExpiresAt,
  claimMsLeft,
  formatClaimLeft,
  releaseErrorMessage,
} from '../claim';

const NOW = Date.parse('2026-10-01T10:00:00Z');
const minutesAgo = (m: number) => new Date(NOW - m * 60000).toISOString();

const httpError = (status: number, data: unknown) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: {} as never,
  });

describe('claim countdown', () => {
  it('expires 15 minutes after the claim, like CLAIM_TTL_MS on the server', () => {
    expect(CLAIM_TTL_MS).toBe(15 * 60 * 1000);
    const expires = claimExpiresAt({ status: 'claimed', claimedAt: minutesAgo(5) });
    expect(expires?.getTime()).toBe(NOW + 10 * 60000);
    expect(claimMsLeft({ status: 'assigned', claimedAt: minutesAgo(5) }, NOW)).toBe(10 * 60000);
  });

  it('goes negative once the claim has run out', () => {
    expect(claimMsLeft({ status: 'claimed', claimedAt: minutesAgo(16) }, NOW)).toBe(-60000);
  });

  it('has no timer for open or completed requests', () => {
    expect(claimExpiresAt({ status: 'open', claimedAt: minutesAgo(1) })).toBeNull();
    expect(claimExpiresAt({ status: 'completed', claimedAt: minutesAgo(1) })).toBeNull();
  });

  it('has no timer once generation has started or a draft or report exists', () => {
    const base = { status: 'claimed', claimedAt: minutesAgo(1) };
    expect(claimExpiresAt({ ...base, generationStartedAt: minutesAgo(1) })).toBeNull();
    expect(claimExpiresAt({ ...base, draftId: { _id: 'd1' } })).toBeNull();
    expect(claimExpiresAt({ ...base, draftId: 'd1' })).toBeNull();
    expect(claimExpiresAt({ ...base, reportId: { _id: 'r1' } })).toBeNull();
    expect(claimExpiresAt({ ...base, reportId: null, draftId: null })).not.toBeNull();
  });

  it('has no timer without a usable claim time', () => {
    expect(claimExpiresAt({ status: 'claimed' })).toBeNull();
    expect(claimExpiresAt({ status: 'claimed', claimedAt: 'not a date' })).toBeNull();
    expect(claimExpiresAt(null)).toBeNull();
  });

  it('rounds minutes up so the last minute still reads 1 min', () => {
    expect(formatClaimLeft(15 * 60000)).toBe('Claim expires in 15 min');
    expect(formatClaimLeft(14 * 60000 + 1)).toBe('Claim expires in 15 min');
    expect(formatClaimLeft(59000)).toBe('Claim expires in 1 min');
    expect(formatClaimLeft(0)).toBe('Claim expiring now');
    expect(formatClaimLeft(-5000)).toBe('Claim expiring now');
  });
});

describe('claim errors', () => {
  it('turns "someone else claimed it" into the friendly message', () => {
    const err = httpError(400, { success: false, error: 'This request is not open for claiming' });
    expect(claimErrorMessage(err)).toBe('Another agent claimed this request.');
    expect(claimErrorMessage(httpError(409, {}))).toBe('Another agent claimed this request.');
  });

  it('shows the server message for other failures and a fallback when there is none', () => {
    expect(claimErrorMessage(httpError(404, { error: 'Request not found' }))).toBe('Request not found');
    expect(claimErrorMessage(httpError(500, {}))).toBe("Couldn't claim this request. Try again.");
    expect(claimErrorMessage(new Error('boom'))).toBe("Couldn't claim this request. Try again.");
  });

  it('shows the server message when a release is refused', () => {
    expect(releaseErrorMessage(httpError(400, { error: 'Cannot unclaim after report generation has started' }))).toBe(
      'Cannot unclaim after report generation has started'
    );
  });
});
