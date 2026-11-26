import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from '~/api/push';
import { sessionStore } from '~/auth/sessionStore';
import { deleteSecure, getSecure, setSecure } from '~/auth/storage';

// Flags only, nothing secret: whether the rationale was shown, and which user+token pair the server already has.
const SEEN_KEY = 'finovis.pushRationaleSeen';
const REGISTERED_KEY = 'finovis.pushRegistered';

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

// Android 8+ needs the channel before a token is requested, and Android 13 only prompts once one exists.
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Work alerts',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

const toPermission = ({ granted, canAskAgain }: { granted: boolean; canAskAgain: boolean }): PushPermission =>
  granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied';

export async function getPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') return 'unsupported';
  await ensureChannel();
  return toPermission(await Notifications.getPermissionsAsync());
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') return 'unsupported';
  await ensureChannel();
  return toPermission(await Notifications.requestPermissionsAsync());
}

/**
 * Gets this device's Expo token and tells the server, unless the server already has this user+token.
 * Never throws: a failure just means the next launch tries again.
 */
export async function syncPushToken(userId: string): Promise<'registered' | 'unchanged' | 'unavailable'> {
  if (Platform.OS === 'web') return 'unavailable';
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return 'unavailable';
  try {
    await ensureChannel();
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const mark = `${userId}:${token}`;
    if ((await getSecure(REGISTERED_KEY)) === mark) return 'unchanged';
    await registerPushToken(token, await sessionStore.getDeviceId());
    await setSecure(REGISTERED_KEY, mark);
    return 'registered';
  } catch {
    return 'unavailable';
  }
}

export async function enablePush(userId: string): Promise<PushPermission> {
  const permission = await requestPushPermission();
  if (permission === 'granted') await syncPushToken(userId);
  return permission;
}

export const rationaleSeen = async () => (await getSecure(SEEN_KEY)) === '1';
export const markRationaleSeen = () => setSecure(SEEN_KEY, '1');

/** Runs on every sign-out path: drops local alerts and badge, and asks the server to forget this device. */
export async function cleanupPushOnSignOut() {
  if (Platform.OS === 'web') return;
  const registered = await getSecure(REGISTERED_KEY);
  await deleteSecure(REGISTERED_KEY);
  await Promise.allSettled([
    Notifications.setBadgeCountAsync(0),
    Notifications.cancelAllScheduledNotificationsAsync(),
    Notifications.dismissAllNotificationsAsync(),
  ]);
  // Not awaited: sign-out must not wait on the network. Best effort, the server also drops the token at logout.
  if (registered) void sessionStore.getDeviceId().then(unregisterPushToken).catch(() => undefined);
}
