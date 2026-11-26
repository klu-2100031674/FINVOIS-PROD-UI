import {
  NotAPdfError,
  buildListParams,
  fetchPdfBytes,
  mergePages,
  nextPageNumber,
  pdfPath,
  rejectionReasonError,
  reportActionsFor,
  type AdminReport,
  type ReportsPage,
} from '../adminReports';
import { api } from '../client';

const report = (id: string): AdminReport => ({ _id: id, validation_status: 'pending_validation' });
const page = (ids: string[], current: number, total: number): ReportsPage => ({
  reports: ids.map(report),
  pagination: { current_page: current, total_pages: total, total_count: 0, per_page: 20 },
});

describe('list params', () => {
  it('sends only the filters that are set, always with page and limit 20', () => {
    expect(buildListParams({}, 1)).toEqual({ page: 1, limit: 20 });
    expect(buildListParams({ status: 'approved', reportType: 'CC', search: '  Ravi ' }, 3)).toEqual({
      page: 3,
      limit: 20,
      status: 'approved',
      report_type: 'CC',
      search: 'Ravi',
    });
  });

  it('drops an empty or blank search and an empty type', () => {
    expect(buildListParams({ search: '   ', reportType: '' }, 1)).toEqual({ page: 1, limit: 20 });
  });
});

describe('infinite scroll pages', () => {
  it('requests the next page until the last one', () => {
    expect(nextPageNumber(page(['a'], 1, 3))).toBe(2);
    expect(nextPageNumber(page(['a'], 3, 3))).toBeUndefined();
    expect(nextPageNumber(page([], 1, 0))).toBeUndefined();
  });

  it('merges pages in order without duplicates', () => {
    // "b" slipped from page 1 to page 2 because a report was approved while the user scrolled.
    const merged = mergePages([page(['a', 'b'], 1, 3), page(['b', 'c'], 2, 3), page(['d'], 3, 3)]);
    expect(merged.map((r) => r._id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('review actions by status', () => {
  it.each([
    ['pending_validation', { review: true, reReview: false, approve: true, reject: true, send: false }],
    ['under_review', { review: false, reReview: false, approve: true, reject: true, send: false }],
    ['approved', { review: false, reReview: false, approve: false, reject: false, send: true }],
    ['rejected', { review: false, reReview: true, approve: false, reject: false, send: false }],
    ['draft', { review: false, reReview: false, approve: false, reject: false, send: false }],
    ['pending_payment', { review: false, reReview: false, approve: false, reject: false, send: false }],
  ])('%s', (status, expected) => {
    expect(reportActionsFor(status)).toEqual(expected);
  });
});

describe('rejection reason', () => {
  it('needs 5 to 500 characters after trimming', () => {
    expect(rejectionReasonError('')).toMatch(/at least 5/i);
    expect(rejectionReasonError('  abcd  ')).toMatch(/at least 5/i);
    expect(rejectionReasonError('abcde')).toBeNull();
    expect(rejectionReasonError('x'.repeat(500))).toBeNull();
    expect(rejectionReasonError('x'.repeat(501))).toMatch(/500/);
  });
});

describe('pdf requests', () => {
  it('picks the route by source and escapes the id', () => {
    expect(pdfPath('admin-report', 'abc123')).toBe('/admin-reports/abc123/pdf');
    expect(pdfPath('request-report', 'abc123')).toBe('/govt-forms/requests/abc123/report/pdf');
    expect(pdfPath('admin-report', '../x')).toBe('/admin-reports/..%2Fx/pdf');
  });

  const bytes = (text: string) => new TextEncoder().encode(text).buffer;

  it('returns the bytes of a real PDF', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValueOnce({ data: bytes('%PDF-1.4 body') });
    const out = await fetchPdfBytes('request-report', 'r1');
    expect(String.fromCharCode(...out.subarray(0, 4))).toBe('%PDF');
    expect(get).toHaveBeenCalledWith('/govt-forms/requests/r1/report/pdf', expect.objectContaining({ responseType: 'arraybuffer' }));
    get.mockRestore();
  });

  it('refuses a body that is not a PDF', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValueOnce({ data: bytes('<html>sign in</html>') });
    await expect(fetchPdfBytes('admin-report', 'r1')).rejects.toBeInstanceOf(NotAPdfError);
    get.mockRestore();
  });
});
