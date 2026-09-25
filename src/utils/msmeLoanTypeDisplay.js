/**
 * MSME loan-type display helpers.
 * Customers may select "Dropline OD"; CS / MSME dashboards show it as Term Loan
 * (same product behaviour, different customer-facing label).
 * Commercial Vehicle uses the same form fields as Term Loan but is never
 * relabelled — dashboards keep "Commercial Vehicle".
 */

export const MSME_LOAN_TYPE_TERM_LOAN = 'Term Loan';
export const MSME_LOAN_TYPE_DROPLINE_OD = 'Dropline OD';
export const MSME_LOAN_TYPE_COMMERCIAL_VEHICLE = 'Commercial Vehicle';

export function isDroplineOdLoanType(loanType) {
  return String(loanType || '').trim().toLowerCase() === 'dropline od';
}

export function isCommercialVehicleLoanType(loanType) {
  return String(loanType || '').trim().toLowerCase() === 'commercial vehicle';
}

/** Same operational behaviour as Term Loan (assets / DPR prep, not WC-only). */
export function isTermLoanLikeLoanType(loanType) {
  const value = String(loanType || '').trim();
  if (!value) return false;
  if (isDroplineOdLoanType(value)) return true;
  if (isCommercialVehicleLoanType(value)) return true;
  return value === MSME_LOAN_TYPE_TERM_LOAN;
}

/** Label shown on CS screens and MSME dashboards. */
export function displayMsmeLoanType(loanType) {
  if (isDroplineOdLoanType(loanType)) return MSME_LOAN_TYPE_TERM_LOAN;
  return loanType || '—';
}
