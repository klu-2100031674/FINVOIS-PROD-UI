import axios from 'axios';

/**
 * Axios API Client Configuration
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ca_auth_token';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(API_TIMEOUT),
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
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;

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
      return Promise.reject(data?.error || data?.message || 'An error occurred');
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
