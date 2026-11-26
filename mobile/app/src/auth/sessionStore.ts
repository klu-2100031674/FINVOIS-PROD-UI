import { randomUUID } from 'expo-crypto';
import { deleteSecure, getSecure, setSecure } from './storage';
// api/auth -> api/client -> this file is an import cycle. It is safe: each side only uses the other
// inside functions, never while its module is still loading.
import { loginRequest, logoutRequest, refreshRequest } from '~/api/auth';
import type { SessionUser } from '~/api/types';
import { apiErrorMessage, apiErrorStatus } from '~/utils/errors';

const REFRESH_KEY = 'finovis.refreshToken';
const DEVICE_KEY = 'finovis.deviceId';
const USER_KEY = 'finovis.user';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut'; notice?: string; noticeIsGood?: boolean }
  | { status: 'signedIn'; user: SessionUser };

type Listener = () => void;

// Access token lives in memory only. The refresh token is the one persisted secret.
let accessToken: string | null = null;
let state: SessionState = { status: 'loading' };
let refreshing: Promise<boolean> | null = null;
// Set when the API answers 426: this build is below the server's minimum version. Lasts until the app restarts.
let updateRequired = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function setState(next: SessionState) {
  state = next;
  notify();
}

async function deviceId(): Promise<string> {
  const existing = await getSecure(DEVICE_KEY);
  if (existing) return existing;
  const id = randomUUID();
  await setSecure(DEVICE_KEY, id);
  return id;
}

async function persist(user: SessionUser, pair: { accessToken: string; refreshToken: string }) {
  accessToken = pair.accessToken;
  await setSecure(REFRESH_KEY, pair.refreshToken);
  await setSecure(USER_KEY, JSON.stringify(user));
  setState({ status: 'signedIn', user });
}

const signOutHooks = new Set<() => void | Promise<void>>();

async function clearLocal(notice?: string, noticeIsGood?: boolean) {
  accessToken = null;
  // allSettled: a failing delete must not leave the UI signed in.
  await Promise.allSettled([deleteSecure(REFRESH_KEY), deleteSecure(USER_KEY)]);
  // Cleanup hooks (query cache, cached PDFs, push token) run on every sign-out path.
  await Promise.all([...signOutHooks].map((h) => Promise.resolve().then(h).catch(() => undefined)));
  setState({ status: 'signedOut', notice, noticeIsGood });
}

// Concurrent callers share one in-flight rotation, so a burst of 401s makes exactly one refresh request.
function rotate(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const token = await getSecure(REFRESH_KEY);
      const userJson = await getSecure(USER_KEY);
      if (!token || !userJson) {
        await clearLocal();
        return false;
      }
      const pair = await refreshRequest(token, await deviceId());
      await persist(JSON.parse(userJson) as SessionUser, pair);
      return true;
    } catch (err) {
      const status = apiErrorStatus(err);
      if (status === 401 || status === 403) {
        // Definite rejection: the session is revoked or expired.
        await clearLocal('Your session ended. Sign in again.');
      } else if (state.status === 'loading') {
        // Offline, timeout or server trouble at launch: keep the stored token, but never leave the user stuck.
        setState({ status: 'signedOut', notice: apiErrorMessage(err) });
      }
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export const sessionStore = {
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Register cleanup that must run whenever the session ends. Returns an unsubscribe. */
  onSignOut(hook: () => void | Promise<void>) {
    signOutHooks.add(hook);
    return () => {
      signOutHooks.delete(hook);
    };
  },
  getState: () => state,
  getAccessToken: () => accessToken,
  getDeviceId: deviceId,

  isUpdateRequired: () => updateRequired,
  flagUpdateRequired() {
    if (updateRequired) return;
    updateRequired = true;
    notify();
  },

  async login(email: string, password: string) {
    const res = await loginRequest(email, password, await deviceId());
    await persist(res.user, res);
  },

  /** Restores a session at launch by rotating the stored refresh token. */
  async restore() {
    const [token, userJson] = await Promise.all([getSecure(REFRESH_KEY), getSecure(USER_KEY)]);
    if (!token && !userJson) return setState({ status: 'signedOut' });
    // rotate() also cleans up a half-written session (token without user, or the reverse).
    await rotate();
  },

  /**
   * Rotates the refresh token. False means no new session; only a definite rejection also signs out.
   * Once signed out there is nothing to rotate, so a late 401 from an in-flight request cannot start a second
   * sign-out (which would overwrite the notice and rerun the cleanup hooks).
   */
  refresh(): Promise<boolean> {
    return state.status === 'signedOut' ? Promise.resolve(false) : rotate();
  },

  async logout() {
    try {
      await logoutRequest();
    } catch (err) {
      // Auth calls are not retried by the client, so an expired access token would leave the server
      // session alive. Refresh once and revoke it for real.
      if (apiErrorStatus(err) === 401 && (await sessionStore.refresh())) {
        await logoutRequest().catch(() => undefined);
      }
    }
    // Best effort above (offline, server down): the local wipe always happens.
    await clearLocal();
  },

  /** Signs out after a password change. The login screen shows the sentence as good news, not as an error. */
  async endAfterPasswordChange(notice: string) {
    // The server normally ended this session with the change, in which case this call has nothing left to do.
    await logoutRequest().catch(() => undefined);
    await clearLocal(notice, true);
  },
};
