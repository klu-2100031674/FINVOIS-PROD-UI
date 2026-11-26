import type { QueryClient } from '@tanstack/react-query';
import { api } from './client';

/**
 * The web's four customer-service queues. Each request sits in exactly one (classifyCsWorkQueueBucket on the server):
 * open, assigned (mine, not started), in-progress (started, not finished), cs-completed (mine, approved and paid).
 */
export type Queue = 'open' | 'assigned' | 'in-progress' | 'cs-completed';

export interface Person {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface LinkedReport {
  _id: string;
  title?: string;
  templateId?: string;
  validation_status?: string;
  updatedAt?: string;
  payment?: { status?: string; amount?: number; is_free_credit?: boolean; is_beta_free?: boolean };
}

export interface FormField {
  id?: string;
  label?: string;
  type?: string;
}

/** Only the parts of a DepartmentRequest this app reads. The server sends more (drafts, lead links). */
export interface AgentRequest {
  _id: string;
  status: 'open' | 'assigned' | 'claimed' | 'completed';
  workflow?: { key: string; label: string };
  createdAt: string;
  claimedAt?: string | null;
  generationStartedAt?: string | null;
  submittedData?: Record<string, unknown> | null;
  formId?: { _id?: string; name?: string; customRoute?: string; fields?: FormField[] } | null;
  departmentId?: { _id?: string; name?: string } | string | null;
  customerId?: Person | null;
  assignedTo?: Person | null;
  claimedBy?: Person | null;
  draftId?: unknown;
  reportId?: LinkedReport | string | null;
  emailSent?: boolean;
  whatsAppSent?: boolean;
}

/** assigned, awaiting and ready match the Mine, In progress and Done lists one to one. */
export interface QueueCounts {
  open: number;
  assigned: number;
  awaiting?: number;
  ready?: number;
}

export interface RequestDocument {
  id: string;
  fileName: string;
  contentType?: string;
  size?: number;
  kind?: 'document' | 'image' | 'excel';
  uploaderRole?: string;
  createdAt?: string;
  /** Time-limited signed storage link. It needs no Authorization header and must never be sent one. */
  url?: string;
}

export interface RequestMessage {
  id: string;
  body: string;
  senderRole?: string;
  senderId?: string;
  senderName?: string;
  createdAt: string;
  /** Set only on the optimistic copy shown before the server confirms it. */
  pending?: boolean;
}

export interface DocumentList {
  documents: RequestDocument[];
  canMutate: boolean;
  maxFiles: number;
  maxFileBytes: number;
}

/** A picked file, ready to upload. `file` is only set on web, where the browser reads it directly. */
export interface UploadFile {
  uri: string;
  name: string;
  mimeType?: string;
  file?: Blob;
}

export const MAX_MESSAGE_LENGTH = 4000; // postMessage in departmentRequestCollaborationController.js
// Same limits as the server, used until the first list response says otherwise.
export const DEFAULT_MAX_FILES = 10;
export const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TIMEOUT_MS = 120000;

export const agentKeys = {
  all: ['agent'] as const,
  counts: ['agent', 'counts'] as const,
  queues: ['agent', 'queue'] as const,
  queue: (queue: Queue) => ['agent', 'queue', queue] as const,
  request: (id: string) => ['agent', 'request', id] as const,
  documents: (id: string) => ['agent', 'documents', id] as const,
  messages: (id: string) => ['agent', 'messages', id] as const,
};

// Ids come from navigation params (a push or deep link), so they are encoded before they reach a path.
const path = (id: string) => `/govt-forms/requests/${encodeURIComponent(id)}`;

export async function listQueue(queue: Queue): Promise<AgentRequest[]> {
  const { data } = await api.get<{ data: AgentRequest[] }>('/govt-forms/requests', { params: { queue } });
  return data.data;
}

export async function getCounts(): Promise<QueueCounts> {
  const { data } = await api.get<{ data: QueueCounts }>('/govt-forms/requests/counts');
  return data.data;
}

export async function getRequest(id: string): Promise<AgentRequest> {
  const { data } = await api.get<{ data: AgentRequest }>(path(id));
  return data.data;
}

export async function claimRequest(id: string): Promise<void> {
  await api.post(`${path(id)}/claim`);
}

export async function releaseRequest(id: string): Promise<void> {
  await api.post(`${path(id)}/release`);
}

export async function listDocuments(id: string): Promise<DocumentList> {
  const { data } = await api.get<{
    data: RequestDocument[];
    meta?: { canMutate?: boolean; maxFiles?: number; maxFileBytes?: number };
  }>(`${path(id)}/documents`);
  return {
    documents: data.data,
    canMutate: Boolean(data.meta?.canMutate),
    maxFiles: data.meta?.maxFiles ?? DEFAULT_MAX_FILES,
    maxFileBytes: data.meta?.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES,
  };
}

/** React Native's FormData takes this { uri, name, type } shape for a local file; its types only know Blob. */
export function filePart(f: UploadFile): Blob {
  return f.file ?? ({ uri: f.uri, name: f.name, type: f.mimeType ?? 'application/octet-stream' } as unknown as Blob);
}

export async function uploadDocuments(id: string, files: UploadFile[]): Promise<void> {
  const form = new FormData();
  for (const f of files) {
    form.append('files', filePart(f), f.name);
  }
  await api.post(`${path(id)}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });
}

export async function deleteDocument(id: string, documentId: string): Promise<void> {
  await api.delete(`${path(id)}/documents/${encodeURIComponent(documentId)}`);
}

export async function listMessages(id: string): Promise<{ messages: RequestMessage[]; canPost: boolean }> {
  const { data } = await api.get<{ data: RequestMessage[]; meta?: { canMutate?: boolean } }>(`${path(id)}/messages`);
  return { messages: data.data, canPost: Boolean(data.meta?.canMutate) };
}

export async function postMessage(id: string, body: string): Promise<RequestMessage> {
  const { data } = await api.post<{ data: RequestMessage }>(`${path(id)}/messages`, { body });
  return data.data;
}

/**
 * After claim, release, or a send: every queue list, the counts, and this request are stale. Resolves once the
 * active ones have reloaded, so a mutation that returns it stays pending until the screen shows the new state.
 */
export function invalidateAgentWork(qc: QueryClient, requestId?: string): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: agentKeys.queues }),
    qc.invalidateQueries({ queryKey: agentKeys.counts }),
    requestId ? qc.invalidateQueries({ queryKey: agentKeys.request(requestId) }) : undefined,
  ]);
}
