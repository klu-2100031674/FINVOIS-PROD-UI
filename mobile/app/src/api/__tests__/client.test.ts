/* eslint-disable @typescript-eslint/no-require-imports -- a fresh module registry per test needs require; jest-expo does not support dynamic import() */
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// No network: the axios instance gets a fake adapter acting as the API. Everything else is real
// (interceptors, session store, auth endpoints); only secure-store is replaced by a Map.
const mockSecure = new Map<string, string>();

jest.mock('~/auth/storage', () => ({
  getSecure: async (key: string) => mockSecure.get(key) ?? null,
  setSecure: async (key: string, value: string) => void mockSecure.set(key, value),
  deleteSecure: async (key: string) => void mockSecure.delete(key),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'device-uuid-1' }));
// Read when deviceIntegrity loads, i.e. on each setup() after resetModules.
const mockProbe = { compromised: false };
jest.mock('~/security/deviceProbe', () => ({
  isCompromisedNow: () => mockProbe.compromised,
  isDebuggerAttached: async () => false,
}));
beforeEach(() => {
  mockProbe.compromised = false;
});

const REFRESH_KEY = 'finovis.refreshToken';
const admin = { id: 'u1', name: 'Test CA', email: 'ca@e2e.test', role: 'admin' };

interface Call {
  method: string;
  url: string;
  auth: string;
  headers: Record<string, unknown>;
  body: unknown;
}
type Reply = { status: number; data?: unknown } | 'network-error';
/** A test-specific answer for a call; returning nothing falls through to the default server. */
type Handler = (
  call: Call,
  server: { authorized: (call: Call) => boolean }
) => Reply | undefined | Promise<Reply | undefined>;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

/**
 * A small stand-in for the API. Login and refresh issue `access-N` / `refresh-N`; only the latest access
 * token is valid, so `server.expire()` makes the token the app holds stop working.
 */
async function setup(handle: Handler = () => undefined) {
  jest.resetModules(); // fresh session store and axios instance per test
  const { api } = require('../client') as typeof import('../client');
  const { sessionStore } = require('~/auth/sessionStore') as typeof import('~/auth/sessionStore');

  const calls: Call[] = [];
  const server = { issued: null as string | null, n: 0, expire: () => void (server.issued = null) };
  const issue = () => {
    server.n += 1;
    server.issued = `access-${server.n}`;
    return { success: true, accessToken: server.issued, refreshToken: `refresh-${server.n}` };
  };
  const authorized = (call: Call) => call.auth === `Bearer ${server.issued}`;

  const defaults = (call: Call): Reply => {
    if (call.url === '/mobile/auth/login') return { status: 200, data: { ...issue(), user: admin } };
    if (call.url === '/mobile/auth/refresh') return { status: 200, data: issue() };
    return authorized(call) ? { status: 200, data: { ok: true } } : { status: 401, data: { error: 'Unauthorized' } };
  };

  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const call: Call = {
      method: String(config.method),
      url: String(config.url),
      auth: String(config.headers.Authorization ?? ''),
      headers: config.headers.toJSON() as Record<string, unknown>,
      body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    };
    calls.push(call);
    // Long enough for every concurrent 401 to arrive while the refresh is still in flight.
    if (call.url === '/mobile/auth/refresh') await delay(10);
    const reply = (await handle(call, { authorized })) ?? defaults(call);

    if (reply === 'network-error') throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    const response = { data: reply.data ?? {}, status: reply.status, statusText: '', headers: {}, config, request: {} } as AxiosResponse;
    if (reply.status >= 200 && reply.status < 300) return response;
    throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, {}, response);
  };

  const count = (url: string) => calls.filter((c) => c.url === url).length;
  const authsOf = (url: string) => calls.filter((c) => c.url === url).map((c) => c.auth);
  const signIn = () => sessionStore.login('ca@e2e.test', 'pw');
  return { api, sessionStore, calls, server, count, authsOf, signIn };
}

const statusOf = (err: unknown) => (err as AxiosError).response?.status;

describe('request headers', () => {
  it('sends app version and platform, and a Bearer token only while signed in', async () => {
    const { api, calls, signIn } = await setup((call) => (call.url === '/ping' ? { status: 200 } : undefined));

    await api.get('/ping');
    expect(calls[0].headers).toMatchObject({ 'X-App-Version': '1.0.0', 'X-Platform': 'ios' });
    expect(calls[0].auth).toBe('');

    await signIn();
    await api.get('/ping');
    expect(calls[calls.length - 1].auth).toBe('Bearer access-1');
  });

  it('sends no X-Device-Integrity header from a clean device', async () => {
    const { api, calls } = await setup((call) => (call.url === '/ping' ? { status: 200 } : undefined));
    await api.get('/ping');
    expect(calls[0].headers).not.toHaveProperty('X-Device-Integrity');
  });

  it('marks every request from a suspect device, including the retry after a refresh', async () => {
    mockProbe.compromised = true;
    const { api, calls, server, count, signIn } = await setup();
    await signIn();
    server.expire();

    await expect(api.get('/admin-reports/stats')).resolves.toMatchObject({ status: 200 });

    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(calls.length).toBe(4); // login, 401, refresh, retry
    for (const call of calls) expect(call.headers).toMatchObject({ 'X-Device-Integrity': 'suspect' });
  });
});

describe('401 handling', () => {
  it('concurrent 401s trigger exactly one refresh and every request is retried once', async () => {
    const { api, sessionStore, calls, server, count, authsOf, signIn } = await setup();
    await signIn();
    server.expire();

    const results = await Promise.all([
      api.get('/admin-reports/stats'),
      api.get('/govt-forms/requests'),
      api.get('/govt-forms/requests/counts'),
    ]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(count('/mobile/auth/refresh')).toBe(1);
    for (const url of ['/admin-reports/stats', '/govt-forms/requests', '/govt-forms/requests/counts']) {
      expect(authsOf(url)).toEqual(['Bearer access-1', 'Bearer access-2']);
    }
    expect(sessionStore.getAccessToken()).toBe('access-2');
    expect(mockSecure.get(REFRESH_KEY)).toBe('refresh-2');
    // The one refresh sent the stored refresh token with this device's id.
    expect(calls.find((c) => c.url === '/mobile/auth/refresh')!.body).toEqual({
      refreshToken: 'refresh-1',
      deviceId: 'device-uuid-1',
    });
  });

  it('a 401 that arrives after another request already refreshed is retried without a second refresh', async () => {
    const lateGate = deferred();
    // /slow answers only once released, so its 401 lands after the refresh has finished.
    const { api, count, authsOf, signIn, server } = await setup(async (call, { authorized }) => {
      if (call.url !== '/slow') return undefined;
      await lateGate.promise;
      return authorized(call) ? { status: 200 } : { status: 401 };
    });
    await signIn();
    server.expire();

    const slow = api.get('/slow');
    await api.get('/admin-reports/stats'); // 401, refresh, retry
    expect(count('/mobile/auth/refresh')).toBe(1);
    lateGate.resolve();

    await expect(slow).resolves.toMatchObject({ status: 200 });
    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(authsOf('/slow')).toEqual(['Bearer access-1', 'Bearer access-2']);
  });

  it('a request is retried only once, then its 401 is returned and the user stays signed in', async () => {
    const { api, sessionStore, count, signIn } = await setup((call) =>
      call.url === '/always-401' ? { status: 401, data: { error: 'Unauthorized' } } : undefined
    );
    await signIn();

    await expect(api.get('/always-401')).rejects.toMatchObject({ response: { status: 401 } });

    expect(count('/always-401')).toBe(2);
    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(sessionStore.getState().status).toBe('signedIn');
  });

  it('retries a POST with the same body and the new token', async () => {
    const { api, calls, authsOf, server, signIn } = await setup();
    await signIn();
    server.expire();

    await api.post('/govt-forms/requests/r1/claim', { note: 'x' });

    const url = '/govt-forms/requests/r1/claim';
    expect(authsOf(url)).toEqual(['Bearer access-1', 'Bearer access-2']);
    expect(calls.filter((c) => c.url === url).map((c) => c.body)).toEqual([{ note: 'x' }, { note: 'x' }]);
  });

  it('a rejected refresh signs the user out once, with a notice, and fails every waiting request', async () => {
    const { api, sessionStore, count, server, signIn } = await setup((call) =>
      call.url === '/mobile/auth/refresh' ? { status: 401, data: { code: 'TOKEN_REUSED', error: 'Session ended' } } : undefined
    );
    await signIn();
    const hook = jest.fn();
    sessionStore.onSignOut(hook);
    server.expire();

    const results = await Promise.allSettled([api.get('/admin-reports/stats'), api.get('/govt-forms/requests')]);

    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(results.map((r) => statusOf((r as PromiseRejectedResult).reason))).toEqual([401, 401]);
    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: 'Your session ended. Sign in again.' });
    expect(sessionStore.getAccessToken()).toBeNull();
    expect(mockSecure.has(REFRESH_KEY)).toBe(false);
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('a 401 landing after sign-out neither refreshes nor repeats the sign-out', async () => {
    const lateGate = deferred();
    const { api, sessionStore, count, server, signIn } = await setup(async (call) => {
      if (call.url === '/mobile/auth/refresh') return { status: 401, data: { error: 'Session ended' } };
      if (call.url !== '/slow') return undefined;
      await lateGate.promise;
      return { status: 401 };
    });
    await signIn();
    const hook = jest.fn();
    sessionStore.onSignOut(hook);
    server.expire();

    const slow = api.get('/slow');
    await expect(api.get('/admin-reports/stats')).rejects.toMatchObject({ response: { status: 401 } }); // refresh rejected, signed out
    expect(sessionStore.getState().status).toBe('signedOut');
    lateGate.resolve();

    await expect(slow).rejects.toMatchObject({ response: { status: 401 } });
    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(count('/slow')).toBe(1); // no pointless retry without a token
    expect(hook).toHaveBeenCalledTimes(1);
    expect(sessionStore.getState()).toEqual({ status: 'signedOut', notice: 'Your session ended. Sign in again.' });
  });

  it('when the refresh itself cannot connect, the original 401 is returned and the user stays signed in', async () => {
    const { api, sessionStore, count, server, signIn } = await setup((call) =>
      call.url === '/mobile/auth/refresh' ? 'network-error' : undefined
    );
    await signIn();
    server.expire();

    await expect(api.get('/admin-reports/stats')).rejects.toMatchObject({ response: { status: 401 } });

    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(count('/admin-reports/stats')).toBe(1);
    expect(sessionStore.getState().status).toBe('signedIn');
    expect(mockSecure.get(REFRESH_KEY)).toBe('refresh-1');
  });

  it.each([403, 404, 500])('a %i is passed through without a refresh', async (code) => {
    const { api, count, signIn } = await setup((call) => (call.url === '/anything' ? { status: code, data: { error: 'x' } } : undefined));
    await signIn();
    await expect(api.get('/anything')).rejects.toMatchObject({ response: { status: code } });
    expect(count('/anything')).toBe(1);
    expect(count('/mobile/auth/refresh')).toBe(0);
  });

  it('a network error is passed through without a refresh', async () => {
    const { api, count, signIn } = await setup((call) => (call.url === '/anything' ? 'network-error' : undefined));
    await signIn();
    await expect(api.get('/anything')).rejects.toMatchObject({ code: 'ERR_NETWORK' });
    expect(count('/mobile/auth/refresh')).toBe(0);
  });
});

describe('auth endpoints are never retried', () => {
  it.each(['/mobile/auth/login', '/mobile/auth/logout'])('%s answering 401 makes one call and no refresh', async (url) => {
    let forced = false;
    const { api, count, signIn } = await setup((call) => (forced && call.url === url ? { status: 401, data: {} } : undefined));
    await signIn(); // signed in, so a refresh would be possible if the client wrongly tried one
    forced = true;

    await expect(api.post(url, {})).rejects.toMatchObject({ response: { status: 401 } });

    expect(count('/mobile/auth/refresh')).toBe(0);
    expect(count(url)).toBe(url.endsWith('login') ? 2 : 1); // the sign-in above plus this call, or just this call
  });

  it('a refresh answering 401 is made once, signs out, and is not retried', async () => {
    const { sessionStore, count, signIn } = await setup((call) =>
      call.url === '/mobile/auth/refresh' ? { status: 401, data: { error: 'Session ended' } } : undefined
    );
    await signIn();

    await expect(sessionStore.refresh()).resolves.toBe(false);

    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(sessionStore.getState().status).toBe('signedOut');
  });

  it('sign-out with an expired access token refreshes once, then revokes the server session', async () => {
    let revoked = false;
    const { sessionStore, count, authsOf, signIn, server } = await setup((call, { authorized }) => {
      if (call.url !== '/mobile/auth/logout') return undefined;
      if (!authorized(call)) return { status: 401, data: {} };
      revoked = true;
      return { status: 200, data: { success: true } };
    });
    await signIn();
    server.expire();

    await sessionStore.logout();

    expect(count('/mobile/auth/refresh')).toBe(1);
    expect(authsOf('/mobile/auth/logout')).toEqual(['Bearer access-1', 'Bearer access-2']);
    expect(revoked).toBe(true);
    expect(sessionStore.getState().status).toBe('signedOut');
  });
});

describe('426 update required', () => {
  it('flags the update gate and still fails the request', async () => {
    const { api, sessionStore, count, signIn } = await setup((call) =>
      call.url === '/admin-reports/stats' ? { status: 426, data: { success: false, code: 'UPDATE_REQUIRED' } } : undefined
    );
    await signIn();
    expect(sessionStore.isUpdateRequired()).toBe(false);

    await expect(api.get('/admin-reports/stats')).rejects.toMatchObject({ response: { status: 426 } });

    expect(sessionStore.isUpdateRequired()).toBe(true);
    expect(count('/mobile/auth/refresh')).toBe(0);
    expect(sessionStore.getState().status).toBe('signedIn'); // blocked by the gate, not signed out
  });

  it('also flags it when the sign-in call is refused', async () => {
    const { sessionStore, signIn } = await setup(() => ({ status: 426, data: { code: 'UPDATE_REQUIRED' } }));
    await expect(signIn()).rejects.toMatchObject({ response: { status: 426 } });
    expect(sessionStore.isUpdateRequired()).toBe(true);
  });

  it('is not flagged by ordinary errors', async () => {
    const { api, sessionStore } = await setup(() => ({ status: 500, data: {} }));
    await expect(api.get('/anything')).rejects.toBeDefined();
    expect(sessionStore.isUpdateRequired()).toBe(false);
  });
});
