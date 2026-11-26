import { api } from './client';

export interface AdminStats {
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  total: number;
  /** Returned by the API but unused in v1 (no extra metrics on the dashboard). */
  today_pending: number;
}

const FIELDS = ['pending', 'under_review', 'approved', 'rejected', 'total'] as const;

/** Raw counts from GET /mobile/admin/stats (docs/05 B5). No offsets (D3). An empty reportType means all types. */
export async function getStats({ reportType }: { reportType?: string } = {}): Promise<AdminStats> {
  const { data } = await api.get<{ success: boolean; data?: Partial<AdminStats> }>('/mobile/admin/stats', {
    params: reportType ? { report_type: reportType } : undefined,
  });
  const stats = data?.data;
  // A malformed body must surface as an error card, not as zeros that look like real counts.
  if (!stats || FIELDS.some((f) => typeof stats[f] !== 'number')) {
    throw new Error('Unexpected stats response');
  }
  return { today_pending: 0, ...stats } as AdminStats;
}

/** Daily counts, oldest day first (India time). From GET /mobile/admin/trends. */
export interface AdminTrends {
  days: string[]; // YYYY-MM-DD
  reports: number[];
  requests: number[];
  enquiries: number[];
}

export async function getTrends({ reportType, days = 14 }: { reportType?: string; days?: number } = {}): Promise<AdminTrends> {
  const { data } = await api.get<{ success: boolean; data?: AdminTrends }>('/mobile/admin/trends', {
    params: { days, ...(reportType ? { report_type: reportType } : {}) },
  });
  const t = data?.data;
  const ok = (a: unknown) => Array.isArray(a) && a.length === t?.days?.length;
  if (!t || !Array.isArray(t.days) || !ok(t.reports) || !ok(t.requests) || !ok(t.enquiries)) {
    throw new Error('Unexpected trends response');
  }
  return t;
}
