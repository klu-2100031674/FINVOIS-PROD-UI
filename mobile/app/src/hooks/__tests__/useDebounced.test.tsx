import { act, renderHook } from '@testing-library/react-native';
import { SEARCH_DEBOUNCE_MS, useDebounced } from '../useAdminReports';

// Own file: fake timers must not leak into the query tests.
describe('useDebounced', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('follows the value only after 400 ms without a change', async () => {
    const { result, rerender } = await renderHook((v: string) => useDebounced(v), { initialProps: 'a' });
    await rerender('ab');
    await rerender('abc');
    expect(result.current).toBe('a');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBe('a');
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('abc');
    expect(SEARCH_DEBOUNCE_MS).toBe(400);
  });
});
