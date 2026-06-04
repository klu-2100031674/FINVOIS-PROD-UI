import apiClient from './apiClient';

export const executiveAPI = {
  fetchLogoBlobUrl: async (which) => {
    const path = which === 'ca' ? '/executive/branding/ca-logo' : '/executive/branding/sbi-logo';
    const response = await apiClient.get(path, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  listReports: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const query = searchParams.toString();
    const response = await apiClient.get(`/executive/reports${query ? `?${query}` : ''}`);
    return response.data;
  },

  fetchReportBlobRaw: async (reportId) =>
    apiClient.get(`/executive/reports/${reportId}/download`, { responseType: 'blob' }),

  optimizeText: async ({ text }) => {
    const response = await apiClient.post('/executive/reports/optimize-text', { text });
    return response.data;
  },

  generateSbiHouseReport: async (formData, imageFiles) => {
    return executiveAPI.generateExecutiveReport('sbi-house', formData, imageFiles);
  },

  generateExecutiveReport: async (templateId, formData, imageFiles) => {
    const body = new FormData();
    body.append('formData', JSON.stringify(formData));
    (imageFiles || []).forEach((file) => {
      body.append('images', file);
    });
    const response = await apiClient.post(`/executive/reports/${templateId}/generate`, body, {
      timeout: 120000
    });
    return response.data;
  },

  downloadReport: async (reportId, fileName) => {
    const response = await apiClient.get(`/executive/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'sbi-house-report.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  fetchReportBlob: async (reportId) => {
    const response = await apiClient.get(`/executive/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const objectUrl = window.URL.createObjectURL(blob);
    return { blob, objectUrl };
  },

  /** @deprecated Use fetchReportBlob in UI for in-page preview */
  viewReport: async (reportId) => {
    const { objectUrl } = await executiveAPI.fetchReportBlob(reportId);
    window.open(objectUrl, '_blank');
  }
};
