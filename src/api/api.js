import axios from 'axios';
import { REPORT_HEAVY_TIMEOUT } from './apiClient';
import { getApiBaseUrl } from '../utils/env';
import { getTunnelRequestHeaders } from '../utils/tunnel';
import { isPublicAnonymousApiPath } from './publicApiPaths';
import { isPublicAppPath } from '../utils/publicAppPaths';
import { resolveSignupApprovalStatus } from '../utils/signupApproval';

/**
 * Centralized API Service
 * All backend API calls with proper authentication
 */

// Configuration
const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ca_auth_token';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper function to get token
const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Helper function to set token
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const tunnelHeaders = getTunnelRequestHeaders(
      config.baseURL || API_BASE_URL || config.url,
    );
    Object.assign(config.headers, tunnelHeaders);

    const token = getAuthToken();
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
    
    // Log API calls in development
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log(`🔗 API ${config.method?.toUpperCase()}: ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiry and errors
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    const errUrl = String(error?.config?.url || '');
    const skipAuthRedirect =
      isPublicAnonymousApiPath(errUrl) || isPublicAppPath();
    if (error.response?.status === 401 && !skipAuthRedirect) {
      console.warn('401 Unauthorized - clearing token and redirecting to login');
      setAuthToken(null);
      localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');

      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/users/register', userData);
      if (response.data.success && response.data.data.token) {
        setAuthToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/users/login', credentials);
      const user = response.data?.data?.user;
      if (user) {
        const approvalStatus = resolveSignupApprovalStatus(user);
        if (approvalStatus !== 'approved') {
          setAuthToken(null);
          const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
          localStorage.removeItem(userKey);
          const message =
            approvalStatus === 'rejected'
              ? 'Your registration was not approved. Please contact support.'
              : 'Your account is pending admin approval.';
          throw { error: message, message };
        }
      }
      if (response.data.success && response.data.data?.token) {
        setAuthToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout
  logout: () => {
    setAuthToken(null);
    localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
  },
};

// ============================================================================
// USER APIs
// ============================================================================

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create admin
  createAdmin: async (adminData) => {
    try {
      const response = await apiClient.post('/users/create-admin', adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all users
  getAllUsers: async (params) => {
    try {
      const response = await apiClient.get('/users/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await apiClient.put(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user credits
  updateUserCredits: async (userId, credits) => {
    try {
      const response = await apiClient.put(`/users/${userId}/credits`, { credits });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================================================
// WALLET APIs
// ============================================================================

export const walletAPI = {
  // Get current user's wallet
  getMyWallet: async () => {
    try {
      const response = await apiClient.get('/wallets/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get wallet by user ID
  getWallet: async (userId) => {
    try {
      const response = await apiClient.get(`/wallets/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create wallet
  createWallet: async (userId) => {
    try {
      const response = await apiClient.post('/wallets', { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get wallet balance (legacy method)
  getBalance: async () => {
    try {
      const response = await apiClient.get('/wallets/balance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add credits
  addCredits: async (amount) => {
    try {
      const response = await apiClient.post('/wallets/add-credits', { amount });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Deduct credits
  deductCredits: async (amount) => {
    try {
      const response = await apiClient.post('/wallets/deduct-credits', { amount });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get transactions
  getTransactions: async () => {
    try {
      const response = await apiClient.get('/wallets/transactions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================================================
// REPORT APIs
// ============================================================================

export const reportAPI = {
  // Get all reports
  getReports: async (params = {}) => {
    try {
      const response = await apiClient.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get specific report
  getReport: async (reportId) => {
    try {
      const response = await apiClient.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new report
  createReport: async (reportData) => {
    try {
      const response = await apiClient.post('/reports', reportData, {
        timeout: REPORT_HEAVY_TIMEOUT,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Apply form data to template
  applyFormData: async (templateId, formData) => {
    try {
      const response = await apiClient.post(
        `/reports/templates/${templateId}/apply-form`,
        formData,
        { timeout: REPORT_HEAVY_TIMEOUT }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Apply final edits (sheet updates) and recalculate
  applyFinalEdits: async (templateId, updates, recalculate = true) => {
    try {
      const response = await apiClient.post(
        `/reports/templates/${templateId}/apply-final`,
        { updates, recalculate },
        { timeout: REPORT_HEAVY_TIMEOUT }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download Excel file
  downloadExcel: async (templateId, fileName) => {
    try {
      const response = await apiClient.get(`/reports/templates/${templateId}/download/${fileName}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export current data to PDF
  exportToPdf: async (jsonData) => {
    try {
      const response = await apiClient.post(`/reports/export/pdf`, { jsonData });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export current data to JSON file
  exportToJson: async (jsonData) => {
    try {
      const response = await apiClient.post(`/reports/export/json`, { jsonData });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Build download URL for exported files
  getExportDownloadUrl: (fileName) => `${API_BASE_URL}/reports/download/${fileName}`,

  // Delete report
  deleteReport: async (reportId) => {
    try {
      const response = await apiClient.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================================================
// TEMPLATE APIs
// ============================================================================

export const templateAPI = {
  // Get all templates
  getTemplates: async (filters = {}) => {
    try {
      const response = await apiClient.get('/reports/templates', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get template by ID (metadata)
  getTemplateById: async (templateId) => {
    try {
      const response = await apiClient.get(`/reports/templates/${templateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get template form
  getTemplateForm: async (templateId) => {
    try {
      const response = await apiClient.get(`/reports/templates/${templateId}/form`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Legacy method for backward compatibility
  getTemplateMetadata: async (templateId) => {
    try {
      const response = await apiClient.get(`/reports/templates/${templateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload template
  uploadTemplate: async (formData) => {
    try {
      const response = await apiClient.post('/templates/upload', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================================================
// ORDER APIs
// ============================================================================

export const orderAPI = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user orders
  getOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get specific order
  getOrder: async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await apiClient.put(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await apiClient.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================================================
// COMMISSION APIs
// ============================================================================

export const commissionAPI = {
  // Get user commissions
  getCommissions: async (params = {}) => {
    try {
      const response = await apiClient.get('/commissions', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get commission summary
  getSummary: async () => {
    try {
      const response = await apiClient.get('/commissions/summary/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get specific commission
  getCommission: async (commissionId) => {
    try {
      const response = await apiClient.get(`/commissions/${commissionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================================================
// DRAFT APIs
// ============================================================================

export const draftAPI = {
  // V2 Drafts module (CRUD by id)
  listDrafts: async (params = {}) => {
    try {
      const response = await apiClient.get('/drafts', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createDraft: async (payload) => {
    try {
      const response = await apiClient.post('/drafts', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  updateDraft: async (draftId, payload) => {
    try {
      const response = await apiClient.put(`/drafts/by-id/${draftId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getDraftById: async (draftId) => {
    try {
      const response = await apiClient.get(`/drafts/by-id/${draftId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  deleteDraftById: async (draftId) => {
    try {
      const response = await apiClient.delete(`/drafts/by-id/${draftId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Legacy template-based drafts (kept for existing flows)
  saveDraft: async (templateId, draftData) => {
    try {
      const response = await apiClient.put(`/drafts/${templateId}`, draftData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getDraft: async (templateId) => {
    try {
      const response = await apiClient.get(`/drafts/${templateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  clearDraft: async (templateId) => {
    try {
      const response = await apiClient.delete(`/drafts/${templateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// ============================================================================
// HEALTH CHECK API
// ============================================================================

export const healthAPI = {
  // Check API health
  check: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Export helpers
export { getAuthToken, setAuthToken, apiClient };

// Default export with all APIs
const api = {
  auth: authAPI,
  user: userAPI,
  wallet: walletAPI,
  report: reportAPI,
  template: templateAPI,
  order: orderAPI,
  commission: commissionAPI,
  draft: draftAPI,
  health: healthAPI,
};

export default api;