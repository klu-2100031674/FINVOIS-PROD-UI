import axios from 'axios';
import { getApiBaseUrl } from '../utils/env';
import { getTunnelRequestHeaders } from '../utils/tunnel';
import { isPublicAnonymousApiPath } from './publicApiPaths';
import { isPublicAppPath } from '../utils/publicAppPaths';

/**
 * Axios API Client Configuration
 * Handles all HTTP requests to the backend
 */

// Default `/api` matches Vite proxy (vite.config.js) — same as api.js. Override with VITE_API_BASE_URL for direct backend URL.
const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
/** Excel/COM + PDF + optional AI can run for minutes; override with VITE_REPORT_API_TIMEOUT (ms) */
export const REPORT_HEAVY_TIMEOUT = parseInt(
  import.meta.env.VITE_REPORT_API_TIMEOUT || '300000',
  10
);
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ca_auth_token';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const tunnelHeaders = getTunnelRequestHeaders(
      config.baseURL || API_BASE_URL || config.url,
    );
    Object.assign(config.headers, tunnelHeaders);

    const token = localStorage.getItem(TOKEN_KEY);
    const reqPath = String(config?.url || '');
    if (token && !isPublicAnonymousApiPath(reqPath)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isPublicAnonymousApiPath(reqPath) && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Authorization');
      } else {
        delete config.headers.Authorization;
      }
    }

    // FormData: drop default `application/json` and any bare `multipart/form-data` so the
    // client sets the correct multipart Content-Type with boundary (required for multer).
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
        } else {
          delete config.headers['Content-Type'];
        }
      }
    }
    
    // Log API calls in development
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log(`🔗 API ${config.method?.toUpperCase()}: ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const errUrl = String(error?.config?.url || '');
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      const isBlobErr = typeof Blob !== 'undefined' && data instanceof Blob;
      let message =
        !isBlobErr && data && (data.error || data.message)
          ? data.error || data.message
          : null;

      // Blob error bodies (responseType: 'blob') — parse JSON to show real error (e.g. 404 "PDF not found")
      if (!message && isBlobErr && typeof data.text === 'function') {
        try {
          const text = await data.text();
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed?.error) message = parsed.error;
            else if (parsed?.message) message = parsed.message;
          }
        } catch (_) {
          /* not JSON or empty */
        }
      }
      if (!message) {
        message = 'An error occurred';
      }

      // Token expired or invalid — do not force login for explicitly public API calls
      if (status === 401) {
        const skipAuthRedirect =
          isPublicAnonymousApiPath(errUrl) || isPublicAppPath();
        if (!skipAuthRedirect) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');

          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
          }
        }
      }

      // Return error message from backend
      return Promise.reject(message);
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(
          'The request timed out. The server may still be processing — try again in a moment.',
        );
      }
      return Promise.reject(
        'Unable to reach the server. Check that the API is running and your connection, then try again.',
      );
    } else {
      return Promise.reject(error.message || 'An error occurred');
    }
  }
);

/** apiClient rejects with a plain string (see response interceptor), not always AxiosError. */
export function apiErrorMessage(err, fallback = 'Request failed') {
  if (typeof err === 'string' && err.trim()) return err;
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

export default apiClient;

// Export base URL for file downloads
export { API_BASE_URL };
