/**
 * msmeDprToReportMapper.js
 *
 * Maps a submitted MSME DPR lead object → the `initialData` shape expected by
 * each report-form component (FRCC1–7 and TERM_LOAN_* families).
 *
 * The mapper always returns a **complete** default structure so the form's
 * `useState(initialData || { ...defaults })` does not end up with undefined
 * sections that would crash field-access expressions like
 * `formData["Means of Finance"]["i13"]`.
 */

import { FRCC_REQUIRED_STAMP_DEFAULT } from './frccFormUi';
import {
  isGoldLoanType,
  isWorkingCapitalOdLoanType,
} from './partnerLeadLoanTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapMsmeSectorToFrcc(sector) {
  const s = String(sector || '').toLowerCase();
  if (s.includes('manufactur')) return 'Manufacturing sector';
  if (s.includes('trad')) return 'Trading sector';
  if (s.includes('vehicle')) return '';
  if (s.includes('service')) return 'Service sector (with stock)';
  return '';
}

function mapMsmeSectorToTermLoan(sector) {
  const s = String(sector || '').toLowerCase();
  if (s.includes('manufactur')) return 'Manufacturing sector';
  if (s.includes('trad')) return 'Trading sector';
  if (s.includes('service') || s.includes('vehicle')) return 'service sector without stock';
  return '';
}
function buildAddress(lead) {
  return [lead.villageCity, lead.mandal, lead.district]
    .filter(Boolean)
    .join(', ');
}

function parseAmount(value) {
  const n = parseFloat(String(value || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Forms require exactly 10 digits. Lead phones often include +91. */
function last10Digits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  return digits.slice(-10);
}

function aadhaarDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 ? digits : '';
}

function normalizePan(value) {
  return String(value || '').trim().toUpperCase();
}

function parsePercent(value) {
  const n = parseFloat(String(value || '').replace(/,/g, '').replace(/%/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Term Loan Schedule for Assets / Cost of Project use ₹ Lakhs. MSME form stores ₹. */
function rupeesToLakhs(rupees) {
  if (!rupees) return 0;
  return Math.round((rupees / 100000) * 10000) / 10000;
}

/** Convert an MSME amount (rupees string/number) to lakhs for report Cost of Project fields. */
function msmeAmountToLakhs(value) {
  return rupeesToLakhs(parseAmount(value));
}

function parseTenureYears(value) {
  const match = String(value || '').match(/\d+/);
  if (!match) return 0;
  const years = parseInt(match[0], 10);
  if (!Number.isFinite(years) || years < 1 || years > 15) return 0;
  return years;
}

/** MSME lead categories → Term Loan without-stock Schedule for Assets (tenure ≤ 7). */
const TERM_LOAN_ASSET_SECTIONS = {
  'Plant and Machinery': { start: 122, end: 131, loanCell: 'k28' },
  'Service Equipment': { start: 132, end: 141, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 142, end: 151, loanCell: 'k30' },
  Land: { start: 152, end: 154, loanCell: 'k31' },
  'Electrical Items & plumbing items': { start: 155, end: 164, loanCell: 'k32' },
  'Electronic Items': { start: 165, end: 174, loanCell: 'k33' },
  'Furniture and Fittings': { start: 175, end: 184, loanCell: 'k34' },
  Vehicles: { start: 185, end: 194, loanCell: 'k35' },
  'Live stock': { start: 195, end: 203, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 204, end: 213, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 214, end: 223, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 224, end: 233, loanCell: 'k39' },
};

/** Same categories shifted for tenure > 7 (matches FRTermLoanForm without-stock). */
const TERM_LOAN_ASSET_SECTIONS_GT7 = {
  'Plant and Machinery': { start: 134, end: 143, loanCell: 'k28' },
  'Service Equipment': { start: 144, end: 153, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 154, end: 163, loanCell: 'k30' },
  Land: { start: 164, end: 166, loanCell: 'k31' },
  'Electrical Items & plumbing items': { start: 167, end: 176, loanCell: 'k32' },
  'Electronic Items': { start: 177, end: 186, loanCell: 'k33' },
  'Furniture and Fittings': { start: 187, end: 196, loanCell: 'k34' },
  Vehicles: { start: 197, end: 206, loanCell: 'k35' },
  'Live stock': { start: 207, end: 215, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 216, end: 225, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 226, end: 235, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 236, end: 245, loanCell: 'k39' },
};

/** TERM_LOAN_CC asset rows (matches FRTermLoanCCForm). */
const TERM_LOAN_CC_ASSET_SECTIONS = {
  'Plant and Machinery': { start: 136, end: 145, loanCell: 'k28' },
  'Service Equipment': { start: 146, end: 155, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 156, end: 158, loanCell: 'k30' },
  Land: { start: 159, end: 168, loanCell: 'k31' },
  'Electrical Items & plumbing items': { start: 169, end: 178, loanCell: 'k32' },
  'Electronic Items': { start: 179, end: 188, loanCell: 'k33' },
  'Furniture and Fittings': { start: 189, end: 198, loanCell: 'k34' },
  Vehicles: { start: 199, end: 207, loanCell: 'k35' },
  'Live stock': { start: 208, end: 217, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 218, end: 227, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 228, end: 236, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 237, end: 245, loanCell: 'k39' },
};

const TERM_LOAN_CC_ASSET_SECTIONS_GT7 = {
  'Plant and Machinery': { start: 148, end: 157, loanCell: 'k28' },
  'Service Equipment': { start: 158, end: 167, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 168, end: 177, loanCell: 'k30' },
  Land: { start: 178, end: 180, loanCell: 'k31' },
  'Electrical Items & plumbing items': { start: 181, end: 190, loanCell: 'k32' },
  'Electronic Items': { start: 191, end: 200, loanCell: 'k33' },
  'Furniture and Fittings': { start: 201, end: 210, loanCell: 'k34' },
  Vehicles: { start: 211, end: 219, loanCell: 'k35' },
  'Live stock': { start: 220, end: 229, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 230, end: 239, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 240, end: 248, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 249, end: 257, loanCell: 'k39' },
};

/** With-stock asset rows (matches FRTermLoanWithStockForm). */
const TERM_LOAN_WITH_STOCK_ASSET_SECTIONS = {
  'Plant and Machinery': { start: 136, end: 145, loanCell: 'k28' },
  'Service Equipment': { start: 146, end: 155, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 156, end: 165, loanCell: 'k30' },
  Land: { start: 166, end: 168, loanCell: 'k31' },
  'Electrical Items & plumbing items': { start: 169, end: 177, loanCell: 'k32' },
  'Electronic Items': { start: 178, end: 187, loanCell: 'k33' },
  'Furniture and Fittings': { start: 188, end: 197, loanCell: 'k34' },
  Vehicles: { start: 198, end: 207, loanCell: 'k35' },
  'Live stock': { start: 208, end: 216, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 217, end: 226, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 227, end: 236, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 237, end: 246, loanCell: 'k39' },
};

const TERM_LOAN_WITH_STOCK_ASSET_SECTIONS_GT7 = {
  'Plant and Machinery': { start: 153, end: 162, loanCell: 'k28' },
  'Service Equipment': { start: 163, end: 172, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 173, end: 182, loanCell: 'k30' },
  Land: { start: 183, end: 185, loanCell: 'k31' },
  'Electrical Items & plumbing items': { start: 186, end: 194, loanCell: 'k32' },
  'Electronic Items': { start: 195, end: 204, loanCell: 'k33' },
  'Furniture and Fittings': { start: 205, end: 214, loanCell: 'k34' },
  Vehicles: { start: 215, end: 224, loanCell: 'k35' },
  'Live stock': { start: 225, end: 233, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 234, end: 243, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 244, end: 253, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 254, end: 263, loanCell: 'k39' },
};

function isTermLoanCcTemplate(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  return k.includes('term_loan_cc') || k.includes('term loan cc') || k === 'term_loan_cc';
}

function isTermLoanWithStockTemplate(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  return (
    k.includes('with_stock') ||
    k.includes('with stock') ||
    k.includes('manufacturing_service_with_stock')
  );
}

function isVehicleTemplate(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  return (
    k.includes('vehicle') ||
    k.includes('jcb') ||
    k.includes('tractor') ||
    k.includes('tipper') ||
    k.includes('drone')
  );
}

function isEvVehicleTemplate(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  return k.includes('ev_vehicle') || k.includes('ev vehicle');
}

function getTermLoanAssetSections(tenureYears, templateKey) {
  const gt7 = tenureYears > 7;
  if (isTermLoanCcTemplate(templateKey)) {
    return gt7 ? TERM_LOAN_CC_ASSET_SECTIONS_GT7 : TERM_LOAN_CC_ASSET_SECTIONS;
  }
  if (isTermLoanWithStockTemplate(templateKey)) {
    return gt7 ? TERM_LOAN_WITH_STOCK_ASSET_SECTIONS_GT7 : TERM_LOAN_WITH_STOCK_ASSET_SECTIONS;
  }
  if (isEvVehicleTemplate(templateKey) || isVehicleTemplate(templateKey)) {
    return {
      'Commercial Vehicles': { start: 185, end: 194, loanCell: 'k35' },
      'Commercial Vehicle': { start: 185, end: 194, loanCell: 'k35' },
      Vehicles: { start: 185, end: 194, loanCell: 'k35' },
    };
  }
  return gt7 ? TERM_LOAN_ASSET_SECTIONS_GT7 : TERM_LOAN_ASSET_SECTIONS;
}

/** MSME lead categories → FRCC Fixed Assets Schedule category titles */
const FRCC_ASSET_CATEGORY_MAP = {
  'Plant and Machinery': 'Plant and Machinery',
  'Service Equipment': 'Service Equipment',
  'Shed Construction and Civil works': 'Shed, Construction and Civil works',
  Land: 'Land',
  'Electrical Items & plumbing items': 'Electrical and Plumbing Items',
  'Electronic Items': 'Electronic Items',
  'Furniture and Fittings': 'Furniture and Fittings',
  Vehicles: 'Vehicles',
  'Live stock': 'Live stock',
  'Other Assets (Nil Depreciation)': 'Other Assets (Nil Depreciation)',
  'Other Assets (Including Amortisable Assets)': 'Other Assets (Including Amortisable Assets)',
  // Non Current Assets are included for FRCC as well (Fixed Assets Schedule)
  'Non Current Assets (Deposits , Advances etc)': 'Non Current Assets (Deposits and Advances)',
};

/** FRCC2 uses slightly different category labels than FRCC1/3–7. */
const FRCC_ASSET_CATEGORY_ALIASES = {
  'Shed, Construction and Civil works': ['Shed Construction and Civil works'],
  'Electronic Items': ['Electronic items'],
};

function displayScheme(value) {
  return value === 'CMEGP' ? 'CMEP' : value;
}

/**
 * Normalise the MSME template key to one of our two families:
 *  - 'frcc'      → frcc1 … frcc7
 *  - 'term_loan' → any TERM_LOAN_* variant
 *  - null        → unknown (no pre-fill)
 */
function resolveFamily(templateKey) {
  if (!templateKey) return null;
  const k = String(templateKey).toLowerCase().trim();
  if (k === 'gold_loan') return 'gold_loan';
  if (/^frcc[1-7]$/.test(k) || /^format\s*cc[1-7]$/i.test(k) || /^cc[1-7]$/.test(k)) {
    return 'frcc';
  }
  if (k.includes('term_loan') || k.includes('term loan')) {
    return 'term_loan';
  }
  return null;
}

function resolveProcessingFee(lead) {
  const fee = String(lead?.processingFee || '').trim();
  if (fee) return fee;
  if (isWorkingCapitalOdLoanType(lead?.loanType)) {
    return String(lead?.workingCapitalMargin || '').trim();
  }
  return '';
}

function applyReferredByBankToPreparedBy(data, lead, labels) {
  if (!data['Prepared By']) data['Prepared By'] = {};
  const pb = data['Prepared By'];
  let filled = false;
  if (lead.referredByBankName) {
    pb.bank_name = lead.referredByBankName;
    filled = true;
  }
  if (lead.referredByBranchName) {
    pb.branch_name = lead.referredByBranchName;
    filled = true;
  }
  if (lead.referredByBankMobile) {
    pb.banker_mobile = lead.referredByBankMobile;
    filled = true;
  }
  if (lead.referredByBankEmail) {
    pb.banker_mail_id = lead.referredByBankEmail;
    filled = true;
  }
  if (filled) labels.push('Prepared By (Referred by Bank)');
}

function getLeadAssets(lead) {
  return Array.isArray(lead?.dprAssets)
    ? lead.dprAssets.filter(
        (a) => a && (String(a.assetModel || '').trim() || parseAmount(a.amount) > 0)
      )
    : [];
}

/**
 * Build Term Loan Schedule for Assets + loan % / Cost of Project summary
 * from MSME dprAssets. All money values are converted ₹ → Lakhs.
 */
function mapAssetsToTermLoanSections(lead, labels, tenureYears = 0, templateKey = '') {
  const assets = getLeadAssets(lead);
  const sectionMap = getTermLoanAssetSections(tenureYears, templateKey);
  if (!assets.length) {
    return {
      scheduleForAssets: {},
      assetLoanPercentages: {},
      assetLoanAmounts: {},
      costOfProject: {},
      fixedAssetsSchedule: null,
    };
  }

  const byCategory = {};
  assets.forEach((asset) => {
    let category = String(asset.assetCategory || '').trim();
    if (!category) return;
    if (!sectionMap[category]) {
      if (['Vehicles', 'Commercial Vehicles', 'Commercial Vehicle'].includes(category)) {
        const matchingKey = Object.keys(sectionMap).find((k) =>
          ['Commercial Vehicles', 'Commercial Vehicle', 'Vehicles'].includes(k)
        );
        if (matchingKey) category = matchingKey;
      }
    }
    if (!category || !sectionMap[category]) return;
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(asset);
  });

  const scheduleForAssets = {};
  const assetLoanPercentages = {};
  const assetLoanAmounts = {};
  const costOfProject = {};
  const fixedAssetsSchedule = {};
  let filledCount = 0;

  Object.entries(byCategory).forEach(([category, items]) => {
    const section = sectionMap[category];
    const maxRows = section.end - section.start + 1;
    const limited = items.slice(0, maxRows);
    let categoryTotalLakhs = 0;
    let weightedPctSum = 0;
    let weightedBase = 0;
    const categoryRows = {};

    limited.forEach((asset, idx) => {
      const row = section.start + idx;
      const desc = String(asset.assetModel || '').trim() || `${category} item ${idx + 1}`;
      const amountRupees = parseAmount(asset.amount);
      const amountLakhs = rupeesToLakhs(amountRupees);
      const pct = parsePercent(asset.loanPercentage);

      scheduleForAssets[`d${row}`] = desc;
      scheduleForAssets[`e${row}`] = amountLakhs;
      // TERM_LOAN_CC Fixed Assets Schedule uses row-keyed { description, amount } in Lakhs.
      categoryRows[row] = { description: desc, amount: amountLakhs };
      categoryTotalLakhs += amountLakhs;
      if (amountRupees > 0 && pct > 0) {
        weightedPctSum += pct * amountRupees;
        weightedBase += amountRupees;
      }
      filledCount += 1;
    });

    const avgPct =
      weightedBase > 0
        ? Math.round((weightedPctSum / weightedBase) * 100) / 100
        : parsePercent(limited[0]?.loanPercentage);
    assetLoanPercentages[category] = avgPct;
    const loanAmtLakhs =
      avgPct > 0 ? Math.round(((categoryTotalLakhs * avgPct) / 100) * 10000) / 10000 : 0;
    const loanAmtStr = loanAmtLakhs ? String(loanAmtLakhs) : '';
    assetLoanAmounts[category] = loanAmtStr;

    // Provide vehicle aliases so any form variant (Vehicles / Commercial Vehicles / Commercial Vehicle) finds its data
    if (category === 'Vehicles' || category === 'Commercial Vehicles' || category === 'Commercial Vehicle') {
      ['Vehicles', 'Commercial Vehicles', 'Commercial Vehicle'].forEach((alias) => {
        assetLoanPercentages[alias] = avgPct;
        assetLoanAmounts[alias] = loanAmtStr;
        fixedAssetsSchedule[alias] = categoryRows;
      });
    }

    // Cost of Project loan percentage cells (K28-K39) expect the loan percentage (e.g. 75 or 0), NOT the amount in Lakhs!
    if (section.loanCell && avgPct !== undefined && avgPct !== null) {
      costOfProject[section.loanCell] = avgPct;
    }

    fixedAssetsSchedule[category] = categoryRows;
  });

  if (filledCount > 0) {
    labels.push('Schedule for Assets', 'Cost of Project / Asset Loan %');
  }

  return {
    scheduleForAssets,
    assetLoanPercentages,
    assetLoanAmounts,
    costOfProject,
    fixedAssetsSchedule: filledCount > 0 ? fixedAssetsSchedule : null,
  };
}

function mapAssetsToFrccFixedSchedule(lead, labels) {
  const assets = getLeadAssets(lead);
  if (!assets.length) return null;

  const schedule = {
    'Plant and Machinery': { items: [], total: 0 },
    'Service Equipment': { items: [], total: 0 },
    'Shed, Construction and Civil works': { items: [], total: 0 },
    Land: { items: [], total: 0 },
    'Electrical and Plumbing Items': { items: [], total: 0 },
    'Electronic Items': { items: [], total: 0 },
    'Furniture and Fittings': { items: [], total: 0 },
    Vehicles: { items: [], total: 0 },
    'Live stock': { items: [], total: 0 },
    'Other Assets (Including Amortisable Assets)': { items: [], total: 0 },
    'Other Assets (Nil Depreciation)': { items: [], total: 0 },
    'Non Current Assets (Deposits and Advances)': { items: [], total: 0 },
  };

  let filled = 0;
  assets.forEach((asset) => {
    const mapped = FRCC_ASSET_CATEGORY_MAP[String(asset.assetCategory || '').trim()];
    if (!mapped || !schedule[mapped]) return;
    const amount = parseAmount(asset.amount);
    const description = String(asset.assetModel || '').trim() || mapped;
    schedule[mapped].items.push({ description, amount, loanPct: parsePercent(asset.loanPercentage) });
    schedule[mapped].total += amount;
    filled += 1;
  });

  Object.entries(FRCC_ASSET_CATEGORY_ALIASES).forEach(([canonical, aliases]) => {
    aliases.forEach((alias) => {
      if (schedule[canonical] && !schedule[alias]) {
        schedule[alias] = {
          items: [...schedule[canonical].items],
          total: schedule[canonical].total,
        };
      }
    });
  });

  if (filled > 0) labels.push('Fixed Assets Schedule');
  return filled > 0 ? schedule : null;
}

// ---------------------------------------------------------------------------
// FRCC family (frcc1 – frcc7)
// ---------------------------------------------------------------------------

function resolveFrccFixedMeansOfFinance(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  if (k === 'frcc1' || k === 'format cc1' || k === 'cc1' || k === 'gold_loan') {
    return { i12: 'No' };
  }
  if (k === 'frcc2' || k === 'format cc2' || k === 'cc2') {
    return { i11: 'No' };
  }
  if (k === 'frcc3' || k === 'format cc3' || k === 'cc3') {
    return { i12: 'No' };
  }
  if (k === 'frcc4' || k === 'format cc4' || k === 'cc4') {
    return { i11: 'Yes', i12: 'No' };
  }
  if (k === 'frcc5' || k === 'format cc5' || k === 'cc5') {
    return { i11: 'Yes', i12: 'Yes' };
  }
  if (k === 'frcc6' || k === 'format cc6' || k === 'cc6') {
    return { i11: 'Yes', i12: 'No', h17: 'Yes' };
  }
  if (k === 'frcc7' || k === 'format cc7' || k === 'cc7') {
    return { i11: 'Yes', i12: 'Yes', i18: 'Yes' };
  }
  return { i11: 'Yes', i12: 'No' };
}

function resolveFrccGeneralInfoCells(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  if (
    k === 'frcc1' ||
    k === 'format cc1' ||
    k === 'cc1' ||
    k === 'frcc3' ||
    k === 'format cc3' ||
    k === 'cc3' ||
    k === 'gold_loan'
  ) {
    return { firm: 'i4', status: 'i5', authPerson: 'i6', address: 'i7', phone: 'i8', sector: 'i9', nature: 'i10' };
  }
  if (k === 'frcc6' || k === 'format cc6' || k === 'cc6') {
    return { firm: 'i3', status: 'i4', authPerson: 'i5', address: 'i6', sector: 'i7', nature: 'i8', phone: 'i9' };
  }
  // frcc2, frcc4, frcc5, frcc7
  return { firm: 'i3', status: 'i4', authPerson: 'i5', address: 'i6', phone: 'i7', sector: 'i8', nature: 'i9' };
}

function buildFrccDefaultStructure(templateKey = '') {
  const k = String(templateKey || '').toLowerCase().trim();
  const fixedMeans = resolveFrccFixedMeansOfFinance(templateKey);
  const giCells = resolveFrccGeneralInfoCells(templateKey);
  const giDefault = {};
  Object.values(giCells).forEach((cell) => {
    if (cell) giDefault[cell] = '';
  });

  const isCc6Or7 = k === 'frcc6' || k === 'format cc6' || k === 'cc6' || k === 'frcc7' || k === 'format cc7' || k === 'cc7';
  if (isCc6Or7) {
    const isCc7 = k === 'frcc7' || k === 'format cc7' || k === 'cc7';
    return {
      'General Information': giDefault,
      'Means of Finance': {
        ...fixedMeans,
        ...(isCc7
          ? { i13: '', i14: '', h15: '', h16: '', h17: '' }
          : { i13: '', h14: '', h15: '', h16: '' }),
      },
      'Financial Years': {},
      'Financial Statements': {},
      'New Asset Schedule': {
        'Plant and Machinery':                         { items: [], total: 0, loanPct: 0 },
        'Service Equipment':                           { items: [], total: 0, loanPct: 0 },
        'Shed, Construction and Civil Works':          { items: [], total: 0, loanPct: 0 },
        'Land':                                        { items: [], total: 0, loanPct: 0 },
        'Electrical and Plumbing Items':               { items: [], total: 0, loanPct: 0 },
        'Electronic Items':                            { items: [], total: 0, loanPct: 0 },
        'Furniture and Fittings':                      { items: [], total: 0, loanPct: 0 },
        'Vehicles':                                    { items: [], total: 0, loanPct: 0 },
        'Live Stock':                                  { items: [], total: 0, loanPct: 0 },
        'Other Assets (Including Amortisable Assets)': { items: [], total: 0, loanPct: 0 },
        'Other Assets (Nil Depreciation)':             { items: [], total: 0, loanPct: 0 },
      },
      'Gross Assets Opening Balance': {
        'Plant and Machinery':                         { items: [], total: 0 },
        'Service Equipment':                           { items: [], total: 0 },
        'Shed, Construction and Civil Works':          { items: [], total: 0 },
        'Land':                                        { items: [], total: 0 },
        'Electrical and Plumbing Items':               { items: [], total: 0 },
        'Electronic Items':                            { items: [], total: 0 },
        'Furniture and Fittings':                      { items: [], total: 0 },
        'Vehicles':                                    { items: [], total: 0 },
        'Live Stock':                                  { items: [], total: 0 },
        'Other Assets (Including Amortisable Assets)': { items: [], total: 0 },
        'Other Assets (Nil Depreciation)':             { items: [], total: 0 },
      },
      'Term Loan Finance Details': {},
      'Prepared By': {
        bank_name: '',
        branch_name: '',
        banker_mobile: '',
        banker_mail_id: '',
        cibil_score: '',
        ...(isCc7
          ? { i159: 'PARVEZ AND NARAYANA', i160: 'Chartered Accountants', i161: 'Vijayawada', i162: '9014221011' }
          : { i158: 'PARVEZ AND NARAYANA', i159: 'Chartered Accountants', i160: 'Vijayawada', i161: '9014221011' }),
        required_stamp: FRCC_REQUIRED_STAMP_DEFAULT,
      },
    };
  }

  return {
    'General Information': giDefault,
    'Means of Finance': {
      ...fixedMeans,
      i13: '', h14: '', h15: '', h16: '',
    },
    'Financial Years': {
      i18: '', i19: '', i20: '', i21: '', i22: '',
    },
    'Indirect Expenses': {
      i24: '', H25: '', i26: '', h27: '', h28: '', i29: '', i30: '',
    },
    'Fixed Assets Schedule': {
      'Plant and Machinery':                          { items: [], total: 0 },
      'Service Equipment':                            { items: [], total: 0 },
      'Shed, Construction and Civil works':           { items: [], total: 0 },
      'Land':                                         { items: [], total: 0 },
      'Electrical and Plumbing Items':                { items: [], total: 0 },
      'Electronic Items':                             { items: [], total: 0 },
      'Furniture and Fittings':                       { items: [], total: 0 },
      'Vehicles':                                     { items: [], total: 0 },
      'Live stock':                                   { items: [], total: 0 },
      'Other Assets (Including Amortisable Assets)':  { items: [], total: 0 },
      'Other Assets (Nil Depreciation)':              { items: [], total: 0 },
      'Non Current Assets (Deposits and Advances)':   { items: [], total: 0 },
    },
    'Prepared By': {
      bank_name: '',
      branch_name: '',
      banker_mobile: '',
      banker_mail_id: '',
      j94: 'PARVEZ AND NARAYANA',
      j95: 'Chartered Accountants',
      j96: 'Vijayawada',
      j97: '9014221011',
      required_stamp: FRCC_REQUIRED_STAMP_DEFAULT,
    },
  };
}

/**
 * FRCC Means of Finance cell layout differs by template:
 *  - frcc1/3/4/6/gold: i13 amount, h14 ROI, h15 processing, h16 %turnover
 *  - frcc2:             i12 amount, h13 ROI, h14 processing, h15 %turnover
 *  - frcc5/7:           i14 amount (required top-up requirement), h15 ROI, h16 processing
 *
 * MSME `workingCapital` is a ₹ amount (requirement), NOT "% of turnover".
 * Prefer workingCapital → loan-requirement cell; never put ₹ into the % cell.
 *
 * FRCC5/6/7 also have a separate "Term Loan Finance Details" section for
 * tenure / moratorium / term-loan ROI / processing.
 */
function resolveFrccMeansOfFinanceCells(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  if (k === 'frcc2' || k === 'format cc2' || k === 'cc2') {
    return { amount: 'i12', roi: 'h13', processing: 'h14', turnoverPct: 'h15' };
  }
  if (k === 'frcc5' || k === 'format cc5' || k === 'cc5') {
    return { amount: 'i14', roi: 'h15', processing: 'h16', turnoverPct: null };
  }
  if (k === 'frcc7' || k === 'format cc7' || k === 'cc7') {
    return { amount: 'i14', roi: 'h15', processing: 'h16', turnoverPct: null };
  }
  // frcc1, frcc3, frcc4, frcc6, gold_loan (and unknown FRCC)
  return { amount: 'i13', roi: 'h14', processing: 'h15', turnoverPct: null };
}

/** Optional Term Loan Finance Details cells for FRCC6 / FRCC7. */
function resolveFrccTermLoanFinanceCells(templateKey) {
  const k = String(templateKey || '').toLowerCase().trim();
  if (k === 'frcc6' || k === 'format cc6' || k === 'cc6') {
    return { roi: 'h73', tenure: 'i74' };
  }
  if (k === 'frcc7' || k === 'format cc7' || k === 'cc7') {
    return { roi: 'h74', tenure: 'i75', moratorium: 'i77', processing: 'h78' };
  }
  return null;
}

function mapMsmeLeadToFrccInitialData(lead, templateKey) {
  const data = buildFrccDefaultStructure(templateKey);
  const labels = [];
  const cells = resolveFrccMeansOfFinanceCells(templateKey);
  const termCells = resolveFrccTermLoanFinanceCells(templateKey);
  const gi = resolveFrccGeneralInfoCells(templateKey);

  const address = buildAddress(lead);
  const firmName = lead.enterpriseName || lead.applicantName;

  if (firmName && gi.firm) {
    data['General Information'][gi.firm] = firmName;
    labels.push('Name of Firm');
  }
  if (lead.applicantName && gi.authPerson) {
    data['General Information'][gi.authPerson] = lead.applicantName;
    labels.push('Name of Authorised Person');
  }
  if (address && gi.address) {
    data['General Information'][gi.address] = address;
    labels.push('Business Address');
  }
  const phone10 = last10Digits(lead.mobileNumber);
  if (phone10 && gi.phone) {
    data['General Information'][gi.phone] = phone10;
    labels.push('Contact No.');
  }
  if (lead.natureOfBusiness && gi.nature) {
    data['General Information'][gi.nature] = lead.natureOfBusiness;
    labels.push('Nature of Business');
  }
  const frccSector = mapMsmeSectorToFrcc(lead.sector);
  if (frccSector && gi.sector) {
    data['General Information'][gi.sector] = frccSector;
    labels.push('Sector');
  }

  // Working capital requirement (₹) takes priority; fall back to total loanAmount.
  const wcOrLoan = lead.workingCapital || lead.loanAmount;
  if (wcOrLoan && cells.amount) {
    data['Means of Finance'][cells.amount] = wcOrLoan;
    labels.push('Working Capital / Loan Requirement');
  }
  if (lead.rateOfInterest && cells.roi) {
    data['Means of Finance'][cells.roi] = lead.rateOfInterest;
    labels.push('Rate of Interest');
  }
  const processingFeeValue = resolveProcessingFee(lead);
  if (processingFeeValue && cells.processing) {
    data['Means of Finance'][cells.processing] = processingFeeValue;
    labels.push('Processing Fee');
  }

  // Term Loan Finance Details (FRCC6 / FRCC7) — tenure, moratorium, term ROI/fee
  if (termCells) {
    const term = {};
    if (lead.rateOfInterest && termCells.roi) {
      term[termCells.roi] = lead.rateOfInterest;
    }
    const tenure = parseTenureYears(lead.loanTermPeriod);
    if (tenure && termCells.tenure) {
      term[termCells.tenure] = tenure;
      labels.push('Loan Term Period');
    }
    if (lead.moratoriumPeriod && termCells.moratorium) {
      term[termCells.moratorium] = lead.moratoriumPeriod;
      labels.push('Moratorium Period');
    }
    if (processingFeeValue && termCells.processing) {
      term[termCells.processing] = processingFeeValue;
    }
    if (Object.keys(term).length > 0) {
      data['Term Loan Finance Details'] = term;
      labels.push('Term Loan Finance Details');
    }
  }

  const fixedSchedule = mapAssetsToFrccFixedSchedule(lead, labels);
  if (fixedSchedule) {
    data['Fixed Assets Schedule'] = fixedSchedule;
    const k = String(templateKey || '').toLowerCase().trim();
    if (k === 'frcc6' || k === 'format cc6' || k === 'cc6' || k === 'frcc7' || k === 'format cc7' || k === 'cc7') {
      data['New Asset Schedule'] = fixedSchedule;
    }
  }

  applyReferredByBankToPreparedBy(data, lead, labels);

  return { initialData: data, autoFilledLabels: labels };
}

// ---------------------------------------------------------------------------
// Term Loan family
// ---------------------------------------------------------------------------

function buildTermLoanDefaultStructure() {
  return {
    'General Information': {},
    'Expected Employment Generation': {},
    'Term Loan Details': {},
    'Prepared By': {
      j136: 'PARVEZ AND NARAYANA',
      j137: 'Chartered Accountants',
      j138: 'Vijayawada',
      j139: '9014221011',
      required_stamp: FRCC_REQUIRED_STAMP_DEFAULT,
      banker_mail_id: '',
      banker_mobile: '',
      cibil_score: '',
      bank_name: '',
      branch_name: '',
    },
    'Indirect Expenses Increment': {
      i56: '', h64: '', h65: '', h66: '', h67: '', h68: '',
    },
    'Cost of Project': {},
    'Schedule for Assets': {},
    'Schedule for Indirect Expenses': {
      'Administrative & Office Expenses': {},
      'Employee Related Expenses': {},
      'Selling and Distribution Expenses': {},
      'General Overheads': {},
      'Miscellaneous Expenses': {},
    },
  };
}

function mapMsmeLeadToTermLoanInitialData(lead, templateKey) {
  const data = buildTermLoanDefaultStructure();
  const labels = [];
  const gi = {};
  const isCc = isTermLoanCcTemplate(templateKey);

  const address = buildAddress(lead);

  if (lead.applicantName) {
    gi.i8  = lead.applicantName;
    gi.i17 = lead.applicantName;
    labels.push('Name of Authorised Person', 'Name of Firm');
  }
  const phone10 = last10Digits(lead.mobileNumber);
  if (phone10) {
    gi.i9 = phone10;
    labels.push('Mobile Number');
  }
  const aadhaar = aadhaarDigits(lead.aadharNumber);
  if (aadhaar) {
    gi.i10 = aadhaar;
    labels.push('Aadhaar Number');
  }
  const pan = normalizePan(lead.panNumber);
  if (pan) {
    gi.i11 = pan;
    labels.push('PAN Number');
  }
  if (lead.gender) {
    gi.i13 = lead.gender;
    labels.push('Gender');
  }
  const tlSector = mapMsmeSectorToTermLoan(lead.sector);
  if (tlSector) {
    gi.i14 = tlSector;
    labels.push('Sector');
  }
  if (lead.natureOfBusiness) {
    gi.i15 = lead.natureOfBusiness;
    labels.push('Nature of Business');
  }
  if (address) {
    gi.i16 = address;
    labels.push('Business Address');
  }
  const scheme = displayScheme(lead.schemeAppliedUnder);
  if (scheme) {
    gi.i20 = scheme;
    labels.push('Scheme');
  }
  if (lead.ruralUrbanCategory) {
    gi.i22 = lead.ruralUrbanCategory;
    labels.push('Rural/Urban Category');
  }

  if (Object.keys(gi).length > 0) {
    data['General Information'] = gi;
  }

  const tenure = parseTenureYears(lead.loanTermPeriod);

  if (isCc) {
    // TERM_LOAN_CC uses section "Means of Finance details" (not "Term Loan Details")
    // and "Cost of Project details" for working capital requirement (in lakhs).
    const means = {};
    if (lead.rateOfInterest) {
      means.h45 = lead.rateOfInterest;
      labels.push('Rate of Interest');
    }
    if (lead.workingCapitalRateOfInterest) {
      means.h52 = lead.workingCapitalRateOfInterest;
      labels.push('Working capital Loan Rate of Interest');
    }
    if (tenure) {
      means.i47 = tenure;
      labels.push('Loan Term Period');
    }
    if (lead.moratoriumPeriod) {
      means.i49 = lead.moratoriumPeriod;
      labels.push('Moratorium Period');
    }
    const processingFeeValue = resolveProcessingFee(lead);
    if (processingFeeValue) {
      means.h53 = processingFeeValue;
      labels.push('Processing Fee');
    }
    if (Object.keys(means).length > 0) {
      data['Means of Finance details'] = means;
    }

    // MSME workingCapital is entered in ₹; Cost of Project field is Lakhs only.
    const costDetails = { ...(data['Cost of Project details'] || {}) };
    const wcLakhs = msmeAmountToLakhs(lead.workingCapital);
    if (wcLakhs > 0) {
      costDetails.i40 = wcLakhs;
      labels.push('Working Capital Requirement (Lac)');
    }
    if (Object.keys(costDetails).length > 0) {
      data['Cost of Project details'] = costDetails;
    }
  } else {
    // Standard Term Loan / Vehicle / With-Stock forms → "Term Loan Details"
    // UI title shown to CS is "Means of Finance details".
    const termLoan = {};
    if (lead.rateOfInterest) {
      termLoan.h44 = lead.rateOfInterest;
      labels.push('Rate of Interest');
    }
    if (tenure) {
      termLoan.i46 = tenure;
      labels.push('Loan Term Period');
    }
    if (lead.moratoriumPeriod) {
      termLoan.i48 = lead.moratoriumPeriod;
      labels.push('Moratorium Period');
    }
    const processingFeeValue = resolveProcessingFee(lead);
    if (processingFeeValue) {
      termLoan.h49 = processingFeeValue;
      labels.push('Processing Fee');
    }
    if (Object.keys(termLoan).length > 0) {
      data['Term Loan Details'] = termLoan;
    }
  }

  const {
    scheduleForAssets,
    assetLoanPercentages,
    assetLoanAmounts,
    costOfProject,
    fixedAssetsSchedule,
  } = mapAssetsToTermLoanSections(lead, labels, tenure, templateKey);

  if (Object.keys(scheduleForAssets).length > 0) {
    data['Schedule for Assets'] = scheduleForAssets;
    // Cost of Project loan contribution cells are always in Lakhs.
    data['Cost of Project'] = costOfProject;
    data['Asset Loan Percentages'] = assetLoanPercentages;
    data['Asset Loan Amounts'] = assetLoanAmounts;
  }

  // TERM_LOAN_CC reads Fixed Assets Schedule (amounts must be Lakhs, category keys = form names).
  // Do not reuse FRCC schedule (rupees + different category labels).
  if (isCc && fixedAssetsSchedule) {
    data['Fixed Assets Schedule'] = fixedAssetsSchedule;
  }

  applyReferredByBankToPreparedBy(data, lead, labels);

  return { initialData: data, autoFilledLabels: labels };
}

function mapMsmeLeadToGoldLoanInitialData(lead) {
  const data = buildFrccDefaultStructure('gold_loan');
  const labels = [];
  const cells = resolveFrccMeansOfFinanceCells('gold_loan');

  if (lead.loanAmount && cells.amount) {
    data['Means of Finance'][cells.amount] = lead.loanAmount;
    labels.push('Loan Amount');
  }
  if (lead.rateOfInterest && cells.roi) {
    data['Means of Finance'][cells.roi] = lead.rateOfInterest;
    labels.push('Rate of Interest');
  }
  const processingFeeValue = resolveProcessingFee(lead);
  if (processingFeeValue && cells.processing) {
    data['Means of Finance'][cells.processing] = processingFeeValue;
    labels.push('Processing Fee');
  }
  if (lead.applicantName) {
    data['General Information'].i4 = lead.applicantName;
    data['General Information'].i6 = lead.applicantName;
    labels.push('Name of Firm', 'Name of Authorised Person');
  }
  const phone10 = last10Digits(lead.mobileNumber);
  if (phone10) {
    data['General Information'].i8 = phone10;
    labels.push('Contact No.');
  }

  applyReferredByBankToPreparedBy(data, lead, labels);

  return { initialData: data, autoFilledLabels: labels };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Map an MSME DPR lead object to report form `initialData`.
 *
 * @param {object} lead        - The MSME DPR lead document from the API.
 * @param {string} templateKey - The normalised template key (e.g. 'frcc1', 'TERM_LOAN_CC').
 * @returns {{ initialData: object, autoFilledLabels: string[] }}
 */
export function mapMsmeLeadToReportInitialData(lead, templateKey) {
  if (!lead) return null;

  const family = resolveFamily(templateKey);
  if (!family) return null;

  if (family === 'gold_loan') {
    return mapMsmeLeadToGoldLoanInitialData(lead);
  }

  if (family === 'frcc') {
    return mapMsmeLeadToFrccInitialData(lead, templateKey);
  }
  if (family === 'term_loan') {
    return mapMsmeLeadToTermLoanInitialData(lead, templateKey);
  }

  return null;
}
