import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

// Only transient failures are worth another try: no connection, or a server error. A 4xx will not change.
export function shouldRetry(failureCount: number, err: unknown): boolean {
  if (failureCount >= 2 || !isAxiosError(err)) return false;
  return !err.response || err.response.status >= 500;
}

// Two quick retries (0.5 s, then 1 s) keep a flaky connection invisible without leaving a loading state hanging.
export const retryDelay = (attempt: number) => 500 * 2 ** attempt;

// No persistence: server data is never written to disk.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry, retryDelay, staleTime: 15000 } },
});
