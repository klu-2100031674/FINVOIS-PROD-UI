import { AxiosError, type InternalAxiosRequestConfig } from 'axios';

jest.mock('~/auth/sessionStore', () => ({
  sessionStore: { getAccessToken: jest.fn(() => null), refresh: jest.fn(async () => true) },
}));

type Seen = InternalAxiosRequestConfig;

function setup(status: number) {
  const { api } = require('../client') as typeof import('../client');
  const { sessionStore } = require('~/auth/sessionStore');
  sessionStore.refresh.mockClear();
  const seen: Seen[] = [];
  api.defaults.adapter = async (config: Seen) => {
    seen.push(config);
    const response = { status, data: {}, statusText: '', headers: {}, config };
    if (status >= 400) throw new AxiosError('failed', String(status), config, null, response);
    return response;
  };
  return { seen, refresh: sessionStore.refresh as jest.Mock, push: require('../push') as typeof import('../push') };
}

describe('push api', () => {
  it('registers with the token, device id and platform', async () => {
    const { seen, push } = setup(200);
    await push.registerPushToken('ExponentPushToken[abc]', 'device-1');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('/mobile/push/register');
    expect(seen[0].method).toBe('post');
    expect(JSON.parse(seen[0].data)).toEqual({ expoPushToken: 'ExponentPushToken[abc]', deviceId: 'device-1', platform: 'ios' });
  });

  it('unregisters by device id', async () => {
    const { seen, push } = setup(200);
    await push.unregisterPushToken('device-1');
    expect(seen[0].url).toBe('/mobile/push/unregister');
    expect(JSON.parse(seen[0].data)).toEqual({ deviceId: 'device-1' });
  });

  it('a 401 on register goes through the normal refresh and retry', async () => {
    const { seen, refresh, push } = setup(401);
    await expect(push.registerPushToken('ExponentPushToken[abc]', 'device-1')).rejects.toBeTruthy();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(seen).toHaveLength(2);
  });

  // Sign-out clears the access token before its hooks run. A refresh from inside that hook would re-enter sign-out.
  it('a 401 on unregister does not trigger a refresh or a retry', async () => {
    const { seen, refresh, push } = setup(401);
    await expect(push.unregisterPushToken('device-1')).rejects.toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
    expect(seen).toHaveLength(1);
  });

  it('gives up on unregister quickly instead of using the 15 s default', async () => {
    const { seen, push } = setup(200);
    await push.unregisterPushToken('device-1');
    expect(seen[0].timeout).toBe(5000);
  });
});
