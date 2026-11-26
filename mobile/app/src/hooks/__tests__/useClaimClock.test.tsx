import { act, renderHook } from '@testing-library/react-native';
import { EXPIRY_RETRY_MS, useClaimClock } from '../useClaimClock';

const NOW = Date.parse('2026-10-01T10:00:00Z');
const claimedMinutesAgo = (m: number) => ({ status: 'claimed', claimedAt: new Date(NOW - m * 60000).toISOString() });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});
afterEach(() => jest.useRealTimers());

describe('useClaimClock', () => {
  it('asks for a refetch when the claim runs out, and again every 15 s while the server still lists it', async () => {
    const onExpire = jest.fn();
    const requests = [claimedMinutesAgo(14)];
    await renderHook(() => useClaimClock(requests, onExpire));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(59_000);
    });
    expect(onExpire).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2_000); // past zero
    });
    expect(onExpire).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(EXPIRY_RETRY_MS);
    });
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('refreshes the returned time every 30 s so countdown text stays current', async () => {
    const requests = [claimedMinutesAgo(1)];
    const { result } = await renderHook(() => useClaimClock(requests, jest.fn()));
    const before = result.current;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });
    expect(result.current - before).toBeGreaterThanOrEqual(30_000);
  });

  it('does nothing when no request has a claim timer or the screen is not active', async () => {
    const onExpire = jest.fn();
    await renderHook(() => useClaimClock([{ status: 'open' }, { status: 'completed', claimedAt: new Date(NOW).toISOString() }], onExpire));
    const idle = await renderHook(() => useClaimClock([claimedMinutesAgo(14)], onExpire, false));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5 * 60_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
    idle.unmount();
  });

  it('stops asking once the expired request is gone from the list', async () => {
    const onExpire = jest.fn();
    let requests = [claimedMinutesAgo(15.01)];
    const { rerender } = await renderHook(() => useClaimClock(requests, onExpire));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(EXPIRY_RETRY_MS + 100);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);

    requests = [];
    await rerender({});
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5 * EXPIRY_RETRY_MS);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
