import type { ColumnMapping, EmailAttachment, EmailColumn, EmailFolder, EmailRequest } from '~/api/emailAutomation';
import type { Tone } from './status';

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // per email, all files together
export const MAX_EXCEL_BYTES = 25 * 1024 * 1024;

const SENT_STATUSES = ['completed', 'failed'];
const ACTIVE_STATUSES = ['scheduled', 'processing'];
const RICH_RE = /<\/?[a-z][\s\S]*?>/i;

export const DEFAULT_MAPPING: ColumnMapping = { email: 'Email', bank: 'Bank name', region: 'Region', extra: '' };
export const BUILT_IN_PLACEHOLDERS: EmailColumn[] = [
  { key: 'bank', label: 'bank' },
  { key: 'bankaddress', label: 'bankAddress' },
  { key: 'office', label: 'office' },
  { key: 'email', label: 'email' },
];

const STATUS_TONE: Record<string, Tone> = {
  valid: 'green',
  invalid: 'red',
  duplicate: 'amber',
  incomplete: 'amber',
  none: 'gray',
  pending: 'gray',
  scheduled: 'blue',
  processing: 'purple',
  sent: 'green',
  failed: 'red',
  draft: 'gray',
  completed: 'green',
  cancelled: 'gray',
};

export function emailPill(value: string): { label: string; tone: Tone } {
  const label = value === 'none' ? 'Not queued' : value.charAt(0).toUpperCase() + value.slice(1);
  return { label, tone: STATUS_TONE[value] ?? 'gray' };
}

export const isSentRequest = (r: EmailRequest) => SENT_STATUSES.includes(r.status);
export const isActiveRequest = (r: Pick<EmailRequest, 'status'>) => ACTIVE_STATUSES.includes(r.status);

export interface EmailTotals {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  scheduled: number;
  completedRequests: number;
}

/** The six dashboard numbers, from the request list so the screen needs one query instead of two (as on the web). */
export function emailTotals(requests: EmailRequest[]): EmailTotals {
  return requests.reduce<EmailTotals>(
    (t, r) => ({
      total: t.total + r.stats.total,
      sent: t.sent + r.stats.sent,
      pending: t.pending + r.stats.pending,
      failed: t.failed + r.stats.failed,
      scheduled: t.scheduled + r.stats.scheduled + r.stats.processing,
      completedRequests: t.completedRequests + (r.status === 'completed' ? 1 : 0),
    }),
    { total: 0, sent: 0, pending: 0, failed: 0, scheduled: 0, completedRequests: 0 }
  );
}

/** "Run 3 of 30" while a multi-date schedule is going, "30 runs" once it has finished. */
export function runInfo(r: Pick<EmailRequest, 'status' | 'send_dates' | 'run_history'>): string | null {
  const total = r.send_dates?.length ?? 0;
  const done = r.run_history?.length ?? 0;
  if (total <= 1 && done <= 1) return null;
  if (isActiveRequest(r)) return `Run ${Math.min(done + 1, total)} of ${total}`;
  return done === 1 ? '1 run' : `${done} runs`;
}

/** What the server allows for a request in this state. The server still checks each one. */
export function requestActions(r: Pick<EmailRequest, 'status' | 'counts' | 'stats'>) {
  const sent = SENT_STATUSES.includes(r.status);
  return {
    cancel: r.status === 'scheduled',
    resume: r.status === 'draft' && (r.counts?.valid ?? 0) > 0,
    reuse: sent,
    retry: sent && ((r.stats?.failed ?? 0) > 0 || r.status === 'failed'),
    remove: sent || r.status === 'draft' || r.status === 'cancelled',
  };
}

export const canEditRecipients = (status: string) => status === 'draft' || status === 'scheduled';
export const canRemoveRecipient = (status: string) => ['none', 'pending', 'scheduled'].includes(status);

export function formatBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');

/** A template body as readable text. Line breaks survive; bold, colours and links do not. */
export function bodyToText(body: string): string {
  const s = String(body ?? '');
  if (!RICH_RE.test(s)) return s.trim();
  const text = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '');
  return decode(text).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * True when a body has formatting a plain text box would lose. The web editor wraps every line in <p>, so those and <br>
 * don't count. The app can't show this formatting, so saving such a body from a text box must be the admin's explicit choice.
 */
export function hasFormatting(body: string): boolean {
  return RICH_RE.test(String(body ?? '').replace(/<\/?p>|<br\s*\/?>/gi, ''));
}

/** Inserts text where the cursor was, replacing any selected text. */
export function insertAtCursor(value: string, text: string, selection?: { start: number; end: number }): string {
  const start = Math.min(selection?.start ?? value.length, value.length);
  const end = Math.min(selection?.end ?? start, value.length);
  return value.slice(0, start) + text + value.slice(end);
}

/** The columns of the chosen folders, first one wins, which are the placeholders a send to them can fill. */
export function foldersColumns(folders: EmailFolder[]): EmailColumn[] {
  const seen = new Set<string>();
  return folders
    .flatMap((f) => f.columns ?? [])
    .filter((c) => {
      if (seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
}

/** The sentence to show when these files can't go on the email. Checked here so nothing is uploaded for nothing. */
export function attachmentProblem(
  files: { name: string; size?: number }[],
  existing: Pick<EmailAttachment, 'size'>[]
): string | null {
  if (existing.length + files.length > MAX_ATTACHMENTS) return `An email can carry ${MAX_ATTACHMENTS} files at most.`;
  let total = existing.reduce((n, f) => n + f.size, 0);
  for (const f of files) {
    total += f.size ?? 0;
    if (total > MAX_ATTACHMENT_BYTES) return `${f.name} doesn't fit. Attachments can't go over 10 MB in total.`;
  }
  return null;
}

/** Reads the remembered column names, ignoring anything stored that isn't what this screen wrote. */
export function parseMapping(stored: string | null): ColumnMapping {
  if (!stored) return DEFAULT_MAPPING;
  try {
    const v = JSON.parse(stored) as Partial<ColumnMapping>;
    const text = (x: unknown, fallback: string) => (typeof x === 'string' ? x : fallback);
    return {
      email: text(v.email, DEFAULT_MAPPING.email),
      bank: text(v.bank, DEFAULT_MAPPING.bank),
      region: text(v.region, DEFAULT_MAPPING.region),
      extra: text(v.extra, DEFAULT_MAPPING.extra),
    };
  } catch {
    return DEFAULT_MAPPING;
  }
}
