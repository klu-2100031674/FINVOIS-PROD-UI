import { isAxiosError } from 'axios';
import { api } from './client';
import { apiErrorMessage, apiErrorStatus } from '~/utils/errors';

export type SendRecipient = 'me' | 'staff' | 'applicant';
export type SendChannel = 'whatsapp' | 'email';
export type SendRole = 'admin' | 'customer_service';

/** One recipient reached (or not) on one channel. */
export interface SendResult {
  recipient: SendRecipient;
  channel: SendChannel;
  status: 'sent' | 'failed';
  reason?: string;
}

/** The server sends every recipient on every channel listed, so a request is a recipients x channels grid. */
export interface SendPart {
  recipients: SendRecipient[];
  channels: SendChannel[];
}

export interface SendRequest extends SendPart {
  applicant?: { phone?: string; email?: string };
}

/** `message` is the server's own sentence when it answered 502 (nothing was delivered). */
export interface SendOutcome {
  results: SendResult[];
  message?: string;
}

export const RECIPIENTS: SendRecipient[] = ['me', 'staff', 'applicant'];
export const CHANNELS: SendChannel[] = ['whatsapp', 'email'];

export const PAYMENT_REQUIRED_MESSAGE = 'Payment must be completed before the report can be sent.';

const serverMessage = (err: unknown): string | null => {
  const msg = isAxiosError(err) ? (err.response?.data as { error?: unknown } | undefined)?.error : null;
  return typeof msg === 'string' && msg.trim() && msg.length < 200 ? msg : null;
};

/** Short sentence for a failed request. 402 is fixed text on purpose: it offers no way around the payment gate. */
export function sendErrorMessage(err: unknown): string {
  const status = apiErrorStatus(err);
  if (status === 402) return PAYMENT_REQUIRED_MESSAGE;
  const server = serverMessage(err);
  if (server && [400, 403, 404, 429, 502].includes(status ?? 0)) return server;
  return apiErrorMessage(err, "The report couldn't be sent. Try again.");
}

export async function sendReport(reportId: string, body: SendRequest): Promise<SendOutcome> {
  try {
    const { data } = await api.post<{ results?: SendResult[] }>(`/mobile/reports/${reportId}/send`, body);
    if (!Array.isArray(data?.results)) throw new Error('Unexpected response');
    return { results: data.results };
  } catch (err) {
    // 502 means every delivery failed. The body still lists each one, which is what the user needs to see.
    const results = isAxiosError(err) && err.response?.status === 502 ? (err.response.data as { results?: unknown })?.results : null;
    if (Array.isArray(results)) return { results: results as SendResult[], message: serverMessage(err) ?? undefined };
    throw err;
  }
}

/** Admin: me and the assigned staff member. Agent: the applicant. Staff is never preselected when there is none. */
export const defaultRecipients = (role: SendRole, hasStaff: boolean): SendRecipient[] =>
  role === 'admin' ? (hasStaff ? ['me', 'staff'] : ['me']) : ['applicant'];

const compact = (v: string) => v.trim().replace(/[\s\-().]/g, '');

/** 10 digits or E.164. The server accepts more forms; this is only to catch typos before sending. */
export function phoneError(value: string): string | null {
  const v = compact(value);
  if (!v) return "Enter the applicant's phone number.";
  return /^(\d{10}|\+[1-9]\d{7,14})$/.test(v) ? null : 'Use a 10-digit number, or include the country code like +919876543210.';
}

export function emailError(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter the applicant's email address.";
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address.';
}

/** Applicant contact is sent as shown on screen, so a message never goes to a contact the sender did not see. */
export function buildRequest(part: SendPart, contact: { phone: string; email: string }): SendRequest {
  if (!part.recipients.includes('applicant')) return { ...part };
  const applicant: NonNullable<SendRequest['applicant']> = {};
  if (part.channels.includes('whatsapp')) applicant.phone = compact(contact.phone);
  if (part.channels.includes('email')) applicant.email = contact.email.trim();
  return { ...part, applicant };
}

/**
 * Requests that redo only the failed recipient x channel pairs. A pair that already went through is never listed:
 * the grid is split per channel, and channels that failed for the same recipients share one request.
 */
export function retryParts(results: SendResult[]): SendPart[] {
  const parts = new Map<string, SendPart>();
  for (const channel of CHANNELS) {
    const recipients = RECIPIENTS.filter((r) => results.some((x) => x.status === 'failed' && x.channel === channel && x.recipient === r));
    if (!recipients.length) continue;
    const key = recipients.join();
    const part = parts.get(key);
    if (part) part.channels.push(channel);
    else parts.set(key, { recipients, channels: [channel] });
  }
  return [...parts.values()];
}

/** The retry's answers replace the failed rows they cover; everything else keeps its place. */
export function mergeResults(previous: SendResult[], fresh: SendResult[]): SendResult[] {
  const same = (a: SendResult, b: SendResult) => a.recipient === b.recipient && a.channel === b.channel;
  const merged = previous.map((p) => fresh.find((f) => same(f, p)) ?? p);
  return [...merged, ...fresh.filter((f) => !previous.some((p) => same(p, f)))];
}
