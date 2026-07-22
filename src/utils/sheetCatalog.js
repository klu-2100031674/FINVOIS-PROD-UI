/**
 * Sheet catalog helpers for admin report sheet selection.
 * Normalizes variant sheet names (Exp/Exp sheet, MPBF/MPBF , BEP/BEP analysis, etc.)
 * so the UI shows one entry per logical sheet.
 */

const TERM_LOAN_TEMPLATE_IDS = new Set([
  'TERM_LOAN_CC',
  'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK',
  'TERM_LOAN_SERVICE_WITHOUT_STOCK',
  'TERM_LOAN_EV_VEHICLE',
  'TERM_LOAN_OTHER_THAN_EV_VEHICLE',
  'TERM_LOAN_JCB_VEHICLE',
  'TERM_LOAN_DRONE_VEHICLE',
]);

const SHARED_ALIAS_MAP = {
  finalworking: 'Final workings',
  finalworkings: 'Final workings',
  finalwork: 'Final workings',
  mpbf: 'MPBF ',
  mpbfformula: 'MPBF ',
  mpbfmethod1: 'MPBF ',
  mpbfmethod2: 'MPBF ',
  workingsforsensitivity1: 'workings for sensitivity1',
  workingsforsensittivity1: 'workings for sensitivity1',
  workingsforsensitvity1: 'workings for sensitivity1',
  gaurantors: 'Gaurantors',
  guarantors: 'Gaurantors',
  bepanalysis: 'BEP analysis',
  bep: 'BEP analysis',
  exp: 'Exp',
  expsheet: 'Exp',
  expenses: 'Exp',
  coverpage: 'Cover page',
  plbs: 'PL BS',
  workingforplbs: 'PL BS',
  workingsforplbs: 'PL BS',
  cfs: 'CFs',
  cfsheet: "CF's",
  loansch: 'Loan sch',
  loanschd: 'Loan Schd',
  repaymentsch: 'Repayment',
  profitabilityindex: 'PI Index',
  piindex: 'PI Index',
  paybackperiodi: 'Payback period I',
  paybackperiod1: 'Payback period I',
  paybackperiodii: 'Payback period II',
  paybackperiod2: 'Payback period II',
};

const TEMPLATE_ALIAS_OVERRIDES = {
  TERM_LOAN_CC: {
    exp: 'Exp sheet',
    expsheet: 'Exp sheet',
    expenses: 'Exp sheet',
    plbs: 'PL BS',
    bep: 'BEP',
  },
  TERM_LOAN_EV_VEHICLE: {
    exp: 'Exp sheet',
    expsheet: 'Exp sheet',
    expenses: 'Exp sheet',
    plbs: 'PL BS',
    bep: 'BEP',
  },
  TERM_LOAN_OTHER_THAN_EV_VEHICLE: {
    exp: 'Exp sheet',
    expsheet: 'Exp sheet',
    expenses: 'Exp sheet',
    plbs: 'PL BS',
    bep: 'BEP',
  },
  TERM_LOAN_JCB_VEHICLE: {
    exp: 'Exp sheet',
    expsheet: 'Exp sheet',
    expenses: 'Exp sheet',
    plbs: 'PL BS',
    bep: 'BEP',
  },
  TERM_LOAN_DRONE_VEHICLE: {
    exp: 'Exp sheet',
    expsheet: 'Exp sheet',
    expenses: 'Exp sheet',
    plbs: 'PL BS',
    bep: 'BEP',
  },
};

export const normalizeSheetKey = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.replace(/[^a-z0-9]/gi, '').toLowerCase();
};

const normalizeTemplateId = (templateId) => {
  const raw = String(templateId || '').trim().toUpperCase();
  if (TERM_LOAN_TEMPLATE_IDS.has(raw)) return raw;
  return raw;
};

const getAliasMap = (templateId) => {
  const normalizedId = normalizeTemplateId(templateId);
  const overrides = TEMPLATE_ALIAS_OVERRIDES[normalizedId] || {};
  return { ...SHARED_ALIAS_MAP, ...overrides };
};

export const isLoanTierIndexSheet = (sheetName) => {
  if (!sheetName || typeof sheetName !== 'string') return false;
  const normalized = sheetName.trim().toLowerCase().replace(/[\s_\-]+/g, '');
  if (!normalized.startsWith('index')) return false;
  if (normalized.includes('piindex') || normalized.includes('profitability')) return false;
  return true;
};

const INDEX_SHEET_GROUP_KEY = '__loan_tier_index__';

export const resolveSheetAlias = (sheetName, templateId) => {
  if (!sheetName || typeof sheetName !== 'string') return '';
  const trimmed = sheetName.trim();
  if (!trimmed.length) return '';

  if (isLoanTierIndexSheet(trimmed)) {
    return trimmed;
  }

  const aliasMap = getAliasMap(templateId);
  const key = normalizeSheetKey(trimmed);
  if (key && aliasMap[key]) {
    return aliasMap[key];
  }
  return trimmed;
};

const getCatalogGroupKey = (sheetName, templateId) => {
  if (isLoanTierIndexSheet(sheetName)) {
    return INDEX_SHEET_GROUP_KEY;
  }
  return normalizeSheetKey(resolveSheetAlias(sheetName, templateId));
};

/**
 * Merge sheet sources into a deduped catalog (canonical display names).
 */
export const buildSheetCatalog = ({
  allAvailable = [],
  fullReportSheets = [],
  requested = [],
  selected = [],
  templateId = null,
} = {}) => {
  const orderedSources = [
    ...(Array.isArray(fullReportSheets) ? fullReportSheets : []),
    ...(Array.isArray(allAvailable) ? allAvailable : []),
    ...(Array.isArray(requested) ? requested : []),
    ...(Array.isArray(selected) ? selected : []),
  ];

  const catalogMap = new Map();

  orderedSources.forEach((rawSheet) => {
    if (typeof rawSheet !== 'string' || !rawSheet.trim().length) return;

    const canonical = resolveSheetAlias(rawSheet, templateId);
    const groupKey = getCatalogGroupKey(canonical, templateId);

    if (!groupKey) return;

    if (!catalogMap.has(groupKey)) {
      catalogMap.set(groupKey, canonical);
      return;
    }

    const existing = catalogMap.get(groupKey);
    const existingFromFull = fullReportSheets.includes(existing);
    const canonicalFromFull = fullReportSheets.includes(canonical);
    if (!existingFromFull && canonicalFromFull) {
      catalogMap.set(groupKey, canonical);
    }
  });

  return Array.from(catalogMap.values());
};

const selectionMatchesSheet = (sheetName, selectionEntry, templateId) => {
  if (!selectionEntry || typeof selectionEntry !== 'string') return false;

  if (isLoanTierIndexSheet(sheetName) && isLoanTierIndexSheet(selectionEntry)) {
    return true;
  }

  const sheetKey = getCatalogGroupKey(sheetName, templateId);
  const selectionKey = getCatalogGroupKey(selectionEntry, templateId);
  return sheetKey && selectionKey && sheetKey === selectionKey;
};

export const sheetSelectionIncludesIndex = (sheets = []) =>
  sheets.some((sheet) => isLoanTierIndexSheet(sheet));

/**
 * Alias-aware checked state for a catalog sheet against active selection.
 */
export const isSheetInSelection = (sheet, selection = [], templateId = null) => {
  if (!Array.isArray(selection) || selection.length === 0) return false;

  if (isLoanTierIndexSheet(sheet)) {
    return sheetSelectionIncludesIndex(selection);
  }

  return selection.some((entry) => selectionMatchesSheet(sheet, entry, templateId));
};

/**
 * Toggle a catalog sheet in a selection list (add canonical name or remove all aliases).
 */
export const toggleSheetInSelection = (selection = [], sheetName, templateId = null) => {
  const current = Array.isArray(selection) ? [...selection] : [];

  if (isSheetInSelection(sheetName, current, templateId)) {
    if (isLoanTierIndexSheet(sheetName)) {
      return current.filter((sheet) => !isLoanTierIndexSheet(sheet));
    }
    return current.filter((entry) => !selectionMatchesSheet(sheetName, entry, templateId));
  }

  if (isLoanTierIndexSheet(sheetName)) {
    const withoutIndexSheets = current.filter((sheet) => !isLoanTierIndexSheet(sheet));
    return [...withoutIndexSheets, sheetName];
  }

  const canonical = resolveSheetAlias(sheetName, templateId);
  return [...current, canonical];
};
