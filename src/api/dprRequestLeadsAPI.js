import apiClient from './apiClient';

export async function submitDprRequestLead(data) {
  const response = await apiClient.post('/dpr-request-leads/submit', data);
  return response.data;
}

export async function fetchDprRequestLeads(filters = {}) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params[key] = value;
    }
  }
  const response = await apiClient.get('/dpr-request-leads', { params });
  return response.data;
}

export async function updateDprRequestServiceAvailed(id, serviceAvailed) {
  const response = await apiClient.patch(`/dpr-request-leads/${id}/service-availed`, {
    serviceAvailed,
  });
  return response.data;
}

export async function fetchDprRequestNotificationEmails() {
  const response = await apiClient.get('/dpr-request-leads/notification-emails');
  return response.data;
}

export async function saveDprRequestNotificationEmails(emails) {
  const response = await apiClient.put('/dpr-request-leads/notification-emails', {
    emails,
  });
  return response.data;
}

export async function deleteDprRequestLead(id) {
  const response = await apiClient.delete(`/dpr-request-leads/${id}`);
  return response.data;
}

export async function fetchDprRequestLeadById(id) {
  const response = await apiClient.get(`/dpr-request-leads/${id}`);
  return response.data;
}

