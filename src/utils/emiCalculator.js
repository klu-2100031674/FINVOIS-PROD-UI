/**
 * EMI calculations — reducing-balance formula by compounding frequency.
 * Installment = [P × R × (1+R)^N] / [(1+R)^N − 1], R = rate per period, N = repayment periods.
 */

export const INTEREST_FREQUENCIES = [
  { id: 'monthly', label: 'Monthly', periodsPerYear: 12 },
  { id: 'quarterly', label: 'Quarterly', periodsPerYear: 4 },
  { id: 'halfyearly', label: 'Half-yearly', periodsPerYear: 2 },
  { id: 'yearly', label: 'Yearly', periodsPerYear: 1 },
];

export function getPeriodsPerYear(frequencyId) {
  return INTEREST_FREQUENCIES.find((f) => f.id === frequencyId)?.periodsPerYear ?? 12;
}

export function getFrequencyLabel(frequencyId) {
  return INTEREST_FREQUENCIES.find((f) => f.id === frequencyId)?.label ?? 'Monthly';
}

export function getInstallmentLabel(frequencyId) {
  const map = {
    monthly: 'Monthly installment',
    quarterly: 'Quarterly installment',
    halfyearly: 'Half-yearly installment',
    yearly: 'Yearly installment',
  };
  return map[frequencyId] ?? 'Installment';
}

export function monthsToMoratoriumPeriods(moratoriumMonths, periodsPerYear, totalInstallments) {
  const months = Math.max(0, Math.floor(Number(moratoriumMonths) || 0));
  const ppy = Math.max(1, Number(periodsPerYear) || 12);
  const total = Math.max(0, Math.floor(Number(totalInstallments) || 0));
  const periods = Math.floor((months * ppy) / 12);
  if (total <= 0) return 0;
  return Math.min(periods, Math.max(0, total - 1));
}

function installmentForPeriods(principal, periodRate, periods) {
  const p = Number(principal) || 0;
  const n = Math.max(0, Math.floor(Number(periods) || 0));
  if (p <= 0 || n <= 0) return 0;
  if (periodRate === 0) return p / n;
  const factor = (1 + periodRate) ** n;
  return (p * periodRate * factor) / (factor - 1);
}

/** Inverse of installment formula — max principal for a fixed installment. */
export function principalFromInstallment(
  installment,
  annualRatePercent,
  repaymentPeriods,
  periodsPerYear
) {
  const emi = Number(installment) || 0;
  const n = Math.max(0, Math.floor(Number(repaymentPeriods) || 0));
  const ppy = Math.max(1, Math.floor(Number(periodsPerYear) || 12));
  const rate = Number(annualRatePercent) || 0;

  const r = rate / 100 / ppy;

  if (emi <= 0 || n <= 0) return 0;

  if (r === 0) {
    return emi * n;
  }

  return emi * ((1 - Math.pow(1 + r, -n)) / r);
}

export const CALCULATION_MODES = [
  { id: 'principal_fixed', label: 'Reducing interest rate' },
  { id: 'flat_interest', label: 'Flat interest Rate' },
];

/** Flat-rate total interest: principal × annual rate × tenure (years) / 100. */
export function flatTotalInterest(principal, annualRatePercent, tenureYears) {
  const p = Number(principal) || 0;
  const rate = Number(annualRatePercent) || 0;
  const years = Math.max(0, Number(tenureYears) || 0);
  if (p <= 0 || years <= 0) return 0;
  return p * (rate / 100) * years;
}

export function buildFlatPeriodAmortization({
  principal,
  annualRatePercent,
  tenureYears,
  periodsPerYear,
  moratoriumMonths = 0,
}) {
  const p = Number(principal) || 0;
  const rate = Number(annualRatePercent) || 0;
  const years = Math.max(0, Number(tenureYears) || 0);
  const ppy = Math.max(1, Math.floor(Number(periodsPerYear) || 12));

  const totalInstallments = Math.floor(years * ppy);
  const moratoriumPeriods = monthsToMoratoriumPeriods(
    moratoriumMonths,
    ppy,
    totalInstallments,
  );
  const repaymentPeriods = Math.max(0, totalInstallments - moratoriumPeriods);

  if (p <= 0 || totalInstallments <= 0) return [];

  const totalFlatInterest = flatTotalInterest(p, rate, years);
  const interestPerPeriod =
    totalInstallments > 0 ? totalFlatInterest / totalInstallments : 0;
  const principalPerRepaymentPeriod =
    repaymentPeriods > 0 ? p / repaymentPeriods : 0;

  const rows = [];
  let balance = p;

  for (let period = 1; period <= totalInstallments; period += 1) {
    if (balance <= 0 && period > moratoriumPeriods) break;

    const isMoratorium = period <= moratoriumPeriods;

    if (isMoratorium) {
      rows.push({
        period,
        emi: interestPerPeriod,
        principal: 0,
        interest: interestPerPeriod,
        balance,
        prepayment: 0,
        phase: 'moratorium',
      });
      continue;
    }

    const principalPaid = Math.min(balance, principalPerRepaymentPeriod);
    balance = Math.max(0, balance - principalPaid);
    const payment = principalPaid + interestPerPeriod;

    rows.push({
      period,
      emi: payment,
      principal: principalPaid,
      interest: interestPerPeriod,
      balance,
      prepayment: 0,
      phase: 'repayment',
    });
  }

  return rows;
}

function flatInstallmentAmount(principal, annualRatePercent, tenureYears, ppy, moratoriumMonths) {
  const p = Number(principal) || 0;
  const rate = Number(annualRatePercent) || 0;
  const years = Math.max(0, Number(tenureYears) || 0);
  const totalInstallments = Math.floor(years * ppy);
  const moratoriumPeriods = monthsToMoratoriumPeriods(
    moratoriumMonths,
    ppy,
    totalInstallments,
  );
  const repaymentPeriods = Math.max(0, totalInstallments - moratoriumPeriods);

  if (p <= 0 || totalInstallments <= 0) return 0;

  const totalFlatInterest = flatTotalInterest(p, rate, years);
  const interestPerPeriod = totalFlatInterest / totalInstallments;

  if (repaymentPeriods <= 0) return interestPerPeriod;
  return p / repaymentPeriods + interestPerPeriod;
}

/**
 * Full loan calculation with compounding frequency and moratorium (interest-only periods).
 * Reducing balance or flat interest rate on fixed principal.
 */
export function calculateLoanEmi({
  principal,
  annualRatePercent,
  tenureYears,
  periodsPerYear,
  moratoriumMonths = 0,
  calculationMode = 'principal_fixed',
}) {
  const rate = Number(annualRatePercent) || 0;
  const years = Math.max(0, Number(tenureYears) || 0);
  const ppy = Math.max(1, Math.floor(Number(periodsPerYear) || 12));
  const mode = calculationMode === 'flat_interest' ? 'flat_interest' : 'principal_fixed';

  const totalInstallments = Math.floor(years * ppy);
  const moratoriumPeriods = monthsToMoratoriumPeriods(
    moratoriumMonths,
    ppy,
    totalInstallments,
  );
  const repaymentPeriods = Math.max(0, totalInstallments - moratoriumPeriods);
  const periodRate = rate / ppy / 100;

  const p = Number(principal) || 0;
  let installmentAmount;

  if (mode === 'flat_interest') {
    installmentAmount = flatInstallmentAmount(
      p,
      rate,
      years,
      ppy,
      moratoriumMonths,
    );
  } else {
    installmentAmount = installmentForPeriods(p, periodRate, repaymentPeriods);
  }

  if (p <= 0 || totalInstallments <= 0) {
    return {
      emi: installmentAmount,
      installmentAmount,
      computedPrincipal: p,
      totalInterest: 0,
      totalAmount: p,
      periodsPerYear: ppy,
      totalInstallments,
      moratoriumPeriods,
      repaymentPeriods,
      calculationMode: mode,
    };
  }

  const schedule =
    mode === 'flat_interest'
      ? buildFlatPeriodAmortization({
          principal: p,
          annualRatePercent: rate,
          tenureYears: years,
          periodsPerYear: ppy,
          moratoriumMonths,
        })
      : buildPeriodAmortization({
          principal: p,
          annualRatePercent: rate,
          tenureYears: years,
          periodsPerYear: ppy,
          moratoriumMonths,
          installmentAmount,
        });

  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalAmount = schedule.reduce((s, r) => s + r.emi, 0);

  return {
    emi: installmentAmount,
    installmentAmount,
    computedPrincipal: p,
    totalInterest,
    totalAmount,
    periodsPerYear: ppy,
    totalInstallments,
    moratoriumPeriods,
    repaymentPeriods,
    calculationMode: mode,
  };
}

/** Build amortization schedule for reducing or flat interest mode. */
export function buildLoanAmortization({
  calculationMode = 'principal_fixed',
  principal,
  annualRatePercent,
  tenureYears,
  periodsPerYear,
  moratoriumMonths = 0,
  installmentAmount,
}) {
  if (calculationMode === 'flat_interest') {
    return buildFlatPeriodAmortization({
      principal,
      annualRatePercent,
      tenureYears,
      periodsPerYear,
      moratoriumMonths,
    });
  }
  return buildPeriodAmortization({
    principal,
    annualRatePercent,
    tenureYears,
    periodsPerYear,
    moratoriumMonths,
    installmentAmount,
  });
}

export function buildPeriodAmortization({
  principal,
  annualRatePercent,
  tenureYears,
  periodsPerYear,
  moratoriumMonths = 0,
  installmentAmount,
}) {
  const p = Number(principal) || 0;
  const rate = Number(annualRatePercent) || 0;
  const years = Math.max(0, Number(tenureYears) || 0);
  const ppy = Math.max(1, Math.floor(Number(periodsPerYear) || 12));

  const totalInstallments = Math.floor(years * ppy);
  const moratoriumPeriods = monthsToMoratoriumPeriods(
    moratoriumMonths,
    ppy,
    totalInstallments,
  );
  const repaymentPeriods = Math.max(0, totalInstallments - moratoriumPeriods);
  const periodRate = rate / ppy / 100;

  if (p <= 0 || totalInstallments <= 0) return [];

  const payment =
    installmentAmount != null
      ? Number(installmentAmount) || 0
      : installmentForPeriods(p, periodRate, repaymentPeriods);

  const rows = [];
  let balance = p;

  for (let period = 1; period <= totalInstallments; period += 1) {
    if (balance <= 0) break;

    const interest = periodRate === 0 ? 0 : balance * periodRate;
    const isMoratorium = period <= moratoriumPeriods;

    if (isMoratorium) {
      const moratoriumPayment = interest;
      rows.push({
        period,
        emi: moratoriumPayment,
        principal: 0,
        interest,
        balance,
        prepayment: 0,
        phase: 'moratorium',
      });
      continue;
    }

    const due = Math.min(payment, balance + interest);
    const principalPaid = Math.min(balance, Math.max(0, due - interest));
    balance = Math.max(0, balance - principalPaid);

    rows.push({
      period,
      emi: due,
      principal: principalPaid,
      interest,
      balance,
      prepayment: 0,
      phase: 'repayment',
    });
  }

  return rows;
}

/** @deprecated Use calculateLoanEmi — monthly-only helper kept for tenure comparison */
export function calculateEmi(principal, annualRatePercent, tenureMonths) {
  const months = Math.max(0, Math.floor(Number(tenureMonths) || 0));
  const years = months / 12;
  const result = calculateLoanEmi({
    principal,
    annualRatePercent,
    tenureYears: years,
    periodsPerYear: 12,
    moratoriumMonths: 0,
  });
  return {
    emi: result.emi,
    totalInterest: result.totalInterest,
    totalAmount: result.totalAmount,
  };
}

/** @deprecated Use buildPeriodAmortization */
export function buildMonthlyAmortization(principal, annualRatePercent, tenureMonths, emi) {
  const months = Math.max(0, Math.floor(Number(tenureMonths) || 0));
  return buildPeriodAmortization({
    principal,
    annualRatePercent,
    tenureYears: months / 12,
    periodsPerYear: 12,
    moratoriumMonths: 0,
    installmentAmount: emi,
  });
}

/** @deprecated Prepayment removed from EMI calculator UI */
export function buildMonthlyAmortizationWithPrepayment(
  principal,
  annualRatePercent,
  tenureMonths,
  emi,
  { yearlyPrepayment = 0 } = {},
) {
  const p = Number(principal) || 0;
  const maxMonths = Math.max(0, Math.floor(Number(tenureMonths) || 0));
  const monthlyRate = (Number(annualRatePercent) || 0) / 12 / 100;
  const yearlyExtra = Math.max(0, Number(yearlyPrepayment) || 0);

  if (p <= 0 || maxMonths <= 0) return { rows: [], monthsSaved: 0, interestSaved: 0 };

  const baseline = buildMonthlyAmortization(p, annualRatePercent, maxMonths, emi);
  const baselineInterest = baseline.reduce((s, r) => s + r.interest, 0);

  const rows = [];
  let balance = p;
  let month = 0;

  while (balance > 0.5 && month < maxMonths * 2) {
    month += 1;
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    const payment = Math.min(emi, balance + interest);
    let principalPaid = Math.min(balance, Math.max(0, payment - interest));
    balance = Math.max(0, balance - principalPaid);

    let prepayment = 0;
    if (yearlyExtra > 0 && month % 12 === 0 && balance > 0) {
      prepayment = Math.min(balance, yearlyExtra);
      balance = Math.max(0, balance - prepayment);
    }

    rows.push({
      period: month,
      emi: payment,
      principal: principalPaid,
      interest,
      balance,
      prepayment,
    });

    if (balance <= 0.5) break;
  }

  const actualInterest = rows.reduce((s, r) => s + r.interest, 0);
  const monthsSaved = Math.max(0, maxMonths - rows.length);

  return {
    rows,
    monthsSaved,
    interestSaved: Math.max(0, baselineInterest - actualInterest),
    actualTenureMonths: rows.length,
  };
}

/** @deprecated Schedule is built at interest frequency only */
export function buildYearlyAmortization(monthlyRows) {
  if (!monthlyRows.length) return [];

  const yearly = [];
  for (let i = 0; i < monthlyRows.length; i += 12) {
    const chunk = monthlyRows.slice(i, i + 12);
    const year = Math.floor(i / 12) + 1;
    yearly.push({
      period: year,
      emi: chunk.reduce((s, r) => s + r.emi, 0),
      principal: chunk.reduce((s, r) => s + r.principal, 0),
      interest: chunk.reduce((s, r) => s + r.interest, 0),
      prepayment: chunk.reduce((s, r) => s + (r.prepayment || 0), 0),
      balance: chunk[chunk.length - 1]?.balance ?? 0,
    });
  }

  return yearly;
}

export function getEmiInsights(loanAmount, totalInterest, totalAmount, emi) {
  const principal = Number(loanAmount) || 0;
  const interest = Number(totalInterest) || 0;
  const total = Number(totalAmount) || 0;
  const interestShare = total > 0 ? (interest / total) * 100 : 0;
  const principalShare = total > 0 ? (principal / total) * 100 : 0;
  const interestToPrincipalRatio = principal > 0 ? interest / principal : 0;

  return {
    interestShare,
    principalShare,
    interestToPrincipalRatio,
    emiToPrincipalRatio: principal > 0 ? emi / principal : 0,
  };
}

export function getAffordabilityStatus(emi, monthlyIncome) {
  const income = Number(monthlyIncome) || 0;
  if (income <= 0) return { ratio: null, status: 'unknown', label: 'Enter income to check' };

  const ratio = (emi / income) * 100;
  if (ratio <= 35) {
    return { ratio, status: 'good', label: 'Comfortable — lenders often prefer under 40%' };
  }
  if (ratio <= 50) {
    return { ratio, status: 'moderate', label: 'Moderate — consider a longer tenure or smaller loan' };
  }
  return { ratio, status: 'high', label: 'High — may affect loan approval; reduce EMI if possible' };
}

export function compareTenureScenario(principal, annualRatePercent, currentYears, reduceYears) {
  const newYears = Math.max(1, currentYears - reduceYears);
  if (newYears >= currentYears) return null;

  const current = calculateEmi(principal, annualRatePercent, currentYears * 12);
  const shorter = calculateEmi(principal, annualRatePercent, newYears * 12);

  return {
    newYears,
    currentEmi: current.emi,
    newEmi: shorter.emi,
    emiIncrease: Math.max(0, shorter.emi - current.emi),
    interestSaved: Math.max(0, current.totalInterest - shorter.totalInterest),
  };
}

export function formatInr(value, { decimals = 0 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatInrCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return formatInr(n);
}

export function parseInrInput(raw) {
  const cleaned = String(raw ?? '').replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export const LOAN_PRESETS = [
  { id: 'home', label: 'Home Loan', amount: 5000000, rate: 8.5, years: 20 },
  { id: 'car', label: 'Car Loan', amount: 800000, rate: 9.5, years: 5 },
  { id: 'personal', label: 'Personal Loan', amount: 500000, rate: 12.5, years: 3 },
  { id: 'education', label: 'Education Loan', amount: 1500000, rate: 9.0, years: 7 },
];

export const QUICK_AMOUNTS = [
  { label: '₹5L', value: 500000 },
  { label: '₹10L', value: 1000000 },
  { label: '₹25L', value: 2500000 },
  { label: '₹50L', value: 5000000 },
  { label: '₹1Cr', value: 10000000 },
];

/** API payload for EMI calculator master-data submission (no undefined numeric keys). */
export function buildEmiSubmissionPayload({
  name,
  phone,
  principalAmount,
  interestRate,
  tenureYears,
  interestFrequency,
  moratoriumMonths,
  calculationMode,
  emi,
  totalInterest,
  totalAmount,
  totalInstallments,
}) {
  const payload = {
    name: String(name || '').trim(),
    phone: String(phone || '').trim(),
  };

  const addNum = (key, value) => {
    const n = Number(value);
    if (Number.isFinite(n)) payload[key] = n;
  };

  addNum('principalAmount', principalAmount);
  addNum('interestRate', interestRate);
  addNum('tenureYears', tenureYears);
  addNum('moratoriumMonths', moratoriumMonths);
  addNum('emi', emi);
  addNum('totalInterest', totalInterest);
  addNum('totalAmount', totalAmount);
  addNum('totalInstallments', totalInstallments);

  if (interestFrequency) payload.interestFrequency = String(interestFrequency);
  if (calculationMode) payload.calculationMode = String(calculationMode);

  return payload;
}
