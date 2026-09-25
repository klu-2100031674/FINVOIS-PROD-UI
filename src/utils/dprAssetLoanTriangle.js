/** Amount, Loan %, and Loan Amount stay in sync: amount × (loan% / 100) = loanAmount. */

export function parseAssetMoney(value) {
  const n = parseFloat(String(value || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatLoanAmount(n) {
  if (!Number.isFinite(n) || n < 0) return '';
  return String(Math.round(n));
}

function formatLoanPercent(n) {
  if (!Number.isFinite(n) || n < 0) return '';
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

export function calculateAssetLoan(asset) {
  const stored = parseAssetMoney(asset?.loanAmount);
  if (stored > 0) return stored;
  const amt = parseAssetMoney(asset?.amount);
  const pct = parseAssetMoney(asset?.loanPercentage);
  if (amt > 0 && pct > 0) return (amt * pct) / 100;
  return 0;
}

export function applyAssetTriangle(asset, field, rawValue) {
  const next = { ...asset, [field]: rawValue };
  const amount = parseAssetMoney(next.amount);
  const pctStr = String(next.loanPercentage ?? '').trim();
  const loanStr = String(next.loanAmount ?? '').trim();
  const pct = parseAssetMoney(next.loanPercentage);
  const loanAmt = parseAssetMoney(next.loanAmount);

  if (field === 'amount') {
    if (amount > 0 && pctStr !== '') {
      next.loanAmount = formatLoanAmount((amount * pct) / 100);
    } else if (amount > 0 && loanStr !== '') {
      next.loanPercentage = formatLoanPercent((loanAmt / amount) * 100);
    }
  } else if (field === 'loanPercentage') {
    if (amount > 0 && pctStr !== '') {
      next.loanAmount = formatLoanAmount((amount * pct) / 100);
    }
  } else if (field === 'loanAmount') {
    if (amount > 0 && loanStr !== '') {
      next.loanPercentage = formatLoanPercent((loanAmt / amount) * 100);
    }
  }

  return next;
}

export function isAssetNumericField(field) {
  return field === 'amount' || field === 'loanPercentage' || field === 'loanAmount';
}
