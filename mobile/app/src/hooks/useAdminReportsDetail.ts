import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveReport,
  getReport,
  getReportContext,
  markUnderReview,
  rejectReport,
  startReReview,
  type ApproveInput,
  type RejectInput,
} from '~/api/adminReports';
import { ADMIN_STATS_KEY } from '~/hooks/useAdminStats';
import { REPORTS_KEY } from '~/hooks/useAdminReports';

/** Prefix of every single-report query (the report and its context). */
export const REPORT_KEY = ['admin', 'report'] as const;

export function useReport(id: string) {
  return useQuery({ queryKey: [...REPORT_KEY, id], queryFn: () => getReport(id), networkMode: 'always' });
}

/** The department request behind a report: who handles it. Failing to load it must not block the report itself. */
export function useReportContext(id: string) {
  return useQuery({
    queryKey: [...REPORT_KEY, id, 'context'],
    queryFn: () => getReportContext(id),
    networkMode: 'always',
  });
}

/**
 * Review actions. After any outcome (also a refused one: the status may have changed elsewhere) the report, the report
 * lists and the dashboard counts are refetched. The mutation stays pending until the report itself is fresh, so the
 * buttons never show for a status the report no longer has.
 */
export function useReportActions(id: string) {
  const qc = useQueryClient();
  const settle = async () => {
    void qc.invalidateQueries({ queryKey: REPORTS_KEY });
    void qc.invalidateQueries({ queryKey: ADMIN_STATS_KEY });
    await qc.invalidateQueries({ queryKey: REPORT_KEY });
  };
  const review = useMutation({ mutationFn: () => markUnderReview(id), onSettled: settle });
  const reReview = useMutation({ mutationFn: () => startReReview(id), onSettled: settle });
  const approve = useMutation({ mutationFn: (input: ApproveInput) => approveReport(id, input), onSettled: settle });
  const reject = useMutation({ mutationFn: (input: RejectInput) => rejectReport(id, input), onSettled: settle });
  return {
    review,
    reReview,
    approve,
    reject,
    busy: review.isPending || reReview.isPending || approve.isPending || reject.isPending,
  };
}
