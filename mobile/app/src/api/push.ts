import { Platform } from 'react-native';
import type { AxiosRequestConfig } from 'axios';
import { api } from './client';

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

export async function registerPushToken(expoPushToken: string, deviceId: string) {
  await api.post('/mobile/push/register', { expoPushToken, deviceId, platform });
}

// Sign-out runs after the access token is cleared, so this call may well be rejected. `_retried` keeps the
// client from answering that 401 with a refresh, which would re-enter the sign-out that is running.
export async function unregisterPushToken(deviceId: string) {
  await api.post('/mobile/push/unregister', { deviceId }, { _retried: true, timeout: 5000 } as AxiosRequestConfig);
}
