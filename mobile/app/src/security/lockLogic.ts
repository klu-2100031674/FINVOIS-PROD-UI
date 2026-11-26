// Pure rules for the inactivity lock, kept apart from React so they can be unit tested.

export const DEFAULT_LOCK_TIMEOUT_MS = 10 * 60 * 1000; // Q2: 10 minutes in the background
export const MAX_ATTEMPTS = 3;

/**
 * Build-time override (EXPO_PUBLIC_LOCK_TIMEOUT_MS) so tests can use a short timeout.
 * It can only shorten the lock: a bad or larger value falls back to the default, so a build
 * can never weaken the policy by accident.
 */
export function parseTimeout(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(n, DEFAULT_LOCK_TIMEOUT_MS) : DEFAULT_LOCK_TIMEOUT_MS;
}

export const LOCK_TIMEOUT_MS = parseTimeout(process.env.EXPO_PUBLIC_LOCK_TIMEOUT_MS);

/** Lock when the app was away longer than the timeout. A clock set backwards or an unreadable time fails closed. */
export function shouldLock(leftAt: number | null, now: number, timeoutMs: number): boolean {
  if (leftAt === null) return false;
  const away = now - leftAt;
  return !Number.isFinite(away) || away < 0 || away >= timeoutMs;
}

/** The persisted "left the app at" value. Missing means the app was not away; anything unreadable becomes NaN (locks). */
export const parseLeftAt = (raw: string | null): number | null => (raw === null ? null : Number(raw));

/** Counts one wrong password. `signOut` is true once the limit is reached. */
export function recordFailure(failures: number): { failures: number; left: number; signOut: boolean } {
  const next = failures + 1;
  return { failures: next, left: Math.max(0, MAX_ATTEMPTS - next), signOut: next >= MAX_ATTEMPTS };
}

/** Only a definite 401 from the login API is a wrong password; offline, 429 and 5xx are not counted. */
export function isWrongPassword(err: unknown): boolean {
  return (err as { response?: { status?: number } } | null)?.response?.status === 401;
}
