import type { QueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface Person {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface LinkedReport {
  _id: string;
  title?: string;
  validation_status?: string;
}

/** Only the parts of a DepartmentRequest this app reads. The server sends much more (form fields, drafts). */
export interface AdminRequest {
  _id: string;
  status: 'open' | 'assigned' | 'claimed' | 'completed';
  createdAt: string;
  submittedData?: Record<string, unknown> | null;
  formId?: { _id: string; name?: string } | null;
  departmentId?: { _id?: string; name?: string } | string | null;
  customerId?: Person | null;
  assignedTo?: Person | null;
  claimedBy?: Person | null;
  reportId?: LinkedReport | string | null;
  generationStartedAt?: string | null;
  draftId?: unknown;
  workflow?: { key: string; label: string };
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  openCount: number;
}

export const requestKeys = {
  all: ['admin', 'requests'] as const,
  list: ['admin', 'requests', 'list'] as const,
  detail: (id: string) => ['admin', 'requests', 'detail', id] as const,
  staff: ['admin', 'staff'] as const,
};

export async function listRequests(): Promise<AdminRequest[]> {
  const { data } = await api.get<{ data: AdminRequest[] }>('/govt-forms/requests');
  return data.data;
}

export async function getRequest(id: string): Promise<AdminRequest> {
  const { data } = await api.get<{ data: AdminRequest }>(`/govt-forms/requests/${id}`);
  return data.data;
}

export async function listStaff(): Promise<StaffMember[]> {
  const { data } = await api.get<{ data: StaffMember[] }>('/mobile/admin/staff');
  return data.data;
}

export async function assignRequest(id: string, csUserId: string) {
  await api.post(`/govt-forms/requests/${id}/assign`, { csUserId });
}

export async function releaseRequest(id: string) {
  await api.post(`/govt-forms/requests/${id}/admin-release`);
}

/**
 * Refetch everything an assign or unassign changes: the list, this request, the staff counts, and any dashboard
 * stats or report-context query (matched by name because those screens own their own keys).
 * Resolves once the refetches finish, so a button can stay disabled until the screen shows the new state.
 */
export function invalidateAfterRequestChange(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: requestKeys.all }),
    qc.invalidateQueries({ queryKey: requestKeys.staff }),
    qc.invalidateQueries({ predicate: (q) => q.queryKey.some((k) => typeof k === 'string' && /stats|context/i.test(k)) }),
  ]);
}

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Applicant details, preferring what the applicant typed in the form over the linked customer account. */
export function applicantOf(r: AdminRequest) {
  const d = r.submittedData ?? {};
  const email = clean(d.govt_builtin_email) || clean(r.customerId?.email);
  return {
    name: clean(d.govt_builtin_name) || clean(r.customerId?.name) || 'Applicant',
    phone: clean(d.govt_builtin_phone) || clean(r.customerId?.phone),
    // Accounts created from a phone number carry a placeholder address; the web hides it too.
    email: email.endsWith('@phone.customer.finvois') ? '' : email,
    scheme: clean(d.scheme) || clean(r.formId?.name),
  };
}
