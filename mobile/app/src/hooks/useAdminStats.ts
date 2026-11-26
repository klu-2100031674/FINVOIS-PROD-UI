import { useQuery } from '@tanstack/react-query';
import { getStats, getTrends } from '~/api/adminStats';
import { getReportTypes } from '~/api/reportTypes';

/** Prefix for every dashboard stats query. Invalidate it after anything that changes report statuses. */
export const ADMIN_STATS_KEY = ['admin', 'stats'] as const;
export const REPORT_TYPES_KEY = ['admin', 'report-types'] as const;

export const STATS_POLL_MS = 30_000;

/**
 * Dashboard counts for one report type (undefined = all types). Pass `active=false` while the screen is not
 * focused: that stops the 30 s poll, and turning it back on refetches because the data is always stale (staleTime 0).
 * Each type has its own cache entry, so a failed refetch keeps that type's last good numbers in `data`.
 */
export function useAdminStats(reportType: string | undefined, active = true) {
  return useQuery({
    queryKey: [...ADMIN_STATS_KEY, reportType ?? 'all'],
    queryFn: () => getStats({ reportType }),
    enabled: active,
    staleTime: 0,
    refetchInterval: STATS_POLL_MS,
    // Offline must end in an error card with the stale numbers, not a query paused forever.
    networkMode: 'always',
  });
}

/** Daily trend for the dashboard charts. Same prefix as the stats so one invalidation refreshes both. */
export function useAdminTrends(reportType: string | undefined, active = true) {
  return useQuery({
    queryKey: [...ADMIN_STATS_KEY, 'trends', reportType ?? 'all'],
    queryFn: () => getTrends({ reportType, days: 14 }),
    enabled: active,
    staleTime: 60_000,
    networkMode: 'always',
  });
}

export function useReportTypes() {
  return useQuery({
    queryKey: REPORT_TYPES_KEY,
    queryFn: getReportTypes,
    staleTime: 5 * 60_000,
    networkMode: 'always',
  });
}

/** "09:41" in 24 h time, the format of the dashboard's "Updated" stamp. */
export function formatUpdatedAt(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
