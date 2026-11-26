import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getStats } from '~/api/adminStats';
import { ADMIN_STATS_KEY, STATS_POLL_MS, formatUpdatedAt, useAdminStats } from '../useAdminStats';

jest.mock('~/api/adminStats', () => ({ getStats: jest.fn() }));
jest.mock('~/api/reportTypes', () => ({ getReportTypes: jest.fn() }));
const mockGetStats = getStats as jest.Mock;

const all = { pending: 12, under_review: 8, approved: 431, rejected: 5, total: 456, today_pending: 1 };
const cc = { pending: 3, under_review: 2, approved: 90, rejected: 1, total: 96, today_pending: 0 };

function setup() {
  // gcTime Infinity: the default 5 minute garbage-collection timer would keep the Jest worker alive.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => {
  mockGetStats.mockReset();
  mockGetStats.mockImplementation(async ({ reportType }: { reportType?: string } = {}) => (reportType === 'CC' ? cc : all));
});

describe('useAdminStats', () => {
  it('returns the values from the response', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useAdminStats(undefined), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(all));
    expect(mockGetStats).toHaveBeenCalledWith({ reportType: undefined });
  });

  it('changing the type changes the query key and fetches that type', async () => {
    const { client, wrapper } = setup();
    const { result, rerender } = await renderHook(
      (type: string | undefined) => {
        const { data } = useAdminStats(type);
        return { data };
      },
      { wrapper, initialProps: undefined }
    );
    await waitFor(() => expect(result.current.data).toEqual(all));

    let finish: (v: typeof cc) => void = () => {};
    mockGetStats.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    await rerender('CC');
    // The old type's numbers must not show under the new filter while it loads.
    expect(result.current.data).toBeUndefined();
    await act(async () => finish(cc));
    await waitFor(() => expect(result.current.data).toEqual(cc));
    expect(mockGetStats).toHaveBeenLastCalledWith({ reportType: 'CC' });
    expect(client.getQueryCache().findAll({ queryKey: ADMIN_STATS_KEY }).map((q) => q.queryKey)).toEqual(
      expect.arrayContaining([[...ADMIN_STATS_KEY, 'all'], [...ADMIN_STATS_KEY, 'CC']])
    );
  });

  it('keeps the last good numbers when a refetch fails', async () => {
    const { wrapper } = setup();
    // React Query only re-renders for fields read during render, so read them all here as the screen does.
    const { result } = await renderHook(
      () => {
        const { data, isError, dataUpdatedAt, refetch } = useAdminStats(undefined);
        return { data, isError, dataUpdatedAt, refetch };
      },
      { wrapper }
    );
    await waitFor(() => expect(result.current.data).toEqual(all));
    const stamp = result.current.dataUpdatedAt;

    mockGetStats.mockRejectedValue(new Error('Network Error'));
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toEqual(all);
    expect(result.current.dataUpdatedAt).toBe(stamp);

    mockGetStats.mockResolvedValue({ ...all, pending: 11 });
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.data?.pending).toBe(11));
    expect(result.current.isError).toBe(false);
  });

  it('does not fetch while inactive and refetches when it becomes active again', async () => {
    const { wrapper } = setup();
    const { result, rerender } = await renderHook((active: boolean) => useAdminStats(undefined, active), { wrapper, initialProps: false });
    await act(async () => {});
    expect(mockGetStats).not.toHaveBeenCalled();

    await rerender(true);
    await waitFor(() => expect(result.current.data).toEqual(all));
    expect(mockGetStats).toHaveBeenCalledTimes(1);

    await rerender(false);
    await rerender(true); // focus returns: data is always stale, so it refetches
    await waitFor(() => expect(mockGetStats).toHaveBeenCalledTimes(2));
  });

  describe('polling', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('refetches every 30 seconds while active and stops when inactive', async () => {
      const { wrapper } = setup();
      const { rerender } = await renderHook((active: boolean) => useAdminStats(undefined, active), { wrapper, initialProps: true });
      await waitFor(() => expect(mockGetStats).toHaveBeenCalledTimes(1));

      await act(async () => {
        jest.advanceTimersByTime(STATS_POLL_MS);
      });
      await waitFor(() => expect(mockGetStats).toHaveBeenCalledTimes(2));

      await rerender(false);
      await act(async () => {
        jest.advanceTimersByTime(STATS_POLL_MS * 3);
      });
      expect(mockGetStats).toHaveBeenCalledTimes(2);
    });
  });
});

describe('formatUpdatedAt', () => {
  it('formats local 24 hour time as hh:mm', () => {
    expect(formatUpdatedAt(new Date(2026, 9, 1, 9, 5).getTime())).toBe('09:05');
    expect(formatUpdatedAt(new Date(2026, 9, 1, 21, 41).getTime())).toBe('21:41');
  });

  it('is blank before the first load', () => {
    expect(formatUpdatedAt(0)).toBe('');
  });
});
