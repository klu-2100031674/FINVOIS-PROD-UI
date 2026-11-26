import { api } from './client';
import type { ReportStatusFilter } from '~/navigation/types';

export const PAGE_SIZE = 20;
export const REJECTION_MIN = 5;
export const REJECTION_MAX = 500;

interface Person {
  name?: string;
  email?: string;
  phone?: string;
}

/** The fields of a report document the mobile screens read. GET /admin-reports and GET /admin-reports/:id return more. */
export interface AdminReport {
  _id: string;
  title?: string;
  client_name?: string;
  templateId?: string;
  report_type?: string;
  /** Mostly a ReportStatusFilter value; draft and pending_payment can also appear on detail. */
  validation_status: string;
  is_re_review?: boolean;
  content_kind?: string;
  createdAt?: string;
  updatedAt?: string;
  validated_at?: string;
  validated_by?: Person | null;
  rejection_reason?: string;
  validation_notes?: string;
  user_comment?: string;
  nature_of_business?: string;
  project_cost?: string | number;
  term_period?: string | number;
  payment?: { status?: string; amount?: number; template_amount?: number; collect_on_download?: boolean };
  companyId?: { companyName?: string } | string | null;
  /** Report owner. */
  user_id?: (Person & { _id?: string; company_name?: string; companyId?: { companyName?: string } | string | null }) | null;
}

export interface Company {
  _id: string;
  companyName?: string;
}

export interface ReportsPage {
  reports: AdminReport[];
  pagination: { current_page: number; total_pages: number; total_count: number; per_page: number };
}

export interface ReportFilters {
  status?: ReportStatusFilter;
  reportType?: string;
  search?: string;
  companyId?: string;
  /** Earliest creation date to include, as an ISO string. */
  startDate?: string;
}

/** GET /mobile/admin/reports/:id/context (docs/05 B6). */
export interface ReportContext {
  requestId: string | null;
  workflow: { key: string; label: string } | null;
  assignedTo: { id: string; name: string; email: string } | null;
  claimedBy: { id: string; name: string; email: string } | null;
  canAssign: boolean;
  canUnassign: boolean;
}

/** Query string for GET /admin-reports. Empty filters are left out so the server applies its defaults. */
export function buildListParams(filters: ReportFilters, page: number, limit = PAGE_SIZE) {
  const search = filters.search?.trim();
  return {
    page,
    limit,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.reportType ? { report_type: filters.reportType } : {}),
    ...(filters.companyId ? { company_id: filters.companyId } : {}),
    ...(filters.startDate ? { start_date: filters.startDate } : {}),
    ...(search ? { search } : {}),
  };
}

export async function listCompanies(): Promise<Company[]> {
  const { data } = await api.get<{ data?: Company[] }>('/company/all');
  return [...(data?.data ?? [])].sort((a, b) => String(a.companyName ?? '').localeCompare(String(b.companyName ?? '')));
}

/** The company shown for a report, looked up in the same order as the web. */
export function reportCompanyName(r: AdminReport): string {
  const named = (c: AdminReport['companyId']) => (c && typeof c === 'object' ? c.companyName : undefined);
  return named(r.companyId) || named(r.user_id?.companyId) || r.user_id?.company_name || '';
}

export const isTheoryReport = (r: AdminReport) => r.content_kind === 'theory' || String(r.templateId ?? '').startsWith('THEORY_');

/** Unpaid channel-partner report: the server refuses approval until the CA sets what the partner pays at download. */
export const needsAmountToCollect = (r: AdminReport) => r.payment?.collect_on_download === true && r.payment?.status !== 'completed';

export const isValidAmount = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;

export async function listReports(filters: ReportFilters, page: number, signal?: AbortSignal): Promise<ReportsPage> {
  const { data } = await api.get<{ data?: Partial<ReportsPage> }>('/admin-reports', {
    params: buildListParams(filters, page),
    signal,
  });
  const body = data?.data;
  // A malformed body must show the error state, not an empty list that reads as "no reports".
  if (!body || !Array.isArray(body.reports) || !body.pagination) throw new Error('Unexpected reports response');
  return body as ReportsPage;
}

/** Merges pages into one list. A report that moved between pages while the user scrolled must not appear twice. */
export function mergePages(pages: ReportsPage[]): AdminReport[] {
  const seen = new Set<string>();
  const out: AdminReport[] = [];
  for (const page of pages) {
    for (const report of page.reports) {
      if (seen.has(report._id)) continue;
      seen.add(report._id);
      out.push(report);
    }
  }
  return out;
}

/** Page number to request after `last`, or undefined when it was the final page. */
export function nextPageNumber(last: ReportsPage): number | undefined {
  const { current_page, total_pages } = last.pagination;
  return current_page < total_pages ? current_page + 1 : undefined;
}

const enc = encodeURIComponent;

export async function getReport(id: string): Promise<AdminReport> {
  const { data } = await api.get<{ data?: AdminReport }>(`/admin-reports/${enc(id)}`);
  if (!data?.data?._id) throw new Error('Unexpected report response');
  return data.data;
}

export async function getReportContext(id: string): Promise<ReportContext> {
  const { data } = await api.get<ReportContext & { success: boolean }>(`/mobile/admin/reports/${enc(id)}/context`);
  return {
    requestId: data.requestId ?? null,
    workflow: data.workflow ?? null,
    assignedTo: data.assignedTo ?? null,
    claimedBy: data.claimedBy ?? null,
    canAssign: Boolean(data.canAssign),
    canUnassign: Boolean(data.canUnassign),
  };
}

export async function markUnderReview(id: string): Promise<void> {
  await api.patch(`/admin-reports/${enc(id)}/review`);
}

export async function startReReview(id: string): Promise<void> {
  await api.patch(`/admin-reports/${enc(id)}/re-review`);
}

export interface ApproveInput {
  validation_notes?: string;
  /** Email the report owner. Starts on, as on the web (OPEN_QUESTIONS Q8). */
  send_email: boolean;
  amount_to_collect?: number;
}

export async function approveReport(id: string, body: ApproveInput): Promise<void> {
  await api.patch(`/admin-reports/${enc(id)}/approve`, body);
}

export interface RejectInput {
  rejection_reason: string;
  send_email: boolean;
}

export async function rejectReport(id: string, body: RejectInput): Promise<void> {
  await api.patch(`/admin-reports/${enc(id)}/reject`, body);
}

export async function whatsappConnected(): Promise<boolean> {
  const { data } = await api.get<{ connected?: boolean }>('/admin-reports/whatsapp-status');
  return data?.connected === true;
}

/** What the admin may do with a report in this status. Mirrors the server; the server still enforces it. */
export function reportActionsFor(status: string) {
  const reviewable = status === 'pending_validation' || status === 'under_review';
  return {
    review: status === 'pending_validation',
    reReview: status === 'rejected',
    approve: reviewable,
    reject: reviewable,
    send: status === 'approved',
  };
}

/** Null when the reason is acceptable, else the sentence to show under the field. */
export function rejectionReasonError(text: string): string | null {
  const n = text.trim().length;
  if (n < REJECTION_MIN) return `Enter at least ${REJECTION_MIN} characters.`;
  if (n > REJECTION_MAX) return `Use ${REJECTION_MAX} characters or fewer.`;
  return null;
}

/** 'admin-report' is the CA's route; 'request-report' is the agent's route for the report behind a request. */
export type PdfSource = 'admin-report' | 'request-report';

export function pdfPath(source: PdfSource, id: string): string {
  return source === 'admin-report' ? `/admin-reports/${enc(id)}/pdf` : `/govt-forms/requests/${enc(id)}/report/pdf`;
}

export class NotAPdfError extends Error {
  constructor() {
    super('The response was not a PDF');
  }
}

export function excelPath(source: PdfSource, id: string): string {
  return source === 'admin-report' ? `/admin-reports/${enc(id)}/excel` : `/govt-forms/requests/${enc(id)}/report/excel`;
}

/** Bytes of the report workbook. An .xlsx file is a zip, so anything not starting with PK is an error body. */
export async function fetchExcelBytes(source: PdfSource, id: string): Promise<Uint8Array<ArrayBuffer>> {
  const { data } = await api.get<ArrayBuffer>(excelPath(source, id), { responseType: 'arraybuffer', timeout: 60000 });
  const bytes = new Uint8Array(data);
  if (String.fromCharCode(...bytes.subarray(0, 2)) !== 'PK') throw new Error('The response was not a workbook');
  return bytes;
}

/** Bytes of the report PDF. Throws NotAPdfError when the body is anything else, so an error page is never cached as a report. */
export async function fetchPdfBytes(source: PdfSource, id: string, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  const { data } = await api.get<ArrayBuffer>(pdfPath(source, id), { responseType: 'arraybuffer', signal });
  const bytes = new Uint8Array(data);
  const magic = String.fromCharCode(...bytes.subarray(0, 4));
  if (magic !== '%PDF') throw new NotAPdfError();
  return bytes;
}
