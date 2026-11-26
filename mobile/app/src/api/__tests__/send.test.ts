import { AxiosError } from 'axios';
import { api } from '../client';
import {
  PAYMENT_REQUIRED_MESSAGE,
  buildRequest,
  defaultRecipients,
  emailError,
  mergeResults,
  phoneError,
  retryParts,
  sendErrorMessage,
  sendReport,
  type SendResult,
} from '../send';

jest.mock('../client', () => ({ api: { post: jest.fn() } }));
const post = api.post as jest.Mock;

const httpError = (status: number, data: unknown) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status, data, statusText: '', headers: {}, config: {} as never });

const ok = (recipient: SendResult['recipient'], channel: SendResult['channel']): SendResult => ({ recipient, channel, status: 'sent' });
const bad = (recipient: SendResult['recipient'], channel: SendResult['channel'], reason = 'Delivery failed.'): SendResult => ({
  recipient,
  channel,
  status: 'failed',
  reason,
});

beforeEach(() => post.mockReset());

describe('defaults', () => {
  it('admin gets me and the assigned staff, agent gets the applicant', () => {
    expect(defaultRecipients('admin', true)).toEqual(['me', 'staff']);
    expect(defaultRecipients('customer_service', true)).toEqual(['applicant']);
  });

  it('never preselects staff when nobody is assigned', () => {
    expect(defaultRecipients('admin', false)).toEqual(['me']);
  });
});

describe('contact validation', () => {
  it.each(['9876543210', '+919876543210', '98765 43210', '+1 (415) 555-0132', '+44 20 7946 0958'])('accepts the phone %s', (v) => {
    expect(phoneError(v)).toBeNull();
  });

  it.each(['', '   ', '12345', '98765432101', '919876543210', '+0123456789', '+91', 'abcdefghij', '98765-4321x'])('rejects the phone "%s"', (v) => {
    expect(phoneError(v)).not.toBeNull();
  });

  it.each(['a@b.co', ' name@example.com ', 'first.last+tag@sub.example.org'])('accepts the email %s', (v) => {
    expect(emailError(v)).toBeNull();
  });

  it.each(['', 'name', 'name@', '@example.com', 'name@example', 'na me@example.com', `${'a'.repeat(250)}@x.co`])('rejects the email "%s"', (v) => {
    expect(emailError(v)).not.toBeNull();
  });
});

describe('buildRequest', () => {
  const contact = { phone: ' +91 98765 43210 ', email: ' a@b.co ' };

  it('adds no applicant block when the applicant is not a recipient', () => {
    expect(buildRequest({ recipients: ['me', 'staff'], channels: ['whatsapp', 'email'] }, contact)).toEqual({
      recipients: ['me', 'staff'],
      channels: ['whatsapp', 'email'],
    });
  });

  it('sends only the contact fields for the chosen channels, trimmed', () => {
    expect(buildRequest({ recipients: ['applicant'], channels: ['whatsapp'] }, contact).applicant).toEqual({ phone: '+919876543210' });
    expect(buildRequest({ recipients: ['applicant'], channels: ['email'] }, contact).applicant).toEqual({ email: 'a@b.co' });
    expect(buildRequest({ recipients: ['me', 'applicant'], channels: ['whatsapp', 'email'] }, contact).applicant).toEqual({
      phone: '+919876543210',
      email: 'a@b.co',
    });
  });
});

describe('retryParts: only the failed combinations', () => {
  it('has nothing to retry when everything was delivered', () => {
    expect(retryParts([ok('me', 'whatsapp'), ok('me', 'email')])).toEqual([]);
  });

  it('retries a whole failed channel as one request on that channel only', () => {
    const results = [bad('me', 'whatsapp'), ok('me', 'email'), bad('staff', 'whatsapp'), ok('staff', 'email')];
    expect(retryParts(results)).toEqual([{ recipients: ['me', 'staff'], channels: ['whatsapp'] }]);
  });

  it('retries one failed pair alone', () => {
    const results = [ok('me', 'whatsapp'), ok('me', 'email'), ok('staff', 'whatsapp'), bad('staff', 'email')];
    expect(retryParts(results)).toEqual([{ recipients: ['staff'], channels: ['email'] }]);
  });

  it('never re-sends a delivered pair when the failures are not a full grid', () => {
    // me failed on WhatsApp, staff failed on email: a single me+staff x both request would repeat two deliveries.
    const results = [bad('me', 'whatsapp'), ok('me', 'email'), ok('staff', 'whatsapp'), bad('staff', 'email')];
    const parts = retryParts(results);
    expect(parts).toEqual([
      { recipients: ['me'], channels: ['whatsapp'] },
      { recipients: ['staff'], channels: ['email'] },
    ]);
    const pairs = parts.flatMap((p) => p.recipients.flatMap((r) => p.channels.map((c) => `${r}:${c}`)));
    expect(pairs.sort()).toEqual(['me:whatsapp', 'staff:email']);
  });

  it('merges channels that failed for the same recipients into one request', () => {
    expect(retryParts([bad('applicant', 'whatsapp'), bad('applicant', 'email')])).toEqual([
      { recipients: ['applicant'], channels: ['whatsapp', 'email'] },
    ]);
  });
});

describe('mergeResults', () => {
  it('replaces the retried rows in place and leaves delivered rows alone', () => {
    const before = [bad('me', 'whatsapp'), ok('me', 'email'), bad('staff', 'whatsapp')];
    expect(mergeResults(before, [ok('me', 'whatsapp'), bad('staff', 'whatsapp', 'Still failing.')])).toEqual([
      ok('me', 'whatsapp'),
      ok('me', 'email'),
      bad('staff', 'whatsapp', 'Still failing.'),
    ]);
  });
});

describe('sendErrorMessage', () => {
  it('shows the fixed payment message for 402 and nothing that suggests a way around it', () => {
    const msg = sendErrorMessage(httpError(402, { error: 'Something else the server said', error_code: 'PAYMENT_REQUIRED' }));
    expect(msg).toBe('Payment must be completed before the report can be sent.');
    expect(msg).toBe(PAYMENT_REQUIRED_MESSAGE);
  });

  it.each([
    [400, 'Report must be approved before it can be sent.'],
    [403, 'You can only send reports for requests assigned to you.'],
    [429, 'Too many requests. Wait a minute and try again.'],
    [502, 'The report could not be delivered. Check the results and try again.'],
  ])('shows the server message for %i', (status, error) => {
    expect(sendErrorMessage(httpError(status, { success: false, error }))).toBe(error);
  });

  it('falls back to a safe sentence for server faults and unreadable bodies', () => {
    expect(sendErrorMessage(httpError(500, { error: 'Cast to ObjectId failed for value x' }))).toBe("The report couldn't be sent. Try again.");
    expect(sendErrorMessage(httpError(400, '<html>bad gateway</html>'))).toBe("The report couldn't be sent. Try again.");
    expect(sendErrorMessage(new Error('boom'))).toBe("The report couldn't be sent. Try again.");
  });

  it('reports a dropped connection as offline', () => {
    expect(sendErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe("You're offline. Check your connection.");
  });
});

describe('sendReport', () => {
  it('posts the body to the report send route and returns the results', async () => {
    post.mockResolvedValue({ data: { success: true, results: [ok('me', 'email')] } });
    const body = { recipients: ['me' as const], channels: ['email' as const] };
    await expect(sendReport('rep1', body)).resolves.toEqual({ results: [ok('me', 'email')] });
    expect(post).toHaveBeenCalledWith('/mobile/reports/rep1/send', body);
  });

  it('returns the per-pair results of a 502 instead of throwing, with the server message', async () => {
    const results = [bad('me', 'email'), bad('me', 'whatsapp')];
    post.mockRejectedValue(httpError(502, { success: false, error: 'The report could not be delivered.', results }));
    await expect(sendReport('rep1', { recipients: ['me'], channels: ['email', 'whatsapp'] })).resolves.toEqual({
      results,
      message: 'The report could not be delivered.',
    });
  });

  it('throws every other failure, including a 502 without results', async () => {
    post.mockRejectedValueOnce(httpError(402, { error: PAYMENT_REQUIRED_MESSAGE }));
    await expect(sendReport('rep1', { recipients: ['me'], channels: ['email'] })).rejects.toMatchObject({ response: { status: 402 } });
    post.mockRejectedValueOnce(httpError(502, '<html>bad gateway</html>'));
    await expect(sendReport('rep1', { recipients: ['me'], channels: ['email'] })).rejects.toBeDefined();
  });

  it('rejects an answer that has no results list', async () => {
    post.mockResolvedValue({ data: { success: true } });
    await expect(sendReport('rep1', { recipients: ['me'], channels: ['email'] })).rejects.toThrow();
  });
});
