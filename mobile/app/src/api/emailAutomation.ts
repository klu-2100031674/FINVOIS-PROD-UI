import { api } from './client';
import { UPLOAD_TIMEOUT_MS, filePart, type UploadFile } from './agentRequests';

const BASE = '/email-automation';

export interface EmailColumn {
  key: string;
  label: string;
}

export interface EmailAttachment {
  _id: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

export interface EmailStats {
  pending: number;
  scheduled: number;
  processing: number;
  sent: number;
  failed: number;
  total: number;
}

export interface EmailCounts {
  total: number;
  valid: number;
  invalid: number;
  duplicate: number;
  incomplete: number;
}

export interface EmailRequest {
  _id: string;
  name: string;
  file_name?: string;
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  columns?: EmailColumn[];
  template?: { _id: string; name: string; subject?: string } | null;
  folders?: { _id: string; name?: string }[];
  attachments?: EmailAttachment[];
  scheduled_at?: string | null;
  completed_at?: string | null;
  send_dates?: string[];
  run_history?: { date: string; sent: number; failed: number }[];
  cloned_from?: string | null;
  last_error?: string;
  counts: EmailCounts;
  stats: EmailStats;
}

export interface EmailRecipient {
  _id: string;
  row_number?: number;
  source?: string;
  email?: string;
  bank?: string;
  bank_address?: string;
  office?: string;
  region?: string;
  data?: Record<string, string>;
  validation: 'valid' | 'invalid' | 'duplicate' | 'incomplete';
  validation_errors?: string[];
  status: 'none' | 'pending' | 'scheduled' | 'processing' | 'sent' | 'failed';
  error?: string;
  sent_at?: string | null;
}

export interface EmailFolder {
  _id: string;
  name: string;
  count: number;
  columns?: EmailColumn[];
}

export interface EmailContact {
  _id: string;
  email: string;
  bank?: string;
  region?: string;
  office?: string;
  data?: Record<string, string>;
  source?: string;
  folders?: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface EmailQuota {
  limit: number;
  sentLast24h: number;
  remaining: number;
}

export interface ColumnMapping {
  email: string;
  bank: string;
  region: string;
  extra: string;
}

export interface FolderUploadSummary {
  file_name: string;
  added: number;
  updated: number;
  skipped: number;
  count: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  validation?: string;
}

export interface SendPlan {
  templateId: string;
  /** Send now: one instant. */
  scheduledAt?: string;
  /** Scheduled: one instant per date. */
  scheduledDates?: string[];
  attachmentIds?: string[];
}

export const emailKeys = {
  all: ['email'] as const,
  requests: ['email', 'requests'] as const,
  request: (id: string) => ['email', 'request', id] as const,
  requestPage: (id: string, params: ListParams) => ['email', 'request', id, params] as const,
  quota: ['email', 'quota'] as const,
  templates: ['email', 'templates'] as const,
  folders: ['email', 'folders'] as const,
  contacts: (id: string, params: ListParams) => ['email', 'contacts', id, params] as const,
  contactsOf: (id: string) => ['email', 'contacts', id] as const,
  selected: (ids: string[], params: ListParams) => ['email', 'selected', ids, params] as const,
};

interface Envelope<T> {
  data: T;
}

const get = async <T>(url: string, params?: object) => (await api.get<Envelope<T>>(`${BASE}${url}`, { params })).data.data;
const clean = (p: ListParams) => ({ ...p, search: p.search?.trim() || undefined, validation: p.validation || undefined });

export const listEmailRequests = () => get<EmailRequest[]>('/requests');
export const getEmailQuota = () => get<EmailQuota>('/quota');
export const listEmailTemplates = () => get<EmailTemplate[]>('/templates');
export const listEmailFolders = () => get<EmailFolder[]>('/folders');

export const getEmailRequest = (id: string, params: ListParams = {}) =>
  get<{ request: EmailRequest; recipients: EmailRecipient[]; pagination: Pagination }>(`/requests/${id}`, clean(params));

export const listFolderContacts = (id: string, params: ListParams = {}) =>
  get<{ contacts: EmailContact[]; pagination: Pagination }>(`/folders/${id}/contacts`, clean(params));

/** Unique emails across these folders, as a send would see them. */
export const listSelectedEmails = (folderIds: string[], params: ListParams = {}) =>
  get<{ contacts: EmailContact[]; pagination: Pagination }>('/folder-emails', { ...clean(params), folderIds: folderIds.join(',') });

export async function saveEmailLimit(limit: number): Promise<EmailQuota> {
  return (await api.put<Envelope<EmailQuota>>(`${BASE}/quota`, { limit })).data.data;
}

export async function cancelEmailRequest(id: string): Promise<void> {
  await api.post(`${BASE}/requests/${id}/cancel`);
}

export async function retryFailedEmails(id: string): Promise<void> {
  await api.post(`${BASE}/requests/${id}/retry-failed`);
}

/** A new draft with the same recipients, ready for a new template and dates. */
export async function cloneEmailRequest(id: string): Promise<EmailRequest> {
  return (await api.post<Envelope<EmailRequest>>(`${BASE}/requests/${id}/clone`)).data.data;
}

export async function deleteEmailRequest(id: string): Promise<void> {
  await api.delete(`${BASE}/requests/${id}`);
}

export async function deleteEmailRecipient(id: string, recipientId: string): Promise<void> {
  await api.delete(`${BASE}/requests/${id}/recipients/${recipientId}`);
}

export async function scheduleEmailRequest(id: string, plan: SendPlan): Promise<void> {
  await api.put(`${BASE}/requests/${id}/schedule`, plan);
}

export async function scheduleFolders(folderIds: string[], plan: SendPlan): Promise<void> {
  await api.post(`${BASE}/schedules`, { folderIds, ...plan });
}

export async function saveEmailTemplate(input: {
  _id?: string;
  name: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
}): Promise<EmailTemplate> {
  const { _id, name, subject, body, attachments } = input;
  const payload = { name, subject, body, attachments: attachments.map((a) => a._id) };
  const { data } = _id
    ? await api.put<Envelope<EmailTemplate>>(`${BASE}/templates/${_id}`, payload)
    : await api.post<Envelope<EmailTemplate>>(`${BASE}/templates`, payload);
  return data.data;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await api.delete(`${BASE}/templates/${id}`);
}

export async function createEmailFolder(name: string): Promise<EmailFolder> {
  return (await api.post<Envelope<EmailFolder>>(`${BASE}/folders`, { name })).data.data;
}

export async function deleteEmailFolder(id: string): Promise<void> {
  await api.delete(`${BASE}/folders/${id}`);
}

export async function deleteFolderContact(id: string, contactId: string): Promise<void> {
  await api.delete(`${BASE}/folders/${id}/contacts/${contactId}`);
}

export async function uploadFolderExcel(id: string, file: UploadFile, mapping: ColumnMapping): Promise<FolderUploadSummary> {
  const form = new FormData();
  form.append('file', filePart(file), file.name);
  form.append('mapping', JSON.stringify(mapping));
  const { data } = await api.post<Envelope<FolderUploadSummary>>(`${BASE}/folders/${id}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return data.data;
}

export async function uploadEmailAttachment(file: UploadFile): Promise<EmailAttachment> {
  const form = new FormData();
  form.append('file', filePart(file), file.name);
  const { data } = await api.post<Envelope<EmailAttachment>>(`${BASE}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return data.data;
}

export async function fetchEmailAttachmentBytes(id: string): Promise<Uint8Array<ArrayBuffer>> {
  const { data } = await api.get<ArrayBuffer>(`${BASE}/attachments/${id}/download`, { responseType: 'arraybuffer', timeout: 60000 });
  return new Uint8Array(data);
}
