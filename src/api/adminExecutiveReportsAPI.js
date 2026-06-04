import apiClient from './apiClient';

const adminExecutiveReportsAPI = {
  getStats: () => apiClient.get('/admin-executive-reports/stats'),

  listMasterData: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const query = searchParams.toString();
    return apiClient.get(
      `/admin-executive-reports/master-data${query ? `?${query}` : ''}`
    );
  },

  downloadMasterDataExcel: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const query = searchParams.toString();
    return apiClient.get(
      `/admin-executive-reports/master-data/export-excel${query ? `?${query}` : ''}`,
      { responseType: 'blob' }
    );
  },

  listReports: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const query = searchParams.toString();
    return apiClient.get(`/admin-executive-reports${query ? `?${query}` : ''}`);
  },

  fetchPdfBlob: (reportId, inline = true) =>
    apiClient.get(`/admin-executive-reports/${reportId}/pdf?inline=${inline}`, {
      responseType: 'blob'
    }),

  markUnderReview: (reportId) => apiClient.patch(`/admin-executive-reports/${reportId}/review`),

  approve: (reportId, validation_notes) =>
    apiClient.patch(`/admin-executive-reports/${reportId}/approve`, { validation_notes }),

  reject: (reportId, rejection_reason) =>
    apiClient.patch(`/admin-executive-reports/${reportId}/reject`, { rejection_reason }),

  bulkApprove: (report_ids, validation_notes) =>
    apiClient.post('/admin-executive-reports/bulk-approve', { report_ids, validation_notes }),

  bulkReject: (report_ids, rejection_reason) =>
    apiClient.post('/admin-executive-reports/bulk-reject', { report_ids, rejection_reason })
};

export default adminExecutiveReportsAPI;
