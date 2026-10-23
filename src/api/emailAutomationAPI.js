import apiClient from './apiClient';

const BASE = '/email-automation';

export const fetchEmailDashboard = async () => (await apiClient.get(`${BASE}/dashboard`)).data.data;

export const fetchEmailRequests = async () => (await apiClient.get(`${BASE}/requests`)).data.data;

export const fetchEmailRequest = async (id, params = {}) =>
  (await apiClient.get(`${BASE}/requests/${id}`, { params })).data.data;

export const uploadEmailExcel = async (file, name, mapping) => {
  const form = new FormData();
  form.append('file', file);
  if (name) form.append('name', name);
  if (mapping) form.append('mapping', JSON.stringify(mapping));
  return (await apiClient.post(`${BASE}/upload`, form)).data.data;
};

export const scheduleEmailRequest = async (id, templateId, scheduledAt, scheduledDates) =>
  (await apiClient.put(`${BASE}/requests/${id}/schedule`, { templateId, scheduledAt, scheduledDates })).data.data;

export const cloneEmailRequest = async (id) => (await apiClient.post(`${BASE}/requests/${id}/clone`)).data.data;

export const cancelEmailRequest = async (id) => (await apiClient.post(`${BASE}/requests/${id}/cancel`)).data.data;

export const retryFailedEmails = async (id) => (await apiClient.post(`${BASE}/requests/${id}/retry-failed`)).data.data;

export const deleteEmailRecipient = async (id, rid) => (await apiClient.delete(`${BASE}/requests/${id}/recipients/${rid}`)).data;

export const deleteEmailRequest = async (id) => (await apiClient.delete(`${BASE}/requests/${id}`)).data;

export const fetchEmailTemplates = async () => (await apiClient.get(`${BASE}/templates`)).data.data;

export const saveEmailTemplate = async ({ _id, name, subject, body }) =>
  (_id
    ? await apiClient.put(`${BASE}/templates/${_id}`, { name, subject, body })
    : await apiClient.post(`${BASE}/templates`, { name, subject, body })
  ).data.data;

export const deleteEmailTemplate = async (id) => (await apiClient.delete(`${BASE}/templates/${id}`)).data;

export const fetchEmailFolders = async () => (await apiClient.get(`${BASE}/folders`)).data.data;

export const createEmailFolder = async (name) => (await apiClient.post(`${BASE}/folders`, { name })).data.data;

export const deleteEmailFolder = async (id) => (await apiClient.delete(`${BASE}/folders/${id}`)).data;

export const uploadFolderExcel = async (id, file, mapping) => {
  const form = new FormData();
  form.append('file', file);
  if (mapping) form.append('mapping', JSON.stringify(mapping));
  return (await apiClient.post(`${BASE}/folders/${id}/upload`, form)).data.data;
};

export const fetchFolderContacts = async (id, params = {}) =>
  (await apiClient.get(`${BASE}/folders/${id}/contacts`, { params })).data.data;

export const deleteFolderContact = async (id, cid) => (await apiClient.delete(`${BASE}/folders/${id}/contacts/${cid}`)).data;

export const fetchSelectedFolderEmails = async (folderIds, params = {}) =>
  (await apiClient.get(`${BASE}/folder-emails`, { params: { ...params, folderIds: folderIds.join(',') } })).data.data;

export const scheduleFolders = async ({ folderIds, templateId, scheduledAt, scheduledDates }) =>
  (await apiClient.post(`${BASE}/schedules`, { folderIds, templateId, scheduledAt, scheduledDates })).data.data;

export const fetchEmailQuota = async () => (await apiClient.get(`${BASE}/quota`)).data.data;

export const saveEmailLimit = async (limit) => (await apiClient.put(`${BASE}/quota`, { limit })).data.data;
