const TERM_LOAN_TEMPLATE_IDS = new Set([
  'TERM_LOAN_SERVICE_WITHOUT_STOCK',
  'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK',
  'TERM_LOAN_CC',
  'TERM_LOAN_EV_VEHICLE',
  'TERM_LOAN_OTHER_THAN_EV_VEHICLE',
  'TERM_LOAN_JCB_VEHICLE',
  'TERM_LOAN_DRONE_VEHICLE',
]);

/** Vehicle term-loan templates — analytics modal shows IRR only. */
export const VEHICLE_TEMPLATE_IDS = new Set([
  'TERM_LOAN_EV_VEHICLE',
  'TERM_LOAN_OTHER_THAN_EV_VEHICLE',
  'TERM_LOAN_JCB_VEHICLE',
  'TERM_LOAN_DRONE_VEHICLE',
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
  TERM_LOAN_EV_VEHICLE: {
    presetSector: 'service sector without stock',
    lockSector: true,
  },
  TERM_LOAN_OTHER_THAN_EV_VEHICLE: {
    presetSector: 'service sector without stock',
    lockSector: true,
  },
  TERM_LOAN_JCB_VEHICLE: {
    presetSector: 'service sector without stock',
    lockSector: true,
  },
  TERM_LOAN_DRONE_VEHICLE: {
    presetSector: 'service sector without stock',
    lockSector: true,
  },
};

/** Canonical Excel sector values that Assumptions!I14 accepts for term-loan / vehicle sheets. */
export const CANONICAL_EXCEL_SECTORS = new Set([
  'service sector without stock',
  'service sector with stock',
  'manufacturing sector',
  'trading sector',
]);

export function isCanonicalExcelSector(value) {
  return CANONICAL_EXCEL_SECTORS.has(String(value || '').trim().toLowerCase());
}

export function isTermLoanTemplateId(templateId) {
  return TERM_LOAN_TEMPLATE_IDS.has(String(templateId || '').trim());
}

export function isVehicleTemplateId(templateId) {
  return VEHICLE_TEMPLATE_IDS.has(String(templateId || '').trim());
}

/** Friendly labels for Generated Reports / filters (old + vehicle templates). */
export const TEMPLATE_DISPLAY_NAMES = {
  TERM_LOAN_SERVICE_WITHOUT_STOCK: 'Term Loan (Service, Without Stock)',
  TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK: 'Term Loan (Manufacturing / Service With Stock)',
  TERM_LOAN_CC: 'Term Loan + CC',
  TERM_LOAN_EV_VEHICLE: 'EV Commercial Vehicle',
  TERM_LOAN_OTHER_THAN_EV_VEHICLE: 'Other Than EV Commercial Vehicle',
  TERM_LOAN_JCB_VEHICLE: 'JCB Vehicle',
  TERM_LOAN_DRONE_VEHICLE: 'Drone Vehicle',
  CC1: 'Cash Credit Form 1',
  CC2: 'Cash Credit Form 2',
  CC3: 'Cash Credit Form 3',
  CC4: 'Cash Credit Form 4',
  CC5: 'Cash Credit Form 5',
  CC6: 'Cash Credit Form 6',
  CC7: 'Cash Credit Form 7',
};

export function getTemplateDisplayName(templateIdOrType) {
  const raw = String(templateIdOrType || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (TEMPLATE_DISPLAY_NAMES[upper]) return TEMPLATE_DISPLAY_NAMES[upper];
  const ccMatch = upper.match(/CC(\d+)/);
  if (ccMatch && TEMPLATE_DISPLAY_NAMES[`CC${ccMatch[1]}`]) {
    return TEMPLATE_DISPLAY_NAMES[`CC${ccMatch[1]}`];
  }
  const known = Object.keys(TEMPLATE_DISPLAY_NAMES).find((key) => upper.startsWith(key));
  if (known) return TEMPLATE_DISPLAY_NAMES[known];
  return raw;
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

  const tid = String(templateId || '').trim();
  const defaults = TEMPLATE_SECTOR_DEFAULTS[tid] || null;

  // Vehicle templates always use the locked Excel sector. Ignore URL labels like
  // "Commercial Vehicle - EV" / "JCB Vehicle" that were historically passed by AIAssistant.
  if (isVehicleTemplateId(tid) && defaults?.presetSector) {
    return {
      presetSector: defaults.presetSector,
      lockSector: true,
    };
  }

  const candidates = [urlPresetSector, draftPresetSector, savedFormSector, defaults?.presetSector];
  let presetSector = null;
  for (const candidate of candidates) {
    if (!candidate) continue;
    // Prefer canonical Excel sectors; skip marketing labels that break Assumptions!I14.
    if (defaults?.presetSector && !isCanonicalExcelSector(candidate)) continue;
    presetSector = String(candidate).trim();
    break;
  }
  if (!presetSector && defaults?.presetSector) {
    presetSector = defaults.presetSector;
  }

  // If lock is explicitly provided in URL or draft, use it. Otherwise fall back to defaults.
  let lockSector = false;
  if (urlLockSector !== null && urlLockSector !== undefined && urlLockSector !== '') {
    lockSector = parseTruthyLock(urlLockSector);
  } else if (draftLockSector !== null && draftLockSector !== undefined) {
    lockSector = parseTruthyLock(draftLockSector);
  } else {
    lockSector = (isTermLoanTemplateId(tid) && Boolean(presetSector)) ||
                 Boolean(defaults?.lockSector && presetSector);
  }

  return { presetSector, lockSector };
}
