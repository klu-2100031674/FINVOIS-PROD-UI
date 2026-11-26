import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { deleteSecure, getSecure, setSecure } from '../storage';

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secure = jest.mocked(SecureStore);

describe('storage adapter on a device', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads from secure-store', async () => {
    secure.getItemAsync.mockResolvedValue('value');
    await expect(getSecure('k')).resolves.toBe('value');
    expect(secure.getItemAsync).toHaveBeenCalledWith('k');
  });

  it('writes with the this-device-only, unlocked-only accessibility', async () => {
    await setSecure('k', 'v');
    expect(secure.setItemAsync).toHaveBeenCalledWith('k', 'v', {
      keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });

  it('deletes from secure-store', async () => {
    await deleteSecure('k');
    expect(secure.deleteItemAsync).toHaveBeenCalledWith('k');
  });

  it('returns null for a missing key', async () => {
    secure.getItemAsync.mockResolvedValue(null);
    await expect(getSecure('missing')).resolves.toBeNull();
  });
});

describe('storage adapter on web (test harness only)', () => {
  const session = new Map<string, string>();
  const local = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
  const original = {
    sessionStorage: Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage'),
    localStorage: Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    session.clear();
    jest.replaceProperty(Platform, 'OS', 'web');
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => session.get(k) ?? null,
        setItem: (k: string, v: string) => void session.set(k, v),
        removeItem: (k: string) => void session.delete(k),
      },
    });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: local });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const [name, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete (globalThis as Record<string, unknown>)[name];
    }
  });

  it('round-trips through sessionStorage and never touches localStorage or secure-store', async () => {
    await setSecure('k', 'v');
    await expect(getSecure('k')).resolves.toBe('v');
    await deleteSecure('k');
    await expect(getSecure('k')).resolves.toBeNull();

    expect(local.getItem).not.toHaveBeenCalled();
    expect(local.setItem).not.toHaveBeenCalled();
    expect(secure.setItemAsync).not.toHaveBeenCalled();
    expect(secure.getItemAsync).not.toHaveBeenCalled();
  });

  it('degrades to empty reads when sessionStorage does not exist', async () => {
    delete (globalThis as Record<string, unknown>).sessionStorage;
    await expect(getSecure('k')).resolves.toBeNull();
    await expect(setSecure('k', 'v')).resolves.toBeUndefined();
    await expect(deleteSecure('k')).resolves.toBeUndefined();
  });
});
