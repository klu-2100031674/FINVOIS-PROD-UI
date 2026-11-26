/* eslint-disable @typescript-eslint/no-require-imports -- a fresh module registry per test needs require; jest-expo does not support dynamic import() */
import { AxiosError, type AxiosResponse } from 'axios';

// Secure-store stand-in shared across module resets: the "device" keeps its storage between app launches.
const mockSecure = new Map<string, string>();
const mockWrites: { key: string; value: string }[] = [];

jest.mock('~/auth/storage', () => ({
  getSecure: async (key: string) => mockSecure.get(key) ?? null,
  setSecure: async (key: string, value: string) => {
    mockWrites.push({ key, value });
    mockSecure.set(key, value);
  },
  deleteSecure: async (key: string) => void mockSecure.delete(key),
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'device-uuid-1') }));
jest.mock('~/api/auth', () => ({ loginRequest: jest.fn(), refreshRequest: jest.fn(), logoutRequest: jest.fn() }));

const REFRESH_KEY = 'finovis.refreshToken';
const USER_KEY = 'finovis.user';
const DEVICE_KEY = 'finovis.deviceId';

const admin = { id: 'u1', name: 'Test CA', email: 'ca@e2e.test', role: 'admin' as const };
const withStatus = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status, data: { error: 'nope' } } as AxiosResponse);
const offline = () => new AxiosError('Network Error', 'ERR_NETWORK');

// The store keeps its state at module level, so every test loads a fresh copy (as a new app launch would).
async function load() {
  jest.resetModules();
  const { sessionStore } = require('../sessionStore') as typeof import('../sessionStore');
  const auth = jest.mocked(require('~/api/auth') as typeof import('~/api/auth'));
  return { sessionStore, auth };
}

/** Puts a signed-in session on the "device", as if an earlier launch had logged in. */
function seedSession(refreshToken = 'refresh-old') {
  mockSecure.set(REFRESH_KEY, refreshToken);
  mockSecure.set(USER_KEY, JSON.stringify(admin));
  mockSecure.set(DEVICE_KEY, 'device-uuid-1');
}

beforeEach(() => {
  mockSecure.clear();
  mockWrites.length = 0;
});

describe('restore', () => {
  it('goes to sign-in without calling the API when nothing is stored', async () => {
    const { sessionStore, auth } = await load();
    await sessionStore.restore();
    expect(sessionStore.getState()).toEqual({ status: 'signedOut' });
    expect(auth.refreshRequest).not.toHaveBeenCalled();
  });

  it('rotates the stored refresh token and signs in with the stored user', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockResolvedValue({ accessToken: 'access-new', refreshToken: 'refresh-new' } as never);

    await sessionStore.restore();

    expect(auth.refreshRequest).toHaveBeenCalledWith('refresh-old', 'device-uuid-1');
    expect(sessionStore.getState()).toEqual({ status: 'signedIn', user: admin });
    expect(sessionStore.getAccessToken()).toBe('access-new');
    expect(mockSecure.get(REFRESH_KEY)).toBe('refresh-new');
  });

  it.each([401, 403])('a %i from refresh clears the session and shows a notice', async (status) => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockRejectedValue(withStatus(status));
    const hook = jest.fn();
    sessionStore.onSignOut(hook);

    await sessionStore.restore();

    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: 'Your session ended. Sign in again.' });
    expect(sessionStore.getAccessToken()).toBeNull();
    expect(mockSecure.has(REFRESH_KEY)).toBe(false);
    expect(mockSecure.has(USER_KEY)).toBe(false);
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('a network failure keeps the stored token and shows sign-in with an offline notice', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockRejectedValue(offline());
    const hook = jest.fn();
    sessionStore.onSignOut(hook);

    await sessionStore.restore();

    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: "You're offline. Check your connection." });
    expect(sessionStore.getAccessToken()).toBeNull();
    // Not a rejection: the next launch (or a retry) can still restore the session.
    expect(mockSecure.get(REFRESH_KEY)).toBe('refresh-old');
    expect(mockSecure.get(USER_KEY)).toBe(JSON.stringify(admin));
    expect(hook).not.toHaveBeenCalled();
  });

  it('a server error at launch also keeps the token and does not leave the app on the splash screen', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockRejectedValue(withStatus(503));

    await sessionStore.restore();

    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: 'Something went wrong. Try again.' });
    expect(mockSecure.get(REFRESH_KEY)).toBe('refresh-old');
  });

  it('cleans up a half-written session (token without a user) instead of signing in', async () => {
    mockSecure.set(REFRESH_KEY, 'refresh-old');
    const { sessionStore, auth } = await load();
    await sessionStore.restore();
    expect(sessionStore.getState()).toEqual({ status: 'signedOut' });
    expect(auth.refreshRequest).not.toHaveBeenCalled();
    expect(mockSecure.has(REFRESH_KEY)).toBe(false);
  });
});

describe('refresh while signed in', () => {
  it('concurrent callers share one request', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockResolvedValue({ accessToken: 'access-new', refreshToken: 'refresh-new' } as never);

    const results = await Promise.all([sessionStore.refresh(), sessionStore.refresh(), sessionStore.refresh()]);

    expect(results).toEqual([true, true, true]);
    expect(auth.refreshRequest).toHaveBeenCalledTimes(1);
  });

  it('a network failure returns false but keeps the user signed in', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockResolvedValueOnce({ accessToken: 'access-1', refreshToken: 'refresh-1' } as never);
    await sessionStore.restore();
    auth.refreshRequest.mockRejectedValueOnce(offline());

    await expect(sessionStore.refresh()).resolves.toBe(false);

    expect(sessionStore.getState().status).toBe('signedIn');
    expect(sessionStore.getAccessToken()).toBe('access-1');
    expect(mockSecure.get(REFRESH_KEY)).toBe('refresh-1');
  });

  it('does nothing once signed out, so a late 401 cannot repeat the sign-out', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockRejectedValueOnce(withStatus(401));
    const hook = jest.fn();
    sessionStore.onSignOut(hook);
    await sessionStore.restore();
    auth.refreshRequest.mockClear();

    await expect(sessionStore.refresh()).resolves.toBe(false);

    expect(auth.refreshRequest).not.toHaveBeenCalled();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: 'Your session ended. Sign in again.' });
  });

  it('restore can still run again after a launch without a connection', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockRejectedValueOnce(offline());
    await sessionStore.restore();
    expect(sessionStore.getState().status).toBe('signedOut');

    auth.refreshRequest.mockResolvedValueOnce({ accessToken: 'access-new', refreshToken: 'refresh-new' } as never);
    await sessionStore.restore();

    expect(sessionStore.getState()).toEqual({ status: 'signedIn', user: admin });
  });

  it('a definite rejection signs the user out', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockResolvedValueOnce({ accessToken: 'access-1', refreshToken: 'refresh-1' } as never);
    await sessionStore.restore();
    auth.refreshRequest.mockRejectedValueOnce(withStatus(401));

    await expect(sessionStore.refresh()).resolves.toBe(false);

    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: 'Your session ended. Sign in again.' });
    expect(sessionStore.getAccessToken()).toBeNull();
  });
});

describe('login', () => {
  it('keeps the access token in memory and persists only the refresh token, user and device id', async () => {
    const { sessionStore, auth } = await load();
    auth.loginRequest.mockResolvedValue({
      success: true,
      user: admin,
      accessToken: 'access-secret-abc',
      refreshToken: 'refresh-secret-xyz',
    });

    await sessionStore.login('ca@e2e.test', 'pw');

    expect(auth.loginRequest).toHaveBeenCalledWith('ca@e2e.test', 'pw', 'device-uuid-1');
    expect(sessionStore.getState()).toEqual({ status: 'signedIn', user: admin });
    expect(sessionStore.getAccessToken()).toBe('access-secret-abc');
    expect(new Set(mockWrites.map((w) => w.key))).toEqual(new Set([DEVICE_KEY, REFRESH_KEY, USER_KEY]));
    for (const { value } of mockWrites) expect(value).not.toContain('access-secret-abc');
    expect(mockSecure.get(REFRESH_KEY)).toBe('refresh-secret-xyz');
  });

  it('never persists the access token on a rotation either', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockResolvedValue({ accessToken: 'access-secret-abc', refreshToken: 'refresh-new' } as never);
    await sessionStore.restore();
    for (const { value } of mockWrites) expect(value).not.toContain('access-secret-abc');
  });

  it('generates the device id once and reuses it', async () => {
    const { sessionStore, auth } = await load();
    const { randomUUID } = jest.mocked(require('expo-crypto') as typeof import('expo-crypto'));
    auth.loginRequest.mockRejectedValue(withStatus(401));
    await expect(sessionStore.login('a@b.test', 'x')).rejects.toBeDefined();
    await expect(sessionStore.login('a@b.test', 'x')).rejects.toBeDefined();

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(mockSecure.get(DEVICE_KEY)).toBe('device-uuid-1');
    expect(auth.loginRequest.mock.calls.map((c) => c[2])).toEqual(['device-uuid-1', 'device-uuid-1']);
  });

  it('a failed login stores no session', async () => {
    const { sessionStore, auth } = await load();
    auth.loginRequest.mockRejectedValue(withStatus(403));
    await expect(sessionStore.login('partner@e2e.test', 'x')).rejects.toBeDefined();
    expect(sessionStore.getAccessToken()).toBeNull();
    expect(mockSecure.has(REFRESH_KEY)).toBe(false);
    expect(mockSecure.has(USER_KEY)).toBe(false);
  });
});

describe('sign-out hooks', () => {
  async function signedIn() {
    seedSession();
    const ctx = await load();
    ctx.auth.refreshRequest.mockResolvedValueOnce({ accessToken: 'access-1', refreshToken: 'refresh-1' } as never);
    await ctx.sessionStore.restore();
    return ctx;
  }

  it('run on a user sign-out and the local wipe completes', async () => {
    const { sessionStore, auth } = await signedIn();
    auth.logoutRequest.mockResolvedValue(undefined);
    const hook = jest.fn();
    sessionStore.onSignOut(hook);

    await sessionStore.logout();

    expect(auth.logoutRequest).toHaveBeenCalledTimes(1);
    expect(hook).toHaveBeenCalledTimes(1);
    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: undefined });
    expect(sessionStore.getAccessToken()).toBeNull();
    expect(mockSecure.has(REFRESH_KEY)).toBe(false);
    expect(mockSecure.has(USER_KEY)).toBe(false);
  });

  it('run on a user sign-out even when the server is unreachable', async () => {
    const { sessionStore, auth } = await signedIn();
    auth.logoutRequest.mockRejectedValue(offline());
    const hook = jest.fn();
    sessionStore.onSignOut(hook);

    await sessionStore.logout();

    expect(hook).toHaveBeenCalledTimes(1);
    expect(sessionStore.getState().status).toBe('signedOut');
    expect(mockSecure.has(REFRESH_KEY)).toBe(false);
  });

  it('run when a refresh is definitively rejected', async () => {
    const { sessionStore, auth } = await signedIn();
    auth.refreshRequest.mockRejectedValueOnce(withStatus(401));
    const hook = jest.fn();
    sessionStore.onSignOut(hook);

    await sessionStore.refresh();

    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('run when the stored session is incomplete', async () => {
    mockSecure.set(REFRESH_KEY, 'refresh-old');
    const { sessionStore } = await load();
    const hook = jest.fn();
    sessionStore.onSignOut(hook);
    await sessionStore.restore();
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('a failing or slow hook does not stop the others or the sign-out', async () => {
    const { sessionStore, auth } = await signedIn();
    auth.logoutRequest.mockResolvedValue(undefined);
    const ran: string[] = [];
    sessionStore.onSignOut(() => {
      throw new Error('boom');
    });
    sessionStore.onSignOut(() => Promise.reject(new Error('async boom')));
    sessionStore.onSignOut(async () => void ran.push('third'));

    await sessionStore.logout();

    expect(ran).toEqual(['third']);
    expect(sessionStore.getState().status).toBe('signedOut');
  });

  it('can be unsubscribed', async () => {
    const { sessionStore, auth } = await signedIn();
    auth.logoutRequest.mockResolvedValue(undefined);
    const hook = jest.fn();
    sessionStore.onSignOut(hook)();
    await sessionStore.logout();
    expect(hook).not.toHaveBeenCalled();
  });

  it('are not run by a successful restore, login or refresh', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    const hook = jest.fn();
    sessionStore.onSignOut(hook);
    auth.refreshRequest.mockResolvedValue({ accessToken: 'access-1', refreshToken: 'refresh-1' } as never);
    auth.loginRequest.mockResolvedValue({ success: true, user: admin, accessToken: 'access-2', refreshToken: 'refresh-2' });

    await sessionStore.restore();
    await sessionStore.refresh();
    await sessionStore.login('ca@e2e.test', 'pw');

    expect(hook).not.toHaveBeenCalled();
  });
});

describe('logout with an expired access token', () => {
  it('refreshes once and revokes the server session', async () => {
    seedSession();
    const { sessionStore, auth } = await load();
    auth.refreshRequest.mockResolvedValue({ accessToken: 'access-1', refreshToken: 'refresh-1' } as never);
    await sessionStore.restore();
    auth.logoutRequest.mockRejectedValueOnce(withStatus(401)).mockResolvedValueOnce(undefined);

    await sessionStore.logout();

    expect(auth.refreshRequest).toHaveBeenCalledTimes(2); // restore + the one before the second logout call
    expect(auth.logoutRequest).toHaveBeenCalledTimes(2);
    expect(sessionStore.getState().status).toBe('signedOut');
  });
});

describe('subscribe and update-required flag', () => {
  it('notifies subscribers on state changes and stops after unsubscribe', async () => {
    const { sessionStore } = await load();
    const listener = jest.fn();
    const off = sessionStore.subscribe(listener);
    await sessionStore.restore();
    expect(listener).toHaveBeenCalled();
    listener.mockClear();
    off();
    await sessionStore.restore();
    expect(listener).not.toHaveBeenCalled();
  });

  it('flags update-required once, notifies, and keeps the session untouched', async () => {
    const { sessionStore } = await load();
    const listener = jest.fn();
    sessionStore.subscribe(listener);
    expect(sessionStore.isUpdateRequired()).toBe(false);

    sessionStore.flagUpdateRequired();
    sessionStore.flagUpdateRequired();

    expect(sessionStore.isUpdateRequired()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(sessionStore.getState()).toEqual({ status: 'loading' });
  });
});
