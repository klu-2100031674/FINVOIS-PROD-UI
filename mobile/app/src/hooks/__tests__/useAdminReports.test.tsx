import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { approveReport, listReports, markUnderReview, rejectReport, type ReportsPage } from '~/api/adminReports';
import { ADMIN_STATS_KEY } from '../useAdminStats';
import { REPORTS_KEY, useReportList } from '../useAdminReports';
import { REPORT_KEY, useReportActions } from '../useAdminReportsDetail';

jest.mock('~/api/adminReports', () => ({
  ...jest.requireActual('~/api/adminReports'),
  listReports: jest.fn(),
  markUnderReview: jest.fn(),
  approveReport: jest.fn(),
  rejectReport: jest.fn(),
  getReport: jest.fn(),
  getReportContext: jest.fn(),
}));
const mockList = listReports as jest.Mock;

const page = (ids: string[], current: number, total: number): ReportsPage => ({
  reports: ids.map((id) => ({ _id: id, validation_status: 'pending_validation' })),
  pagination: { current_page: current, total_pages: total, total_count: 5, per_page: 2 },
});

function setup() {
  // gcTime Infinity: no 5 minute garbage-collection timers left running after the test.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

describe('useReportList', () => {
  beforeEach(() => mockList.mockReset());

  it('loads page 1, then the next pages on demand, merged without duplicates', async () => {
    mockList.mockImplementation(async (_filters: unknown, n: number) =>
      // "b" moved from page 1 to page 2 while the user scrolled.
      n === 1 ? page(['a', 'b'], 1, 3) : n === 2 ? page(['b', 'c'], 2, 3) : page(['d'], 3, 3)
    );
    const { wrapper } = setup();
    const { result } = await renderHook(() => useReportList({ status: 'approved' }), { wrapper });

    await waitFor(() => expect(result.current.reports.map((r) => r._id)).toEqual(['a', 'b']));
    expect(result.current.totalCount).toBe(5);
    expect(result.current.hasNextPage).toBe(true);
    expect(mockList).toHaveBeenLastCalledWith({ status: 'approved', search: '' }, 1, expect.anything());

    // One page at a time, like the list does: wait for each page to land before asking for the next.
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.reports.map((r) => r._id)).toEqual(['a', 'b', 'c']));
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.reports.map((r) => r._id)).toEqual(['a', 'b', 'c', 'd']));
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    expect(mockList.mock.calls.map((c) => c[1])).toEqual([1, 2, 3]);
  });

  it('starts over from page 1 when a filter changes', async () => {
    mockList.mockImplementation(async (filters: { status?: string }, n: number) =>
      filters.status === 'approved' ? page(['x'], n, 1) : page(['a', 'b'], n, 2)
    );
    const { wrapper } = setup();
    const { result, rerender } = await renderHook((status?: 'approved') => useReportList({ status }), {
      wrapper,
      initialProps: undefined,
    });
    await waitFor(() => expect(result.current.reports).toHaveLength(2));
    await rerender('approved');
    await waitFor(() => expect(result.current.reports.map((r) => r._id)).toEqual(['x']));
    expect(mockList).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'approved' }), 1, expect.anything());
  });

  it('keeps pages already loaded when the next page fails', async () => {
    mockList.mockImplementation(async (_f: unknown, n: number) => {
      if (n === 2) throw new Error('Network Error');
      return page(['a', 'b'], 1, 2);
    });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useReportList({}), { wrapper });
    await waitFor(() => expect(result.current.reports).toHaveLength(2));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true));
    expect(result.current.reports.map((r) => r._id)).toEqual(['a', 'b']);
  });
});

describe('useReportActions', () => {
  const mocks = { review: markUnderReview as jest.Mock, approve: approveReport as jest.Mock, reject: rejectReport as jest.Mock };
  beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

  function watch(client: QueryClient) {
    // Seed one query under each prefix so an invalidation can be seen as `isInvalidated`.
    client.setQueryData([...REPORTS_KEY, 'all', 'all', ''], { pages: [], pageParams: [] });
    client.setQueryData([...ADMIN_STATS_KEY, 'all'], { pending: 1 });
    client.setQueryData([...REPORT_KEY, 'r1'], { _id: 'r1' });
    const stale = (key: readonly string[]) => client.getQueryCache().findAll({ queryKey: key }).every((q) => q.isStale());
    return () => ({ reports: stale(REPORTS_KEY), stats: stale(ADMIN_STATS_KEY), report: stale(REPORT_KEY) });
  }

  it('approve calls the API and refreshes the report, the lists and the dashboard counts', async () => {
    mocks.approve.mockResolvedValue(undefined);
    const { client, wrapper } = setup();
    const invalidated = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => useReportActions('r1'), { wrapper });
    await act(async () => {
      await result.current.approve.mutateAsync({ send_email: true, validation_notes: 'Looks good' });
    });
    await waitFor(() => expect(result.current.approve.isSuccess).toBe(true));
    expect(mocks.approve).toHaveBeenCalledWith('r1', { send_email: true, validation_notes: 'Looks good' });
    expect(invalidated.mock.calls.map((c) => c[0]?.queryKey)).toEqual(
      expect.arrayContaining([REPORTS_KEY, ADMIN_STATS_KEY, REPORT_KEY])
    );
  });

  it('refreshes after a refused action too, since the status may have changed elsewhere', async () => {
    mocks.approve.mockRejectedValue(new Error('Report cannot be approved in current status'));
    const { client, wrapper } = setup();
    const getState = watch(client);
    const { result } = await renderHook(() => useReportActions('r1'), { wrapper });
    await act(async () => {
      await result.current.approve.mutateAsync({ send_email: true }).catch(() => undefined);
    });
    await waitFor(() => expect(result.current.approve.isError).toBe(true));
    expect(getState()).toEqual({ reports: true, stats: true, report: true });
  });

  it('reject sends the reason as rejection_reason', async () => {
    mocks.reject.mockResolvedValue(undefined);
    const { wrapper } = setup();
    const { result } = await renderHook(() => useReportActions('r1'), { wrapper });
    await act(async () => {
      await result.current.reject.mutateAsync({ rejection_reason: 'Missing bank statements', send_email: false });
    });
    await waitFor(() => expect(result.current.reject.isSuccess).toBe(true));
    expect(mocks.reject).toHaveBeenCalledWith('r1', { rejection_reason: 'Missing bank statements', send_email: false });
  });

  it('is busy while any action is in flight, so buttons cannot double submit', async () => {
    let finish: () => void = () => undefined;
    mocks.review.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useReportActions('r1'), { wrapper });
    expect(result.current.busy).toBe(false);
    await act(async () => {
      result.current.review.mutate();
    });
    await waitFor(() => expect(result.current.busy).toBe(true));
    await act(async () => finish());
    await waitFor(() => expect(result.current.busy).toBe(false));
  });
});
