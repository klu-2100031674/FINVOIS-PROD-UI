import type { EmailRequest } from '~/api/emailAutomation';
import {
  DEFAULT_MAPPING,
  attachmentProblem,
  bodyToText,
  emailPill,
  emailTotals,
  foldersColumns,
  formatBytes,
  hasFormatting,
  insertAtCursor,
  parseMapping,
  requestActions,
  runInfo,
} from '../emailAutomation';

const stats = (over: Partial<EmailRequest['stats']> = {}) => ({ pending: 0, scheduled: 0, processing: 0, sent: 0, failed: 0, total: 0, ...over });
const counts = (valid = 1) => ({ total: valid, valid, invalid: 0, duplicate: 0, incomplete: 0 });
const req = (status: EmailRequest['status'], over: Partial<EmailRequest> = {}) =>
  ({ _id: 'r', name: 'r', status, counts: counts(), stats: stats(), ...over }) as EmailRequest;

describe('requestActions matches what the server allows', () => {
  it('a scheduled request can only be cancelled', () => {
    expect(requestActions(req('scheduled'))).toEqual({ cancel: true, resume: false, reuse: false, retry: false, remove: false });
  });

  it('a request that is sending can do nothing', () => {
    expect(requestActions(req('processing'))).toEqual({ cancel: false, resume: false, reuse: false, retry: false, remove: false });
  });

  it('a draft continues only when it has a valid record', () => {
    expect(requestActions(req('draft')).resume).toBe(true);
    expect(requestActions(req('draft', { counts: counts(0) })).resume).toBe(false);
    expect(requestActions(req('draft')).remove).toBe(true);
  });

  it('a finished request retries only when something failed', () => {
    expect(requestActions(req('completed')).retry).toBe(false);
    expect(requestActions(req('completed', { stats: stats({ failed: 2 }) })).retry).toBe(true);
    expect(requestActions(req('failed')).retry).toBe(true);
    expect(requestActions(req('completed')).reuse).toBe(true);
    expect(requestActions(req('completed')).remove).toBe(true);
  });
});

describe('emailTotals', () => {
  it('adds up the six dashboard numbers', () => {
    const totals = emailTotals([
      req('completed', { stats: stats({ total: 5, sent: 4, failed: 1 }) }),
      req('scheduled', { stats: stats({ total: 3, scheduled: 2, processing: 1 }) }),
      req('draft', { stats: stats({ total: 2, pending: 2 }) }),
    ]);
    expect(totals).toEqual({ total: 10, sent: 4, pending: 2, failed: 1, scheduled: 3, completedRequests: 1 });
  });
});

describe('runInfo', () => {
  const dates = (n: number) => Array.from({ length: n }, () => '2026-11-05T04:30:00.000Z');
  const runs = (n: number) => Array.from({ length: n }, () => ({ date: '', sent: 1, failed: 0 }));

  it('stays quiet for a single send', () => {
    expect(runInfo(req('scheduled', { send_dates: dates(1) }))).toBeNull();
    expect(runInfo(req('completed', { send_dates: dates(1), run_history: runs(1) }))).toBeNull();
  });

  it('counts the runs of a multi-date schedule', () => {
    expect(runInfo(req('scheduled', { send_dates: dates(30), run_history: runs(2) }))).toBe('Run 3 of 30');
    expect(runInfo(req('completed', { send_dates: dates(30), run_history: runs(30) }))).toBe('30 runs');
  });
});

describe('hasFormatting', () => {
  it('ignores what a plain text box can hold', () => {
    expect(hasFormatting('Dear {{bank}},\nHello')).toBe(false);
    expect(hasFormatting('<p>Dear {{bank}},</p><p><br></p><p>Hello</p>')).toBe(false);
  });

  it('catches anything a plain text box would lose', () => {
    expect(hasFormatting('<p><strong>Dear</strong> {{bank}}</p>')).toBe(true);
    expect(hasFormatting('<p style="text-align: center">Dear</p>')).toBe(true);
    expect(hasFormatting('<a href="https://x.test">link</a>')).toBe(true);
    expect(hasFormatting('<ul><li>One</li></ul>')).toBe(true);
  });
});

describe('bodyToText', () => {
  it('leaves plain text alone', () => {
    expect(bodyToText('Dear {{bank}},\n\nHello')).toBe('Dear {{bank}},\n\nHello');
  });

  it('keeps the line breaks of an edited body', () => {
    expect(bodyToText('<p>Dear {{bank}},</p><p><br></p><p>A &amp; B</p>')).toBe('Dear {{bank}},\n\nA & B');
  });

  it('drops tags and marks list items', () => {
    expect(bodyToText('<p><strong>Bold</strong></p><ul><li>One</li><li>Two</li></ul>')).toBe('Bold\n- One\n- Two');
  });

  it("doesn't turn encoded text into a second layer of decoding", () => {
    expect(bodyToText('<p>&amp;lt;b&amp;gt;</p>')).toBe('&lt;b&gt;');
  });
});

describe('insertAtCursor', () => {
  it('inserts at the cursor, replaces a selection and falls back to the end', () => {
    expect(insertAtCursor('Dear ,', '{{bank}}', { start: 5, end: 5 })).toBe('Dear {{bank}},');
    expect(insertAtCursor('Dear you', '{{bank}}', { start: 5, end: 8 })).toBe('Dear {{bank}}');
    expect(insertAtCursor('Dear', '{{bank}}')).toBe('Dear{{bank}}');
    expect(insertAtCursor('Dear', 'x', { start: 99, end: 99 })).toBe('Dearx');
  });
});

describe('attachmentProblem', () => {
  const mb = 1024 * 1024;

  it('allows files within the limits', () => {
    expect(attachmentProblem([{ name: 'a.pdf', size: 5 * mb }], [{ size: 5 * mb }])).toBeNull();
  });

  it('refuses an eleventh file', () => {
    const existing = Array.from({ length: 10 }, () => ({ size: 1 }));
    expect(attachmentProblem([{ name: 'a.pdf', size: 1 }], existing)).toBe('An email can carry 10 files at most.');
  });

  it('names the file that goes over 10 MB, counting the template files', () => {
    expect(attachmentProblem([{ name: 'big.pdf', size: 6 * mb }], [{ size: 5 * mb }])).toContain('big.pdf');
  });
});

describe('small helpers', () => {
  it('reads a status the way the web does', () => {
    expect(emailPill('none')).toEqual({ label: 'Not queued', tone: 'gray' });
    expect(emailPill('failed')).toEqual({ label: 'Failed', tone: 'red' });
    expect(emailPill('something-new').tone).toBe('gray');
  });

  it('formats a size', () => {
    expect(formatBytes(100)).toBe('1 KB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('merges folder columns, first one wins', () => {
    const a = { _id: 'a', name: 'a', count: 1, columns: [{ key: 'email', label: 'Email' }, { key: 'bank', label: 'Bank' }] };
    const b = { _id: 'b', name: 'b', count: 1, columns: [{ key: 'bank', label: 'BANK NAME' }, { key: 'state', label: 'State' }] };
    expect(foldersColumns([a, b])).toEqual([
      { key: 'email', label: 'Email' },
      { key: 'bank', label: 'Bank' },
      { key: 'state', label: 'State' },
    ]);
  });

  it('only trusts remembered column names it can read', () => {
    expect(parseMapping(null)).toEqual(DEFAULT_MAPPING);
    expect(parseMapping('not json')).toEqual(DEFAULT_MAPPING);
    expect(parseMapping('{"email":"Mail","bank":7}')).toEqual({ ...DEFAULT_MAPPING, email: 'Mail' });
  });
});
