import axios from 'axios';
import { getApiBaseUrl } from '../utils/env';

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
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const reqUrl = String(config?.url || '');
    const isPaymentRequest =
      reqUrl.includes('payment') ||
      reqUrl.includes('create-payment-order') ||
      reqUrl.includes('/orders/');
    if (isPaymentRequest) {
      // #region agent log
      fetch('http://127.0.0.1:7384/ingest/fee4a383-4f25-45c3-bb64-8d6d21b935e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'76235b'},body:JSON.stringify({sessionId:'76235b',runId:'pre-fix',hypothesisId:'H10',location:'apiClient.js:requestInterceptor',message:'Payment-related API request dispatched',data:{method:String(config?.method || '').toUpperCase(),url:reqUrl,hasAuthHeader:!!config?.headers?.Authorization},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
    const resUrl = String(response?.config?.url || '');
    const isPaymentResponse =
      resUrl.includes('payment') ||
      resUrl.includes('create-payment-order') ||
      resUrl.includes('/orders/');
    if (isPaymentResponse) {
      // #region agent log
      fetch('http://127.0.0.1:7384/ingest/fee4a383-4f25-45c3-bb64-8d6d21b935e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'76235b'},body:JSON.stringify({sessionId:'76235b',runId:'pre-fix',hypothesisId:'H10',location:'apiClient.js:responseInterceptor:success',message:'Payment-related API response success',data:{method:String(response?.config?.method || '').toUpperCase(),url:resUrl,status:response?.status || null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
    return response;
  },
  async (error) => {
    const errUrl = String(error?.config?.url || '');
    const isPaymentError =
      errUrl.includes('payment') ||
      errUrl.includes('create-payment-order') ||
      errUrl.includes('/orders/');
    if (isPaymentError) {
      // #region agent log
      fetch('http://127.0.0.1:7384/ingest/fee4a383-4f25-45c3-bb64-8d6d21b935e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'76235b'},body:JSON.stringify({sessionId:'76235b',runId:'pre-fix',hypothesisId:'H6-H8-H10',location:'apiClient.js:responseInterceptor:error',message:'Payment-related API response error',data:{method:String(error?.config?.method || '').toUpperCase(),url:errUrl,status:error?.response?.status || null,error:error?.response?.data?.error || error?.response?.data?.message || error?.message || null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
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

      // Token expired or invalid
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
        
        // Only redirect if not already on the auth page
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }

      // Return error message from backend
      return Promise.reject(message);
    } else if (error.request) {
      // Network error
      return Promise.reject('Network error. Please check your connection.');
    } else {
      return Promise.reject(error.message || 'An error occurred');
    }
  }
);

export default apiClient;

// Export base URL for file downloads
export { API_BASE_URL };
