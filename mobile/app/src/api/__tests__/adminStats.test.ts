import { api } from '../client';
import { getStats } from '../adminStats';
import { getReportTypes } from '../reportTypes';

jest.mock('../client', () => ({ api: { get: jest.fn() } }));
const get = api.get as jest.Mock;

beforeEach(() => get.mockReset());

describe('getStats', () => {
  const body = { success: true, data: { pending: 12, under_review: 8, approved: 431, rejected: 5, total: 456, today_pending: 2 } };

  it('returns the raw counts with no offset', async () => {
    get.mockResolvedValue({ data: body });
    await expect(getStats()).resolves.toEqual(body.data);
    expect(get).toHaveBeenCalledWith('/mobile/admin/stats', { params: undefined });
  });

  it('sends report_type only when a type is chosen', async () => {
    get.mockResolvedValue({ data: body });
    await getStats({ reportType: 'frcc2' });
    expect(get).toHaveBeenLastCalledWith('/mobile/admin/stats', { params: { report_type: 'frcc2' } });
    await getStats({ reportType: '' });
    expect(get).toHaveBeenLastCalledWith('/mobile/admin/stats', { params: undefined });
  });

  it('rejects a malformed body instead of showing zeros', async () => {
    get.mockResolvedValue({ data: { success: true, data: { pending: 1 } } });
    await expect(getStats()).rejects.toThrow('Unexpected stats response');
    get.mockResolvedValue({ data: { success: true } });
    await expect(getStats()).rejects.toThrow();
  });

  it('lets request errors through for the caller to show', async () => {
    get.mockRejectedValue(new Error('Network Error'));
    await expect(getStats()).rejects.toThrow('Network Error');
  });
});

describe('getReportTypes', () => {
  it('returns the deduplicated options the web route provides', async () => {
    get.mockResolvedValue({
      data: {
        success: true,
        data: {
          options: [
            { value: 'frcc2', label: 'Format CC2' },
            { value: 'TERM_LOAN', label: 'TERM_LOAN' },
          ],
          report_types: ['frcc2', 'TERM_LOAN'],
          template_ids: [],
        },
      },
    });
    await expect(getReportTypes()).resolves.toEqual([
      { value: 'frcc2', label: 'Format CC2' },
      { value: 'TERM_LOAN', label: 'TERM_LOAN' },
    ]);
    expect(get).toHaveBeenCalledWith('/admin-reports/meta/report-types');
  });

  it('falls back to the flat list and drops blanks', async () => {
    get.mockResolvedValue({ data: { success: true, data: { report_types: ['CC', '', 'dpr'] } } });
    await expect(getReportTypes()).resolves.toEqual([
      { value: 'CC', label: 'CC' },
      { value: 'dpr', label: 'dpr' },
    ]);
  });

  it('returns an empty list for an empty response', async () => {
    get.mockResolvedValue({ data: { success: true, data: {} } });
    await expect(getReportTypes()).resolves.toEqual([]);
  });
});
