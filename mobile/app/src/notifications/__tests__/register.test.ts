jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-1' } } }, easConfig: null },
}));
jest.mock('~/api/push', () => ({ registerPushToken: jest.fn(), unregisterPushToken: jest.fn() }));
jest.mock('~/auth/sessionStore', () => ({ sessionStore: { getDeviceId: jest.fn(async () => 'device-1') } }));
jest.mock('~/auth/storage', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    getSecure: jest.fn(async (k: string) => store.get(k) ?? null),
    setSecure: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteSecure: jest.fn(async (k: string) => void store.delete(k)),
  };
});

const TOKEN = 'ExponentPushToken[abc123]';
const flush = () => new Promise((r) => setImmediate(r));

function load(platform: 'ios' | 'android' | 'web' = 'ios') {
  jest.resetModules();
  const RN = require('react-native');
  const restore = jest.replaceProperty(RN.Platform, 'OS', platform).restore;
  const Notifications = require('expo-notifications');
  const Constants = require('expo-constants').default;
  const api = require('~/api/push');
  const storage = require('~/auth/storage');
  const register = require('../register') as typeof import('../register');
  Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: TOKEN, type: 'expo' });
  api.registerPushToken.mockResolvedValue(undefined);
  api.unregisterPushToken.mockResolvedValue(undefined);
  return { Notifications, Constants, api, store: storage.__store as Map<string, string>, register, restore };
}

let restore: () => void = () => undefined;
afterEach(() => restore());
const loaded = (platform?: 'ios' | 'android' | 'web') => {
  const ctx = load(platform);
  restore = ctx.restore;
  return ctx;
};

describe('permission', () => {
  it.each([
    [{ granted: true, canAskAgain: true }, 'granted'],
    [{ granted: false, canAskAgain: true }, 'undetermined'],
    [{ granted: false, canAskAgain: false }, 'denied'],
  ])('maps %j to %s', async (response, expected) => {
    const { Notifications, register } = loaded();
    Notifications.getPermissionsAsync.mockResolvedValue(response);
    await expect(register.getPushPermission()).resolves.toBe(expected);
  });

  it('a denied prompt leaves the app working: no token is requested and nothing throws', async () => {
    const { Notifications, api, register } = loaded();
    Notifications.requestPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    await expect(register.enablePush('user-1')).resolves.toBe('denied');
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(api.registerPushToken).not.toHaveBeenCalled();
  });

  it('a granted prompt registers the device', async () => {
    const { Notifications, api, register } = loaded();
    Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
    await expect(register.enablePush('user-1')).resolves.toBe('granted');
    expect(api.registerPushToken).toHaveBeenCalledWith(TOKEN, 'device-1');
  });
});

describe('registering the token', () => {
  it('sends the Expo token and this device id, with the project id from config', async () => {
    const { Notifications, api, register } = loaded();
    await expect(register.syncPushToken('user-1')).resolves.toBe('registered');
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-1' });
    expect(api.registerPushToken).toHaveBeenCalledTimes(1);
    expect(api.registerPushToken).toHaveBeenCalledWith(TOKEN, 'device-1');
  });

  it('creates the Android channel "default" at high importance before it asks for a token', async () => {
    const { Notifications, register } = loaded('android');
    await register.syncPushToken('user-1');
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.objectContaining({ importance: 4 }));
    expect(Notifications.setNotificationChannelAsync.mock.invocationCallOrder[0]).toBeLessThan(
      Notifications.getExpoPushTokenAsync.mock.invocationCallOrder[0]
    );
  });

  it('creates the channel before the permission prompt on Android, and not at all on iOS', async () => {
    const android = loaded('android');
    android.Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
    await android.register.requestPushPermission();
    expect(android.Notifications.setNotificationChannelAsync.mock.invocationCallOrder[0]).toBeLessThan(
      android.Notifications.requestPermissionsAsync.mock.invocationCallOrder[0]
    );
    android.restore();

    const ios = loaded('ios');
    ios.Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
    await ios.register.requestPushPermission();
    expect(ios.Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('does not re-register on a later launch when the token is the same', async () => {
    const { api, register } = loaded();
    await register.syncPushToken('user-1');
    await expect(register.syncPushToken('user-1')).resolves.toBe('unchanged');
    expect(api.registerPushToken).toHaveBeenCalledTimes(1);
  });

  it('re-registers when the token changed', async () => {
    const { Notifications, api, register } = loaded();
    await register.syncPushToken('user-1');
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[new]', type: 'expo' });
    await expect(register.syncPushToken('user-1')).resolves.toBe('registered');
    expect(api.registerPushToken).toHaveBeenLastCalledWith('ExponentPushToken[new]', 'device-1');
  });

  it('re-registers when a different user signs in on the same phone', async () => {
    const { api, register } = loaded();
    await register.syncPushToken('user-1');
    await expect(register.syncPushToken('user-2')).resolves.toBe('registered');
    expect(api.registerPushToken).toHaveBeenCalledTimes(2);
  });

  it('retries next launch when the server call fails, and never throws', async () => {
    const { api, register } = loaded();
    api.registerPushToken.mockRejectedValueOnce(new Error('offline'));
    await expect(register.syncPushToken('user-1')).resolves.toBe('unavailable');
    await expect(register.syncPushToken('user-1')).resolves.toBe('registered');
    expect(api.registerPushToken).toHaveBeenCalledTimes(2);
  });

  it('survives the token request failing', async () => {
    const { Notifications, api, register } = loaded();
    Notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('no network'));
    await expect(register.syncPushToken('user-1')).resolves.toBe('unavailable');
    expect(api.registerPushToken).not.toHaveBeenCalled();
  });

  it('skips quietly when no EAS project id is configured', async () => {
    const { Notifications, Constants, register } = loaded();
    Constants.expoConfig = { extra: {} };
    await expect(register.syncPushToken('user-1')).resolves.toBe('unavailable');
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});

describe('rationale flag', () => {
  it('is remembered once answered', async () => {
    const { register } = loaded();
    await expect(register.rationaleSeen()).resolves.toBe(false);
    await register.markRationaleSeen();
    await expect(register.rationaleSeen()).resolves.toBe(true);
  });
});

describe('sign-out cleanup', () => {
  it('clears badge and local notifications and asks the server to forget this device', async () => {
    const { Notifications, api, register } = loaded();
    await register.syncPushToken('user-1');
    await register.cleanupPushOnSignOut();
    await flush();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.dismissAllNotificationsAsync).toHaveBeenCalled();
    expect(api.unregisterPushToken).toHaveBeenCalledWith('device-1');
  });

  it('forgets the registration, so the next sign-in registers again', async () => {
    const { api, register } = loaded();
    await register.syncPushToken('user-1');
    await register.cleanupPushOnSignOut();
    await register.syncPushToken('user-1');
    expect(api.registerPushToken).toHaveBeenCalledTimes(2);
  });

  it('does not call the server when this device was never registered', async () => {
    const { Notifications, api, register } = loaded();
    await register.cleanupPushOnSignOut();
    await flush();
    expect(api.unregisterPushToken).not.toHaveBeenCalled();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
  });

  it('still finishes when the server call or a local call fails', async () => {
    const { Notifications, api, register } = loaded();
    await register.syncPushToken('user-1');
    api.unregisterPushToken.mockRejectedValue(new Error('401'));
    Notifications.setBadgeCountAsync.mockRejectedValue(new Error('unsupported'));
    await expect(register.cleanupPushOnSignOut()).resolves.toBeUndefined();
    await flush();
  });

  it('does not wait for the network', async () => {
    const { api, register } = loaded();
    await register.syncPushToken('user-1');
    api.unregisterPushToken.mockReturnValue(new Promise(() => undefined)); // never settles
    await expect(register.cleanupPushOnSignOut()).resolves.toBeUndefined();
  });
});

describe('web', () => {
  it('does nothing', async () => {
    const { Notifications, api, register } = loaded('web');
    await expect(register.getPushPermission()).resolves.toBe('unsupported');
    await expect(register.requestPushPermission()).resolves.toBe('unsupported');
    await expect(register.syncPushToken('user-1')).resolves.toBe('unavailable');
    await register.cleanupPushOnSignOut();
    for (const fn of Object.values(Notifications) as jest.Mock[]) {
      if (jest.isMockFunction(fn)) expect(fn).not.toHaveBeenCalled();
    }
    expect(api.registerPushToken).not.toHaveBeenCalled();
    expect(api.unregisterPushToken).not.toHaveBeenCalled();
  });
});
