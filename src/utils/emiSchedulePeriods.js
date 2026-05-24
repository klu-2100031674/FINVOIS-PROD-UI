const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Default loan start: 1 April of current calendar year (Indian FY convention). */
export function defaultLoanStartDate() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}

export function parseLoanStartDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function formatMonthShort(date) {
  return `${MONTH_SHORT[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
}

/** Indian financial year label (Apr–Mar), e.g. 2026-27 */
export function getIndianFinancialYear(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
}

function monthsPerPeriod(periodsPerYear) {
  return Math.max(1, Math.round(12 / Math.max(1, periodsPerYear)));
}

/** Start/end dates for installment `period` (1-based) from loan start. */
export function getPeriodDateRange(loanStartDate, period, periodsPerYear) {
  const startBase = parseLoanStartDate(loanStartDate);
  if (!startBase || period < 1) return { start: null, end: null };

  const step = monthsPerPeriod(periodsPerYear);
  const start = new Date(startBase.getFullYear(), startBase.getMonth(), startBase.getDate());
  start.setMonth(start.getMonth() + (period - 1) * step);

  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  end.setMonth(end.getMonth() + step);
  end.setDate(end.getDate() - 1);

  return { start, end };
}

export function formatPeriodRangeLabel(loanStartDate, period, periodsPerYear) {
  const { start, end } = getPeriodDateRange(loanStartDate, period, periodsPerYear);
  if (!start || !end) return `Period ${period}`;
  const from = formatMonthShort(start);
  const to = formatMonthShort(end);
  if (from === to) return from;
  return `${from} to ${to}`;
}

export function getPeriodColumnTitle(interestFrequency) {
  const map = {
    monthly: 'Month',
    quarterly: 'Quarter',
    halfyearly: 'Half-Year',
    yearly: 'Month / Quarter / Half-Year',
  };
  return map[interestFrequency] ?? 'Period';
}

/**
 * Attach opening balance, period labels, and financial year to amortization rows.
 */
export function enrichScheduleRows(rows, { principal, loanStartDate, periodsPerYear }) {
  const p = Number(principal) || 0;
  let previousClosing = p;

  return rows.map((row) => {
    const openingBalance = previousClosing;
    const closingBalance = row.balance;
    previousClosing = closingBalance;

    const { end } = getPeriodDateRange(loanStartDate, row.period, periodsPerYear);
    const financialYear = end ? getIndianFinancialYear(end) : '—';
    const periodRange = formatPeriodRangeLabel(loanStartDate, row.period, periodsPerYear);

    return {
      ...row,
      openingBalance,
      closingBalance,
      periodRange,
      financialYear,
      installment: row.emi,
    };
  });
}

/**
 * FY summary: outstanding on 31 March, interest & principal in FY, short-term = principal repaid in FY.
 */
export function buildFinancialYearSummary(enrichedRows) {
  const byFy = new Map();

  enrichedRows.forEach((row) => {
    const fy = row.financialYear;
    if (!fy || fy === '—') return;

    if (!byFy.has(fy)) {
      byFy.set(fy, {
        financialYear: fy,
        interest: 0,
        principalRepaid: 0,
        lastClosing: row.closingBalance,
      });
    }

    const entry = byFy.get(fy);
    entry.interest += row.interest || 0;
    entry.principalRepaid += row.principal || 0;
    entry.lastClosing = row.closingBalance;
  });

  return Array.from(byFy.values())
    .sort((a, b) => a.financialYear.localeCompare(b.financialYear))
    .map((entry) => ({
      financialYear: entry.financialYear,
      outstandingOn31March: Math.round(entry.lastClosing),
      interest: Math.round(entry.interest),
      principalRepaid: Math.round(entry.principalRepaid),
      shortTermLoanOutstanding: Math.round(entry.principalRepaid),
    }));
}

export function getRepaymentInterestPerPeriod(rows) {
  const repayment = rows.filter((r) => r.phase !== 'moratorium');
  if (!repayment.length) return rows[0]?.interest ?? 0;
  return repayment[0].interest;
}

export function getFixedPrincipalPerPeriod(rows, calculationMode, principal, repaymentPeriods) {
  if (calculationMode === 'flat_interest' && repaymentPeriods > 0) {
    return (Number(principal) || 0) / repaymentPeriods;
  }
  const repayment = rows.filter((r) => r.phase !== 'moratorium');
  if (!repayment.length) return 0;
  const totalPrincipal = repayment.reduce((s, r) => s + (r.principal || 0), 0);
  return totalPrincipal / repayment.length;
}
