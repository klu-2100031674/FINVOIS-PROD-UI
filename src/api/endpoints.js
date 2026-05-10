import apiClient, { API_BASE_URL, REPORT_HEAVY_TIMEOUT } from './apiClient';

/**
 * API Service - All backend API calls
 */

// ============================================================================
// Authentication APIs
// ============================================================================

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await apiClient.post('/users/register', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await apiClient.get(`/users/verify-email?token=${token}`);
    return response.data;
  },

  // Forgot password - Request OTP
  forgotPassword: async (email) => {
    const response = await apiClient.post('/users/forgot-password', { email });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await apiClient.post('/users/verify-otp', { email, otp });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetToken, newPassword) => {
    const response = await apiClient.post('/users/reset-password', {
      resetToken,
      newPassword
    });
    return response.data;
  },

  // Force change password (first-login flow)
  changePassword: async (newPassword) => {
    const response = await apiClient.post('/users/change-password', { newPassword });
    return response.data;
  },
};

// ============================================================================
// Wallet APIs (DEPRECATED - Use pay-per-report system)
// ============================================================================

/**
 * @deprecated Wallet system is deprecated. New system uses direct payment per report.
 */
export const walletAPI = {
  // Get user wallet
  getMyWallet: async () => {
    const response = await apiClient.get('/wallets/me');
    return response.data;
  },

  // Create wallet
  createWallet: async (userId) => {
    const response = await apiClient.post('/wallets', { user_id: userId });
    return response.data;
  },
};

// ============================================================================
// Template APIs
// ============================================================================

export const templateAPI = {
  // Get all templates
  getTemplates: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/reports/templates?${params}`);
    return response.data;
  },

  // Get template by ID
  getTemplateById: async (templateId) => {
    const response = await apiClient.get(`/reports/templates/${templateId}`);
    return response.data;
  },

  // Get template form HTML
  getTemplateForm: async (templateId) => {
    const response = await apiClient.get(`/reports/templates/${templateId}/form`);
    return response.data;
  },
};

// ============================================================================
// Report APIs (Main Feature)
// ============================================================================

export const reportAPI = {
  // Apply form data to template and get calculated Excel
  applyFormData: async (templateId, formData) => {
    const response = await apiClient.post(
      `/reports/templates/${templateId}/apply-form`,
      formData,
      { timeout: REPORT_HEAVY_TIMEOUT }
    );
    return response.data;
  },

  // Download Excel file from database
  getExcelDownloadUrl: (fileId) => {
    return `${API_BASE_URL}/reports/download/${fileId}/excel`;
  },

  // Download AI report (updated for MongoDB storage)
  getAIReportDownloadUrl: (fileId) => {
    return `${API_BASE_URL}/reports/download/${fileId}/ai-report`;
  },

  // Legacy download URL (for backwards compatibility)
  getLegacyDownloadUrl: (templateId, fileName) => {
    return `${API_BASE_URL}/reports/templates/${templateId}/download/${fileName}`;
  },

  // Apply edits from FinalWorkings (or any sheet updates)
  applyFinalEdits: async (templateId, updates, recalculate = true) => {
    const response = await apiClient.post(
      `/reports/templates/${templateId}/apply-final`,
      { updates, recalculate },
      { timeout: REPORT_HEAVY_TIMEOUT }
    );
    return response.data;
  },

  // Export current data to PDF
  exportToPdf: async (jsonData) => {
    const response = await apiClient.post(`/reports/export/pdf`, { jsonData });
    return response.data;
  },

  // Export current data to JSON file
  exportToJson: async (jsonData) => {
    const response = await apiClient.post(`/reports/export/json`, { jsonData });
    return response.data;
  },

  // Create report record
  createReport: async (reportData) => {
    const response = await apiClient.post('/reports', reportData, {
      timeout: REPORT_HEAVY_TIMEOUT,
    });
    return response.data;
  },

  // Get all reports
  getReports: async () => {
    const response = await apiClient.get('/reports');
    return response.data;
  },

  // Get single report
  getReportById: async (reportId) => {
    const response = await apiClient.get(`/reports/${reportId}`);
    return response.data;
  },

  // Delete report
  deleteReport: async (reportId) => {
    const response = await apiClient.delete(`/reports/${reportId}`);
    return response.data;
  },

  // Upload report JSON
  uploadReportJson: async (reportId, jsonData) => {
    const response = await apiClient.post(`/reports/${reportId}/upload-json`, {
      finalData: jsonData,
    });
    return response.data;
  },

  // Generate full AI-enhanced report (Excel PDFs + AI content)
  generateFullReport: async (templateId, formData, options = {}) => {
    const {
      aiApiKey = null,
      aiProvider = 'grok',
      sheets,
      analysisOptions = null,
      paidReportId = null
    } = options || {};

    console.log('🔗 [endpoints.generateFullReport] templateId:', templateId, 'type:', typeof templateId);
    const payload = formData ? { ...formData } : {};

    if (Array.isArray(sheets) && sheets.length) {
      payload.selectedSheets = sheets;
    }

    if (analysisOptions) {
      payload.analysisOptions = analysisOptions;
    }

    if (paidReportId) {
      payload.paidReportId = paidReportId;
    }

    if (aiApiKey) {
      // Map provider to appropriate key name
      if (aiProvider === 'grok' || aiProvider === 'xai') {
        payload.grokApiKey = aiApiKey;
      } else if (aiProvider === 'gemini') {
        payload.geminiApiKey = aiApiKey;
      } else if (aiProvider === 'perplexity') {
        payload.perplexityApiKey = aiApiKey;
      }
    }

    payload.aiProvider = aiProvider;

    const url = `/reports/templates/${templateId}/download-full-report`;
    console.log('🔗 [endpoints.generateFullReport] constructed URL:', url, 'selectedSheets:', payload.selectedSheets?.length || 0);
    const response = await apiClient.post(url, payload, { timeout: REPORT_HEAVY_TIMEOUT });
    return response.data;
  },

  // Download full report file
  getFullReportDownloadUrl: (fileName) => {
    return `${API_BASE_URL}/temp/${fileName}`;
  },

  // Create payment order for report (pay-per-report model)
  createReportPaymentOrder: async (
    templateId,
    reportTitle,
    stageId = null,
    amount = null,
    selectedSheets = null,
    analysisOptions = null,
    formData = null,
    bankName = null,
    branchName = null
  ) => {
    const response = await apiClient.post('/reports/create-payment-order', {
      template_id: templateId,
      report_title: reportTitle,
      stage_id: stageId,
      amount: amount,
      selected_sheets: selectedSheets,
      analysis_options: analysisOptions,
      formData,
      bank_name: bankName,
      branch_name: branchName
    });
    return response.data;
  },

  // Verify payment for report
  verifyReportPayment: async (reportId, paymentData) => {
    const response = await apiClient.post(`/reports/${reportId}/verify-payment`, paymentData);
    return response.data;
  },

  // Upload related documents (PDFs only)
  uploadRelatedDocuments: async (reportId, formData) => {
    const response = await apiClient.post(`/reports/${reportId}/related-documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // List related documents
  getRelatedDocuments: async (reportId) => {
    const response = await apiClient.get(`/reports/${reportId}/related-documents`);
    return response.data;
  },
};

// ============================================================================
// Pricing APIs
// ============================================================================

export const pricingAPI = {
  // Get pricing for a specific template
  getTemplatePricing: async (templateId) => {
    const response = await apiClient.get(`/report-pricing/${templateId}`);
    return response.data;
  },

  // Get all pricing (for display)
  getAllPricing: async () => {
    const response = await apiClient.get('/report-pricing');
    return response.data;
  },
};

// ============================================================================
// Order APIs (Legacy credit-based system - DEPRECATED)
// ============================================================================

/**
 * @deprecated Order APIs are for legacy credit system. Use reportAPI.createReportPaymentOrder instead.
 */
export const orderAPI = {
  // Create order
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders/create', orderData);
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    const response = await apiClient.post('/orders/verify', paymentData);
    return response.data;
  },

  // Get all orders
  getOrders: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },
};

// ============================================================================
// Commission APIs
// ============================================================================

export const commissionAPI = {
  // Get commissions
  getCommissions: async () => {
    const response = await apiClient.get('/commissions');
    return response.data;
  },
};

// ============================================================================
// User Profile APIs
// ============================================================================

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  // Create admin
  createAdmin: async (adminData) => {
    const response = await apiClient.post('/users/create-admin', adminData);
    return response.data;
  },

  // Get all users (super admin only)
  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/users/all?${queryString}`);
    return response.data;
  },

  // Update user role (super admin only)
  updateUserRole: async (userId, role) => {
    const response = await apiClient.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  // Update user credits (super admin only)
  updateUserCredits: async (userId, credits) => {
    const response = await apiClient.put(`/users/${userId}/credits`, credits);
    return response.data;
  },

  // Delete user (super admin only)
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
};

// ============================================================================
// Admin APIs (Super Admin Functions)
// ============================================================================

export const adminAPI = {
  // Create admin
  createAdmin: async (adminData) => {
    const response = await apiClient.post('/users/create-admin', adminData);
    return response.data;
  },

  // Get all users (super admin only)
  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/users?${queryString}`);
    return response.data;
  },

  // Update user (super admin only)
  updateUser: async (userId, userData) => {
    const response = await apiClient.patch(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (super admin only)
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // Get all withdrawals
  getWithdrawals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/withdrawals?${queryString}`);
    return response.data;
  },

  // Update withdrawal status
  updateWithdrawalStatus: async (withdrawalId, status, remarks) => {
    const response = await apiClient.patch(`/withdrawals/${withdrawalId}/status`, { 
      status, 
      admin_remarks: remarks 
    });
    return response.data;
  },

  // Get all pricing
  getPricing: async () => {
    const response = await apiClient.get('/report-pricing');
    return response.data;
  },

  // Create/Update pricing
  savePricing: async (pricingData) => {
    const response = await apiClient.post('/report-pricing', pricingData);
    return response.data;
  },

  // Update pricing
  updatePricing: async (pricingId, pricingData) => {
    const response = await apiClient.put(`/report-pricing/${pricingId}`, pricingData);
    return response.data;
  },

  // Delete pricing
  deletePricing: async (pricingId) => {
    const response = await apiClient.delete(`/report-pricing/${pricingId}`);
    return response.data;
  },

  // Get payment analytics for reports
  getPayments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/admin-reports/payments?${queryString}`);
    return response.data;
  },
};

// ============================================================================
// Agent APIs
// ============================================================================

export const agentAPI = {
  // Get my referrals
  getMyReferrals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/users/my-referrals?${queryString}`);
    return response.data;
  },

  // Get my commissions
  getMyCommissions: async () => {
    const response = await apiClient.get('/commissions');
    return response.data;
  },

  // Get withdrawal balance
  getWithdrawalBalance: async () => {
    const response = await apiClient.get('/withdrawals/balance');
    return response.data;
  },

  // Get my withdrawals
  getMyWithdrawals: async () => {
    const response = await apiClient.get('/withdrawals');
    return response.data;
  },

  // Request withdrawal
  requestWithdrawal: async (amount, paymentMethod, paymentDetails) => {
    const response = await apiClient.post('/withdrawals', {
      amount,
      payment_method: paymentMethod,
      payment_details: paymentDetails
    });
    return response.data;
  },
};

// ============================================================================
// Company APIs
// ============================================================================

export const companyAPI = {
  normalizeCompanyId: (companyId) => String(companyId || '').trim(),
  createCompany: async (companyData) => {
    const response = await apiClient.post('/company/create', companyData);
    return response.data;
  },
  getAllCompanies: async () => {
    const response = await apiClient.get('/company/all');
    return response.data;
  },
  getCompanyById: async (companyId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.get(`/company/${normalizedCompanyId}`);
    return response.data;
  },
  toggleCompanyStatus: async (companyId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.patch(`/company/${normalizedCompanyId}/status`);
    return response.data;
  },
  updateCompany: async (companyId, companyData) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.patch(`/company/${normalizedCompanyId}`, companyData);
    return response.data;
  },
  updateCompanyStatus: async (companyId, isActive) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.patch(`/company/${normalizedCompanyId}/status`, { isActive });
    return response.data;
  },
  getCompanyAdminCandidates: async (companyId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.get(`/company/${normalizedCompanyId}/admin-candidates`);
    return response.data;
  },
  getCompanyUserCandidates: async (companyId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.get(`/company/${normalizedCompanyId}/user-candidates`);
    return response.data;
  },
  assignCompanyAdmin: async (companyId, companyAdminId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.patch(`/company/${normalizedCompanyId}/assign-admin`, { companyAdminId });
    return response.data;
  },
  addCompanyAdmins: async (companyId, userIds) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.post(`/company/${normalizedCompanyId}/company-admins/add`, { userIds });
    return response.data;
  },
  removeCompanyAdmin: async (companyId, userId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.delete(`/company/${normalizedCompanyId}/company-admins/${userId}`);
    return response.data;
  },
  getCompanyAnalytics: async (companyId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.get(`/company/${normalizedCompanyId}/analytics`);
    return response.data;
  },
  getCompanyUsers: async (companyId) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.get('/users', {
      params: { companyId: normalizedCompanyId }
    });
    return response.data;
  },
  createCompanyUser: async (companyId, userData) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.post('/users', {
      ...userData,
      companyId: normalizedCompanyId,
      village_city: 'NIL',
      mandal: 'NIL',
      district: 'NIL',
      state: 'NIL',
      designation: 'NIL',
      designation_other: 'NIL',
      organization_name: 'NIL',
      address: 'NIL'
    });
    return response.data;
  },
  updateCompanyUser: async (userId, payload) => {
    const body = { ...payload };
    if (Object.prototype.hasOwnProperty.call(body, 'companyId') && body.companyId != null) {
      body.companyId = companyAPI.normalizeCompanyId(body.companyId);
    }
    const response = await apiClient.patch(`/users/${userId}`, body);
    return response.data;
  },
  uploadLogo: async (formData) => {
    const response = await apiClient.post('/company/upload-logo', formData);
    return response.data;
  },
  clearLogo: async (companyId, body) => {
    const normalizedCompanyId = companyAPI.normalizeCompanyId(companyId);
    const response = await apiClient.delete(`/company/${normalizedCompanyId}/logo`, {
      data: body
    });
    return response.data;
  },
  transferFreeCredits: async (targetUserId, credits) => {
    const response = await apiClient.post('/users/company-admin/transfer-free-credits', {
      targetUserId,
      credits
    });
    return response.data;
  },
};

// ============================================================================
// Excel Files APIs
// ============================================================================

export const excelFileAPI = {
  // Get user's Excel files
  getExcelFiles: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/excel-files?${queryString}`);
    return response.data;
  },

  // Get Excel file details
  getExcelFile: async (fileId) => {
    const response = await apiClient.get(`/excel-files/${fileId}`);
    return response.data;
  },

  // Delete Excel file
  deleteExcelFile: async (fileId) => {
    const response = await apiClient.delete(`/excel-files/${fileId}`);
    return response.data;
  },
};

// ============================================================================
// Scheme Eligibility APIs
// ============================================================================

export const schemeEligibilityAPI = {
  // Check scheme eligibility
  checkEligibility: async (formData) => {
    const response = await apiClient.post('/scheme-eligibility/check-eligibility', formData);
    return response.data;
  },
};

// ============================================================================
// System Config APIs (Admin only)
// ============================================================================

export const systemConfigAPI = {
  getAll: async () => {
    const response = await apiClient.get('/system-config');
    return response.data;
  },
  getByKey: async (key) => {
    const response = await apiClient.get(`/system-config/${key}`);
    return response.data;
  },
  set: async (key, value, description = '') => {
    const response = await apiClient.put(`/system-config/${key}`, { value, description });
    return response.data;
  },
  setUserFreeReports: async (userId, count) => {
    const response = await apiClient.patch(`/system-config/users/${userId}/free-reports`, { count });
    return response.data;
  },
};

// ============================================================================
// Promotional Emails APIs (Admin only)
// ============================================================================

export const promotionalEmailsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/promotional-emails');
    return response.data;
  },
  add: async (data) => {
    const response = await apiClient.post('/promotional-emails', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/promotional-emails/${id}`, data);
    return response.data;
  },
  toggle: async (id) => {
    const response = await apiClient.patch(`/promotional-emails/${id}/toggle`);
    return response.data;
  },
  remove: async (id) => {
    const response = await apiClient.delete(`/promotional-emails/${id}`);
    return response.data;
  },
};

export default {
  auth: authAPI,
  wallet: walletAPI,
  template: templateAPI,
  report: reportAPI,
  order: orderAPI,
  commission: commissionAPI,
  admin: adminAPI,
  agent: agentAPI,
  company: companyAPI,
  user: userAPI,
  excelFile: excelFileAPI,
  schemeEligibility: schemeEligibilityAPI,
  systemConfig: systemConfigAPI,
  promotionalEmails: promotionalEmailsAPI,
};
