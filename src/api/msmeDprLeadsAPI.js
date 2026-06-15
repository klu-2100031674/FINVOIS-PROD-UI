import apiClient from './apiClient';

export async function submitMsmeDprLead(data) {
  const response = await apiClient.post('/msme-dpr-leads/submit', data);
  return response.data;
}

export async function fetchMsmeDprLeads(filters = {}) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params[key] = value;
    }
  }
  const response = await apiClient.get('/msme-dpr-leads', { params });
  return response.data;
}

export async function updateMsmeDprServiceAvailed(id, serviceAvailed) {
  const response = await apiClient.patch(`/msme-dpr-leads/${id}/service-availed`, {
    serviceAvailed,
  });
  return response.data;
}

export async function fetchMsmeDprNotificationEmails() {
  const response = await apiClient.get('/msme-dpr-leads/notification-emails');
  return response.data;
}

export async function saveMsmeDprNotificationEmails(emails) {
  const response = await apiClient.put('/msme-dpr-leads/notification-emails', { emails });
  return response.data;
}
