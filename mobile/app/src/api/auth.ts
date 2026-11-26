import { Platform } from 'react-native';
import { api } from './client';
import type { LoginResponse, TokenPair } from './types';
import { APP_VERSION } from '~/config';

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

export async function loginRequest(email: string, password: string, deviceId: string) {
  const { data } = await api.post<LoginResponse>('/mobile/auth/login', {
    email: email.trim(),
    password,
    deviceId,
    platform,
    appVersion: APP_VERSION,
  });
  return data;
}

export async function refreshRequest(refreshToken: string, deviceId: string) {
  const { data } = await api.post<TokenPair & { success: true }>('/mobile/auth/refresh', {
    refreshToken,
    deviceId,
  });
  return data;
}

export async function logoutRequest() {
  await api.post('/mobile/auth/logout');
}
