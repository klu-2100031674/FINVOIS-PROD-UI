import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listReports, mergePages, nextPageNumber, type ReportFilters } from '~/api/adminReports';

/** Prefix of every report list query. Invalidate it after anything that changes a report's status. */
export const REPORTS_KEY = ['admin', 'reports'] as const;

export const SEARCH_DEBOUNCE_MS = 400;

/** Follows `value` after it has stopped changing for `ms`, so typing does not fire a request per keystroke. */
export function useDebounced<T>(value: T, ms = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/** GET /admin-reports as an infinite list (page numbers, 20 per page). `reports` is the merged, de-duplicated rows. */
export function useReportList(filters: ReportFilters) {
  const search = filters.search?.trim() ?? '';
  const query = useInfiniteQuery({
    queryKey: [...REPORTS_KEY, filters.status ?? 'all', filters.reportType ?? 'all', filters.companyId ?? 'all', filters.startDate ?? 'all', search],
    queryFn: ({ pageParam, signal }) => listReports({ ...filters, search }, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: nextPageNumber,
    // Offline must end in the error state with Retry, not a query that stays paused.
    networkMode: 'always',
  });
  const reports = useMemo(() => (query.data ? mergePages(query.data.pages) : []), [query.data]);
  const totalCount = query.data?.pages[0]?.pagination.total_count;
  return { ...query, reports, totalCount };
}
