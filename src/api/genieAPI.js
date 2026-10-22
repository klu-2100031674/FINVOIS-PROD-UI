import apiClient from './apiClient';
import { getApiBaseUrl } from '../utils/env';
import { getTunnelRequestHeaders } from '../utils/tunnel';

const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ca_auth_token';

/** Must match the API's RAG question limit (RAG QueryRequest.question max_length). */
export const GENIE_QUESTION_MAX_LENGTH = 1000;
/** Must match the API's document rules (genieSchemeService). */
export const GENIE_DOCUMENT_EXTENSIONS = ['.pdf', '.txt', '.csv'];
export const GENIE_MAX_DOCUMENT_MB = 25;
/** Banner is cropped in the browser to this size (16:9). */
export const GENIE_BANNER_WIDTH = 1280;
export const GENIE_BANNER_HEIGHT = 720;

export const GENIE_QUESTION_TYPES = [
  { value: 'text', label: 'Short answer' },
  { value: 'textarea', label: 'Long answer' },
  { value: 'number', label: 'Number' },
  { value: 'amount', label: 'Amount (₹)' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Single choice' },
  { value: 'multiselect', label: 'Multiple choice' },
  { value: 'yesno', label: 'Yes / No' },
];

const apiBase = () => getApiBaseUrl().replace(/\/$/, '');

/** Banner paths from the API are relative ("/genie/schemes/x/banner?v=1"). */
export function genieAssetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiBase()}${path}`;
}

function readError(data, status, fallback) {
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (status === 503) return 'The AI service is temporarily unavailable. Please try again in a moment.';
  if (status === 504) return 'The AI service took too long to answer. Please try again.';
  return fallback;
}

/**
 * Public calls use fetch without cookies: the landing page is cross-origin in deploy
 * (same approach as the public scheme chat).
 */
async function publicRequest(path, { method = 'GET', body, signal, fallback = 'Request failed' } = {}) {
  let response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method,
      credentials: 'omit',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('Could not reach Finvois. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const error = new Error(readError(data, response.status, fallback));
    error.status = response.status;
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Public Genie
// ---------------------------------------------------------------------------

export async function listGenieSchemes() {
  const data = await publicRequest('/genie/schemes', { fallback: 'Could not load schemes' });
  return data.schemes || [];
}

export async function getGenieScheme(slug) {
  const data = await publicRequest(`/genie/schemes/${encodeURIComponent(slug)}`, {
    fallback: 'Could not load this scheme',
  });
  return data.scheme;
}

/** history: [{ role: 'user'|'assistant', content }]; answers: { [questionKey]: value } */
export async function sendGenieMessage(slug, { message, history, answers, promptIndex }, signal) {
  const data = await publicRequest(`/genie/schemes/${encodeURIComponent(slug)}/chat`, {
    method: 'POST',
    body: { message, history, answers, promptIndex },
    signal,
    fallback: 'Failed to get an answer. Please try again.',
  });
  return data.response || '';
}

/**
 * Streams Genie's answer: onDelta(text) is called for each piece as it is written; resolves with
 * the full answer. The API sends newline-delimited JSON: delta… then done (or error).
 */
export function streamGenieMessage(slug, payload, options) {
  return streamChat(`/genie/schemes/${encodeURIComponent(slug)}/chat/stream`, payload, options);
}

/** Admin test mode: same as streamGenieMessage, for a scheme that may still be a draft. */
export function streamAdminGenieMessage(id, payload, options) {
  return streamChat(`/admin/genie-schemes/${id}/chat/stream`, payload, { ...options, admin: true });
}

async function streamChat(path, { message, history, answers, promptIndex }, { signal, onDelta, admin = false }) {
  const fallback = 'Failed to get an answer. Please try again.';
  const url = `${apiBase()}${path}`;
  const headers = { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' };
  if (admin) {
    Object.assign(headers, getTunnelRequestHeaders(url));
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: admin ? 'include' : 'omit',
      headers,
      body: JSON.stringify({ message, history, answers, promptIndex }),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('Could not reach Finvois. Check your connection and try again.');
  }
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(readError(data, response.status, fallback));
    error.status = response.status;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const event = JSON.parse(line);
      if (event.type === 'delta') {
        answer += event.text;
        onDelta(event.text);
      } else if (event.type === 'error') {
        throw new Error(event.message || fallback);
      } else if (event.type === 'done') {
        return answer;
      }
    }
  }
  throw new Error('The answer was cut off. Please try again.');
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const unwrapAdminError = (err, fallback) =>
  err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

async function adminCall(promise, fallback) {
  try {
    const response = await promise;
    return response.data;
  } catch (err) {
    throw new Error(unwrapAdminError(err, fallback));
  }
}

export const adminGenieAPI = {
  list: () => adminCall(apiClient.get('/admin/genie-schemes'), 'Could not load schemes').then((d) => d.schemes || []),
  get: (id) => adminCall(apiClient.get(`/admin/genie-schemes/${id}`), 'Could not load scheme').then((d) => d.scheme),
  /** Test mode: the scheme as Genie shows it to users, drafts included. */
  preview: (id) =>
    adminCall(apiClient.get(`/admin/genie-schemes/${id}/preview`), 'Could not load this scheme').then((d) => d.scheme),
  create: (payload) =>
    adminCall(apiClient.post('/admin/genie-schemes', payload), 'Could not create scheme').then((d) => d.scheme),
  update: (id, payload) =>
    adminCall(apiClient.put(`/admin/genie-schemes/${id}`, payload), 'Could not save scheme').then((d) => d.scheme),
  remove: (id) => adminCall(apiClient.delete(`/admin/genie-schemes/${id}`), 'Could not delete scheme'),
  uploadBanner: (id, blob) => {
    const form = new FormData();
    form.append('banner', blob, 'banner.jpg');
    return adminCall(
      apiClient.post(`/admin/genie-schemes/${id}/banner`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      }),
      'Could not upload banner'
    ).then((d) => d.scheme);
  },
  removeBanner: (id) =>
    adminCall(apiClient.delete(`/admin/genie-schemes/${id}/banner`), 'Could not remove banner').then((d) => d.scheme),
  /** Ready-made sets: [{ id, name, questions, prompts }] (PMEGP, CMEP, AP IDP, short demo). */
  sampleSets: () =>
    adminCall(apiClient.get('/admin/genie-schemes/sample-sets'), 'Could not load sample sets').then((d) => d.sets || []),
  listDocuments: (id) => adminCall(apiClient.get(`/admin/genie-schemes/${id}/documents`), 'Could not load documents'),
  uploadDocuments: (id, files, onUploadProgress) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return adminCall(
      apiClient.post(`/admin/genie-schemes/${id}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
        onUploadProgress,
      }),
      'Could not upload documents'
    );
  },
  /** Short-lived read-only link to the stored original file. */
  getDocumentLink: (id, filename) =>
    adminCall(
      apiClient.get(`/admin/genie-schemes/${id}/documents/${encodeURIComponent(filename)}/link`),
      'Could not open document'
    ).then((d) => d.url),
  deleteDocument: (id, filename) =>
    adminCall(
      apiClient.delete(`/admin/genie-schemes/${id}/documents/${encodeURIComponent(filename)}`),
      'Could not delete document'
    ),
};
