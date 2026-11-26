import type { AgentRequest, FormField } from '~/api/agentRequests';

// Turns a request's submitted form into label and value rows, following the web's "Submitted Form Responses" panel
// (CustomerServiceRequestScreen.jsx), including its field aliases and its hidden and merged fields.

export interface FormRow {
  id: string;
  label: string;
  value: string;
}

export interface DprAsset {
  model: string;
  category: string;
  amount: string;
  loanPercentage: string;
}

export interface RequestFormView {
  highlights: FormRow[];
  rows: FormRow[];
  /** Null when this kind of form has no asset section at all. */
  assets: DprAsset[] | null;
}

interface ExtraField {
  id: string;
  label: string;
  aliases: string[];
  chartKey?: string;
}

const EMPTY = '—';

const TEMPLATE_NAMES: Record<string, string> = {
  frcc1: 'Cash Credit Form 1',
  frcc2: 'Cash Credit Form 2',
  frcc3: 'Cash Credit Form 3',
  frcc4: 'Cash Credit Form 4',
  frcc5: 'Cash Credit Form 5',
  frcc6: 'Cash Credit Form 6',
  frcc7: 'Cash Credit Form 7',
  term_loan_service_without_stock: 'Term loan without stock',
  term_loan_cc: 'Term Loan + CC',
  term_loan_manufacturing_service_with_stock: 'Term Loan With Stock Form',
  term_loan_ev_vehicle: 'EV Commercial Vehicle',
  term_loan_other_than_ev_vehicle: 'Other Than EV Commercial Vehicle',
  term_loan_jcb_vehicle: 'JCB Vehicle',
  term_loan_tractor_vehicle: 'Tractor Vehicle',
  term_loan_tipper_vehicle: 'Tipper Vehicle',
  term_loan_drone_vehicle: 'Drone Vehicle',
  gold_loan: 'Gold Loan',
};

const HIGHLIGHT_IDS = ['loanType', 'sector', 'suggestedTemplateId'];
const ALWAYS_SHOW = new Set([
  'aadharNumber',
  'panNumber',
  'loanType',
  'sector',
  'workingCapital',
  'workingCapitalMargin',
  'workingCapitalRateOfInterest',
  'loanTermPeriod',
  'rateOfInterest',
  'processingFee',
  'moratoriumPeriod',
  'loanAmount',
  'hasOtherDprInfo',
]);

// MSME and DPR-request forms share one set of keys and MEPMA has another, for the fields below only.
const PREFIXED: { id: string; label: string; key: string }[] = [
  { id: 'loanType', label: 'Loan type', key: 'loan_type' },
  { id: 'sector', label: 'Sector', key: 'sector' },
  { id: 'natureOfBusiness', label: 'Nature of business', key: 'nature_of_business' },
  { id: 'enterpriseType', label: 'Enterprise type', key: 'enterprise_type' },
  { id: 'yearOfRegistration', label: 'Year of registration', key: 'year_of_registration' },
  { id: 'schemeAppliedUnder', label: 'Scheme applied under', key: 'scheme_applied_under' },
  { id: 'gender', label: 'Gender', key: 'gender' },
  { id: 'ruralUrbanCategory', label: 'Rural or urban category', key: 'rural_urban_category' },
  { id: 'villageCity', label: 'Village or city', key: 'village_city' },
  { id: 'mandal', label: 'Mandal', key: 'mandal' },
  { id: 'district', label: 'District', key: 'district' },
  { id: 'description', label: 'Description', key: 'description' },
];

const PLAIN: ExtraField[] = [
  { id: 'hasOtherDprInfo', label: 'Other DPR information provided', aliases: ['hasOtherDprInfo'] },
  { id: 'workingCapital', label: 'Working capital loan (₹)', aliases: ['workingCapital'] },
  { id: 'workingCapitalMargin', label: 'Working capital margin (%)', aliases: ['workingCapitalMargin'] },
  { id: 'workingCapitalRateOfInterest', label: 'Working capital rate of interest (%)', aliases: ['workingCapitalRateOfInterest'] },
  { id: 'loanTermPeriod', label: 'Loan term period (years)', aliases: ['loanTermPeriod'] },
  { id: 'rateOfInterest', label: 'Rate of interest (%)', aliases: ['rateOfInterest'] },
  { id: 'processingFee', label: 'Processing fee (%)', aliases: ['processingFee'] },
  { id: 'moratoriumPeriod', label: 'Moratorium period (months)', aliases: ['moratoriumPeriod'] },
  { id: 'loanAmount', label: 'Loan amount', aliases: ['loanAmount'] },
  { id: 'hasWorkingCapitalLimitPresent', label: 'Working capital limit at present', chartKey: 'hasWorkingCapitalLimitPresent', aliases: [] },
  { id: 'alsoNewTermLoanForAsset', label: 'Also going for a new term loan for an asset', chartKey: 'alsoNewTermLoanForAsset', aliases: [] },
  { id: 'wcLimitTopup', label: 'WC limit top-up from present limit', chartKey: 'wcLimitTopup', aliases: [] },
  { id: 'hasAuditedLastFy', label: 'Audited FS for last FY', chartKey: 'hasAuditedLastFy', aliases: [] },
  { id: 'hasProvisionalCurrentFy', label: 'Provisional FS for current FY', chartKey: 'hasProvisionalCurrentFy', aliases: [] },
  { id: 'suggestedTemplateId', label: 'Template name', chartKey: 'suggestedTemplateId', aliases: [] },
];

function extraFields(prefixes: string[]): ExtraField[] {
  return [
    { id: 'aadharNumber', label: 'Aadhaar number', aliases: ['aadharNumber', 'aadhaarNumber'] },
    { id: 'panNumber', label: 'PAN number', aliases: ['panNumber'] },
    ...PREFIXED.map(({ id, label, key }) => ({ id, label, aliases: [...prefixes.map((p) => `${p}_${key}`), id] })),
    ...PLAIN,
  ];
}

const MSME_EXTRA = extraFields(['msme', 'dpr_request']);
const MEPMA_EXTRA = extraFields(['mepma']);

const isBlank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';

function firstNonEmpty(data: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) if (!isBlank(data[key])) return data[key];
  return undefined;
}

const yesNo = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s === 'Yes' || s === 'No' ? s : '';
};

/** Sequential Yes/No chart for Working capital or OD loans. Same result as resolveWcOdChartTemplate on the web. */
function suggestedTemplateId(data: Record<string, unknown>): string | undefined {
  const chart = data.wcOdTypeChart as Record<string, unknown> | undefined;
  if (!chart || typeof chart !== 'object') return undefined;
  const stored = String(chart.suggestedTemplateId ?? '').trim().toLowerCase();
  if (/^frcc[1-7]$/.test(stored)) return stored;
  const limit = yesNo(chart.hasWorkingCapitalLimitPresent);
  if (limit === 'Yes') {
    const term = yesNo(chart.alsoNewTermLoanForAsset);
    const topup = yesNo(chart.wcLimitTopup);
    if (!term || !topup) return undefined;
    if (term === 'Yes') return topup === 'Yes' ? 'frcc7' : 'frcc6';
    return topup === 'Yes' ? 'frcc5' : 'frcc4';
  }
  if (limit === 'No') {
    const audited = yesNo(chart.hasAuditedLastFy);
    const provisional = yesNo(chart.hasProvisionalCurrentFy);
    if (!audited || !provisional) return undefined;
    if (audited === 'Yes') return provisional === 'Yes' ? 'frcc2' : 'frcc3';
    return provisional === 'Yes' ? 'frcc3' : 'frcc1';
  }
  return undefined;
}

function extraValue(data: Record<string, unknown>, field: ExtraField): unknown {
  if (field.id === 'suggestedTemplateId') return suggestedTemplateId(data);
  if (field.chartKey) {
    const chart = data.wcOdTypeChart as Record<string, unknown> | undefined;
    if (!chart || typeof chart !== 'object') return undefined;
    return isBlank(chart[field.chartKey]) ? undefined : chart[field.chartKey];
  }
  return firstNonEmpty(data, field.aliases);
}

const displayLoanType = (v: unknown) => {
  const s = String(v).trim().toLowerCase();
  if (s === 'dropline od') return 'Term Loan';
  if (s === 'commercial vehicle loan' || s === 'commercial vehicle') return 'Commercial Vehicle';
  return String(v);
};

function formatValue(val: unknown, fieldId: string): string {
  if (isBlank(val)) return EMPTY;
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.length ? val.map(String).join(', ') : EMPTY;
  if (fieldId === 'loanType') return displayLoanType(val);
  if (fieldId === 'suggestedTemplateId') {
    const id = String(val).trim().toLowerCase();
    return TEMPLATE_NAMES[id] ?? String(val);
  }
  // A file field or any other nested value has no readable form here.
  if (typeof val === 'object') return EMPTY;
  return String(val);
}

function fileValue(val: unknown): string {
  const file = val as { base64?: string; fileName?: string } | null | undefined;
  return file?.base64 ? `${file.fileName || 'Attached file'}. Open it on the web to download.` : 'No document uploaded';
}

const isHiddenStampField = (field: FormField) => {
  const id = String(field.id ?? '').toLowerCase();
  const label = String(field.label ?? '').toLowerCase();
  return id.includes('need_ca_stamp') || id.includes('needcastamp') || label.includes('need ca stamp') || label.includes('stamp required');
};

export function buildRequestForm(request: AgentRequest): RequestFormView {
  const data = (request.submittedData ?? {}) as Record<string, unknown>;
  const route = String(request.formId?.customRoute ?? '').toLowerCase();
  const isMepma = route === 'mepma-dpr';
  const isMsmeLike = route === 'msme-dpr' || route === 'dpr-request';
  const hasExtras = isMepma || isMsmeLike;
  const extras = isMepma ? MEPMA_EXTRA : MSME_EXTRA;

  const loanType = firstNonEmpty(data, ['msme_loan_type', 'mepma_loan_type', 'dpr_request_loan_type', 'loanType']);
  const isWcOd = String(loanType ?? '').trim() === 'Working capital or OD Loan';
  // Working capital or OD loans store the fee on the margin field and copy it to processingFee, so one row is enough.
  const skip = (id: string) => id === 'processingFee' && isWcOd;
  const extraLabel = (f: ExtraField) => (f.id === 'workingCapitalMargin' && isWcOd ? 'Processing fee (%)' : f.label);

  const highlights: FormRow[] = hasExtras
    ? HIGHLIGHT_IDS.map((id) => {
        const f = extras.find((e) => e.id === id) as ExtraField;
        return { id, label: f.label, value: formatValue(extraValue(data, f), id) };
      })
    : [];

  const rows: FormRow[] = [];
  const fields = request.formId?.fields ?? [];
  for (const field of fields) {
    if (!field.id || isHiddenStampField(field)) continue;
    const extra = hasExtras ? extras.find((e) => e.aliases.includes(field.id as string) || e.id === field.id) : undefined;
    if (extra && (HIGHLIGHT_IDS.includes(extra.id) || skip(extra.id))) continue;
    const val = extra ? firstNonEmpty(data, extra.aliases) : data[field.id];
    let label = extra ? extraLabel(extra) : (field.label ?? field.id);
    if (!extra && isWcOd && /working capital margin/i.test(label)) label = 'Processing fee (%)';
    rows.push({
      id: field.id,
      label,
      value: field.type === 'file' ? fileValue(val) : formatValue(val, extra?.id ?? field.id),
    });
  }

  if (hasExtras) {
    for (const f of extras) {
      if (HIGHLIGHT_IDS.includes(f.id) || skip(f.id)) continue;
      if (fields.some((x) => f.id === x.id || (x.id && f.aliases.includes(x.id)))) continue;
      const val = extraValue(data, f);
      if (!ALWAYS_SHOW.has(f.id) && isBlank(val)) continue;
      rows.push({ id: f.id, label: extraLabel(f), value: formatValue(val, f.id) });
    }
  }

  const text = (v: unknown) => (isBlank(v) ? EMPTY : String(v));
  const rawAssets = Array.isArray(data.dprAssets) ? (data.dprAssets as Record<string, unknown>[]) : [];
  const assets = hasExtras
    ? rawAssets.map((a) => ({
        model: text(a.assetModel),
        category: text(a.assetCategory),
        amount: text(a.amount),
        loanPercentage: text(a.loanPercentage),
      }))
    : null;

  return { highlights, rows, assets };
}
