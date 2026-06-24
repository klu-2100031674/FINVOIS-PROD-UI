const TERM_LOAN_TEMPLATE_IDS = new Set([
  'TERM_LOAN_SERVICE_WITHOUT_STOCK',
  'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK',
  'TERM_LOAN_CC',
]);

/** Default locked sector per template when URL / draft metadata is missing. */
export const TEMPLATE_SECTOR_DEFAULTS = {
  TERM_LOAN_SERVICE_WITHOUT_STOCK: {
    presetSector: 'service sector without stock',
    lockSector: true,
  },
  TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK: {
    presetSector: 'service sector with stock',
    lockSector: true,
  },
  TERM_LOAN_CC: {
    presetSector: 'service sector without stock',
    lockSector: true,
  },
};

export function isTermLoanTemplateId(templateId) {
  return TERM_LOAN_TEMPLATE_IDS.has(String(templateId || '').trim());
}

function parseTruthyLock(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/**
 * Resolve preset sector + lock flag from URL params, draft blob, or template defaults.
 */
export function resolveTemplateSector(templateId, options = {}) {
  const {
    urlPresetSector = null,
    urlLockSector = null,
    draftPresetSector = null,
    draftLockSector = null,
    savedFormSector = null,
  } = options;

  const defaults = TEMPLATE_SECTOR_DEFAULTS[templateId] || null;
  const presetSector =
    urlPresetSector ||
    draftPresetSector ||
    savedFormSector ||
    defaults?.presetSector ||
    null;

  // If lock is explicitly provided in URL or draft, use it. Otherwise fall back to defaults.
  let lockSector = false;
  if (urlLockSector !== null && urlLockSector !== undefined && urlLockSector !== '') {
    lockSector = parseTruthyLock(urlLockSector);
  } else if (draftLockSector !== null && draftLockSector !== undefined) {
    lockSector = parseTruthyLock(draftLockSector);
  } else {
    lockSector = (isTermLoanTemplateId(templateId) && Boolean(presetSector)) ||
                 Boolean(defaults?.lockSector && presetSector);
  }

  return { presetSector, lockSector };
}
