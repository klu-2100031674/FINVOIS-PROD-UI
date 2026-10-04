/** Loan-type helpers shared by MSME / MEPMA / DPR-request public forms and report autofill. */

import { WC_OD_CC_TEMPLATE_IDS } from './wcOdTypeChart';

export const GOLD_LOAN_TYPE = 'Gold Loan';
export const WC_OD_LOAN_TYPE = 'Working capital or OD Loan';
export const DROPLINE_OD_LOAN_TYPE = 'Dropline OD';
export const TERM_AND_WC_LOAN_TYPE = 'Term Loan and working capital loan';

export function isGoldLoanType(loanType) {
  return String(loanType || '').trim() === GOLD_LOAN_TYPE;
}

/** Working capital or OD Loan only — Dropline OD is treated like Term Loan. */
export function isWorkingCapitalOdLoanType(loanType) {
  return String(loanType || '').trim() === WC_OD_LOAN_TYPE;
}

/** Types that show the working-capital amount / fee / ROI block. */
export function isWorkingCapitalLoanType(loanType) {
  const value = String(loanType || '').trim();
  return value === WC_OD_LOAN_TYPE || value === TERM_AND_WC_LOAN_TYPE;
}

export function hidesOrganisationType(loanType) {
  return isWorkingCapitalOdLoanType(loanType) || isGoldLoanType(loanType);
}

export function hidesSchemeAndRuralUrban(loanType) {
  return isWorkingCapitalOdLoanType(loanType) || isGoldLoanType(loanType);
}

export function partnerFormLabelFromRoute(customRoute, sourceLeadType) {
  const route = String(customRoute || '').trim().toLowerCase();
  if (route === 'msme-dpr' || sourceLeadType === 'msme') return 'MSME';
  if (route === 'mepma-dpr' || sourceLeadType === 'mepma') return 'MEPMA';
  if (route === 'dpr-request' || sourceLeadType === 'dpr_request') return 'DPR Request';
  return '';
}

/** Gold Loan → Gold Loan only. WC/OD → CC1–CC7 only. Other types unchanged. */
export function reportTemplatesForLoanType(templates, loanType) {
  const list = Array.isArray(templates) ? templates : [];
  if (isGoldLoanType(loanType)) {
    return list.filter((item) => String(item?.id || '').toUpperCase() === 'GOLD_LOAN');
  }
  if (isWorkingCapitalOdLoanType(loanType)) {
    const allowed = new Set(WC_OD_CC_TEMPLATE_IDS);
    return list.filter((item) => allowed.has(String(item?.id || '').trim().toLowerCase()));
  }
  return list;
}
