import { AxiosError, type AxiosResponse } from 'axios';
import { queryClient, retryDelay, shouldRetry } from '../queryClient';

const withStatus = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status, data: {} } as AxiosResponse);
const offline = new AxiosError('Network Error', 'ERR_NETWORK');

describe('query retry policy', () => {
  it('retries a network failure twice, then gives up', () => {
    expect([0, 1, 2, 3].map((n) => shouldRetry(n, offline))).toEqual([true, true, false, false]);
  });

  it('retries server errors, at most twice', () => {
    for (const status of [500, 502, 503]) {
      expect(shouldRetry(0, withStatus(status))).toBe(true);
      expect(shouldRetry(1, withStatus(status))).toBe(true);
      expect(shouldRetry(2, withStatus(status))).toBe(false);
    }
  });

  it('never retries a 4xx', () => {
    for (const status of [400, 401, 402, 403, 404, 409, 426, 429]) {
      expect(shouldRetry(0, withStatus(status))).toBe(false);
    }
  });

  it('never retries an error that is not an API failure', () => {
    expect(shouldRetry(0, new TypeError('bug in a query function'))).toBe(false);
    expect(shouldRetry(0, undefined)).toBe(false);
  });

  it('waits 0.5 s, then 1 s, so an error state is never delayed by more than 1.5 s', () => {
    expect([0, 1].map(retryDelay)).toEqual([500, 1000]);
  });

  it('is the default for every query in the app client, and mutations are never retried', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries).toMatchObject({ retry: shouldRetry, retryDelay });
    expect(defaults.mutations?.retry).toBeUndefined(); // TanStack default: a POST runs once
  });
});
