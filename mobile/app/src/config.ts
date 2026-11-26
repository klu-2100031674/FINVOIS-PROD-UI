const raw = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!raw) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
}
if (!/^https:\/\//i.test(raw) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL must be https');
}

export const API_BASE_URL = raw.replace(/\/+$/, '');
export const APP_VERSION = '1.0.0';
