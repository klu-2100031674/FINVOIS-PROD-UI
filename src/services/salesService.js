import axios from 'axios';
import { getApiBaseUrl } from '../utils/env';

const SALES_TOKEN_KEY = 'sales_token';
// Same base-URL resolution as the main apiClient: '/api' via the Vite proxy in
// dev, VITE_API_BASE_URL or the host fallback map in deployed builds. The base
// already ends with '/api', so endpoint paths below must NOT repeat it.
// (Previously this used VITE_API_URL, which is unset in deployed builds — all
// sales requests then hit the frontend origin and returned HTML, not JSON.)
const SALES_API_BASE = getApiBaseUrl();

const salesClient = axios.create({
  baseURL: SALES_API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

salesClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(SALES_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

salesClient.interceptors.response.use(
  (res) => {
    // Unwrap { success: true, data: X } so pages can read res.data.field directly
    if (res.data && typeof res.data === 'object' && res.data.success === true && 'data' in res.data) {
      res.data = res.data.data;
    }
    return res;
  },
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Request failed';
    if (err?.response?.status === 401) {
      localStorage.removeItem(SALES_TOKEN_KEY);
      if (!window.location.pathname.startsWith('/crm/login')) {
        window.location.href = '/crm/login';
      }
    }
    return Promise.reject(msg);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const salesLogin = (email, password) =>
  salesClient.post('/sales/auth/login', { email, password });

export const getSalesMe = () => salesClient.get('/sales/auth/me');

// ── Manager – Executives ──────────────────────────────────────────────────
export const createExecutive = (data) =>
  salesClient.post('/sales/manager/executives', data);

export const listExecutives = () =>
  salesClient.get('/sales/manager/executives');

export const updateExecutive = (id, data) =>
  salesClient.put(`/sales/manager/executives/${id}`, data);

export const deleteExecutive = (id) =>
  salesClient.delete(`/sales/manager/executives/${id}`);

// ── Manager – Dashboard & Reports ─────────────────────────────────────────
export const getManagerDashboard = () =>
  salesClient.get('/sales/manager/dashboard');

export const getManagerClients = (filters = {}) =>
  salesClient.get('/sales/manager/clients', { params: filters });

export const reassignClient = (id, data) =>
  salesClient.put(`/sales/manager/clients/${id}/reassign`, data);

export const getPerformanceReport = () =>
  salesClient.get('/sales/manager/reports/performance');

export const getDailyActivityReport = (date, executiveId) =>
  salesClient.get('/sales/manager/reports/daily-activity', {
    params: { date, executiveId },
  });

export const getConversionsReport = (filters = {}) =>
  salesClient.get('/sales/manager/reports/conversions', { params: filters });

export const getPendingFollowUpsReport = () =>
  salesClient.get('/sales/manager/reports/pending-followups');

export const getRejectedReport = () =>
  salesClient.get('/sales/manager/reports/rejected');

export const getManagerFollowUps = (filters = {}) =>
  salesClient.get('/sales/manager/followups', { params: filters });

// ── Clients ───────────────────────────────────────────────────────────────
export const uploadClients = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return salesClient.post('/sales/clients/upload', fd);
};

export const downloadTemplate = () =>
  salesClient.get('/sales/clients/template', { responseType: 'blob' });

export const getQueue = (filters = {}) =>
  salesClient.get('/sales/clients/queue', { params: filters });

export const pickClient = (id) =>
  salesClient.post(`/sales/clients/${id}/pick`);

export const getMyClients = (filters = {}) =>
  salesClient.get('/sales/clients/mine', { params: filters });

export const getClientDetail = (id) =>
  salesClient.get(`/sales/clients/${id}`);

export const addActivity = (clientId, data) =>
  salesClient.post(`/sales/clients/${clientId}/activities`, data);

export const getClientActivities = (clientId) =>
  salesClient.get(`/sales/clients/${clientId}/activities`);

export const updateClientStage = (clientId, stage, rejectionReason) =>
  salesClient.put(`/sales/clients/${clientId}/stage`, {
    stage,
    ...(rejectionReason ? { rejectionReason } : {}),
  });

// ── Follow-Ups ────────────────────────────────────────────────────────────
export const scheduleFollowUp = (clientId, data) =>
  salesClient.post(`/sales/clients/${clientId}/followups`, data);

export const getMyFollowUps = (filters = {}) =>
  salesClient.get('/sales/followups/mine', { params: filters });

export const completeFollowUp = (id) =>
  salesClient.put(`/sales/followups/${id}/complete`);

// ── Stage color map (shared across pages) ────────────────────────────────
export const STAGE_COLORS = {
  Available: 'bg-gray-100 text-gray-600 border-gray-200',
  Assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  Contacted: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Interested: 'bg-green-50 text-green-700 border-green-200',
  'Follow-Up': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Negotiation: 'bg-orange-50 text-orange-700 border-orange-200',
  Converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-600 border-red-200',
};

export const PRIORITY_COLORS = {
  High: 'bg-red-50 text-red-600 border-red-200',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low: 'bg-green-50 text-green-700 border-green-200',
};

// ── Admin Sales API (uses main platform JWT via apiClient) ────────────────────
import apiClient from '../api/apiClient';

export const adminCreateManager = (data) =>
  apiClient.post('/sales/admin/managers', data);

export const adminListManagers = (params = {}) =>
  apiClient.get('/sales/admin/managers', { params });

export const adminGetManagerDetail = (id) =>
  apiClient.get(`/sales/admin/managers/${id}`);

export const adminUpdateManager = (id, data) =>
  apiClient.put(`/sales/admin/managers/${id}`, data);

export const adminDeactivateManager = (id) =>
  apiClient.delete(`/sales/admin/managers/${id}`);

export const adminResetManagerPassword = (id, password) =>
  apiClient.put(`/sales/admin/managers/${id}/reset-password`, { password });

export const adminGetDashboard = () =>
  apiClient.get('/sales/admin/dashboard');

export const adminGetAllClients = (params = {}) =>
  apiClient.get('/sales/admin/clients', { params });

export const adminGetPerformanceReport = (params = {}) =>
  apiClient.get('/sales/admin/reports/performance', { params });

export const adminGetDailyActivity = (params = {}) =>
  apiClient.get('/sales/admin/reports/daily-activity', { params });

export const adminGetConversionsReport = (params = {}) =>
  apiClient.get('/sales/admin/reports/conversions', { params });

export const adminGetPendingFollowUps = (params = {}) =>
  apiClient.get('/sales/admin/reports/pending-followups', { params });

export const adminGetRejectedReport = (params = {}) =>
  apiClient.get('/sales/admin/reports/rejected', { params });

export const adminUploadClients = (file, managerId) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('managerId', managerId);
  return apiClient.post('/sales/admin/clients/upload', fd);
};

export const adminDownloadTemplate = () =>
  apiClient.get('/sales/admin/clients/template', { responseType: 'blob' });
