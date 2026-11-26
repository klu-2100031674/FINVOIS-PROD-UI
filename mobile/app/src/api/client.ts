import { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL, APP_VERSION } from '~/config';
import { sessionStore } from '~/auth/sessionStore';
import { getIntegrityHeader } from '~/security/deviceIntegrity';

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'X-App-Version': APP_VERSION, 'X-Platform': Platform.OS },
});

api.interceptors.request.use((config) => {
  const token = sessionStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Informational only (doc 06 section 7): `suspect` on a compromised device, absent on a clean one.
  config.headers.set(getIntegrityHeader());
  return config;
});

type Retryable = InternalAxiosRequestConfig & { _retried?: boolean };

// One shared refresh for concurrent 401s; a definite refresh rejection signs the user out.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    // The server refuses builds below its minimum version; the update gate blocks the app.
    if (error.response?.status === 426) sessionStore.flagUpdateRequired();

    const original = error.config as Retryable | undefined;
    const isAuthCall = original?.url?.startsWith('/mobile/auth/');
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      throw error;
    }
    original._retried = true;

    // A 401 can arrive after another request already refreshed. Then this one only needs a retry
    // with the new token (the request interceptor swaps it in); refreshing again would rotate twice.
    // After a sign-out there is no token, refresh() returns false, and the 401 is passed on.
    const current = sessionStore.getAccessToken();
    const alreadyRefreshed = current !== null && original.headers.Authorization !== `Bearer ${current}`;
    if (!alreadyRefreshed && !(await sessionStore.refresh())) throw error;
    return api(original);
  }
);
