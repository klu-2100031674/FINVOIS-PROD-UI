import apiClient from './apiClient';

export async function fetchMepmaDprLeads(filters = {}) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params[key] = value;
    }
  }
  const response = await apiClient.get('/mepma-dpr-leads', { params });
  return response.data;
}

export async function updateMepmaDprServiceAvailed(id, serviceAvailed) {
  const response = await apiClient.patch(`/mepma-dpr-leads/${id}/service-availed`, {
    serviceAvailed,
  });
  return response.data;
}

export async function fetchMepmaDprNotificationEmails() {
  const response = await apiClient.get('/mepma-dpr-leads/notification-emails');
  return response.data;
}

export async function saveMepmaDprNotificationEmails(emails) {
  const response = await apiClient.put('/mepma-dpr-leads/notification-emails', {
    emails,
  });
  return response.data;
}

export async function deleteMepmaDprLead(id) {
  const response = await apiClient.delete(`/mepma-dpr-leads/${id}`);
  return response.data;
}
