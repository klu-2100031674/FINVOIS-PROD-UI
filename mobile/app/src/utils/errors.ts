import { isAxiosError } from 'axios';

/** Turns any API or network failure into one short sentence safe to show a user. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (!isAxiosError(err)) return fallback;
  if (!err.response) {
    return err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT'
      ? 'The request timed out. Try again.'
      : "You're offline. Check your connection.";
  }
  const { status, data } = err.response;
  if (status === 429) return 'Too many attempts. Try again in a few minutes.';
  if (status === 426) return 'Update the app to keep using it.';
  if (status >= 500) return fallback;
  // Routes answer with { error } or { success: false, error }; a blob, string or empty body has neither.
  const msg = data && typeof data === 'object' ? (data as { error?: unknown }).error : null;
  return typeof msg === 'string' && msg.trim() && msg.length < 200 ? msg : fallback;
}

export function apiErrorCode(err: unknown): string | null {
  if (!isAxiosError(err)) return null;
  const code = (err.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === 'string' ? code : null;
}

export function apiErrorStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}
