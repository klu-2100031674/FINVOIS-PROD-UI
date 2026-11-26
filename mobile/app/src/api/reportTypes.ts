import { api } from './client';

export interface ReportTypeOption {
  /** Canonical key the filters accept (report_type query param). */
  value: string;
  label: string;
}

interface ReportTypesResponse {
  success: boolean;
  data?: { options?: Partial<ReportTypeOption>[]; report_types?: string[] };
}

/**
 * GET /admin-reports/meta/report-types. The route returns `data.options` as deduplicated {value,label}
 * pairs (legacy aliases such as frcc2 / Format CC2 collapse into one) plus a flat `report_types` list.
 */
export async function getReportTypes(): Promise<ReportTypeOption[]> {
  const { data } = await api.get<ReportTypesResponse>('/admin-reports/meta/report-types');
  const raw = data?.data?.options ?? (data?.data?.report_types ?? []).map((value) => ({ value }));
  return raw
    .filter((o): o is Partial<ReportTypeOption> & { value: string } => typeof o?.value === 'string' && o.value !== '')
    .map((o) => ({ value: o.value, label: o.label || o.value }));
}
