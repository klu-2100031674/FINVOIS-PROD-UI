/**
 * Executive field-verification templates (UI registry).
 * `code` matches API/Python templateCode (e.g. SBI_House).
 */
export const EXECUTIVE_TEMPLATES = [
  {
    id: 'sbi-house',
    code: 'SBI_House',
    name: 'SBI House',
    description: 'Residence verification due diligence report for SBI.',
    path: '/executive/sbi/templates/sbi-house',
    bank: 'SBI',
    category: 'Home'
  },
  {
    id: 'sbi-office',
    code: 'SBI_Office',
    name: 'SBI Office',
    description: 'Office verification due diligence report for SBI.',
    path: '/executive/sbi/templates/sbi-office',
    bank: 'SBI',
    category: 'Office'
  },
  {
    id: 'sbi-bussiness',
    code: 'SBI_Bussiness',
    name: 'SBI Business',
    description: 'Business verification due diligence report for SBI.',
    path: '/executive/sbi/templates/sbi-bussiness',
    bank: 'SBI',
    category: 'Business'
  },
  {
    id: 'income-tax',
    code: 'SBI_IncomeTax',
    name: 'Income Tax (ITR)',
    description: 'ITR acknowledgement confirmation letter with return details table.',
    path: '/executive/sbi/templates/income-tax',
    bank: 'SBI',
    category: 'Tax'
  },
  {
    id: 'boi',
    code: 'BOI',
    name: 'BOI',
    description: 'Bank of India due diligence verification with multi-module workspace and PDF report.',
    path: '/executive/boi/templates/boi',
    bank: 'BOI',
    category: 'Due Diligence'
  },
  {
    id: 'boi-housing',
    code: 'BOI_Housing',
    name: 'BOI Housing',
    description: 'Due diligence verification report for Bank of India (BOI) Housing Loan.',
    path: '/executive/boi/templates/boi-housing',
    bank: 'BOI',
    category: 'Housing'
  },
  {
    id: 'boi-msme',
    code: 'BOI_MSME',
    name: 'BOI MSME',
    description: 'Due Diligence Report for MSME Proposals (Bank of India executive profile).',
    path: '/executive/boi/templates/boi-msme',
    bank: 'BOI',
    category: 'MSME'
  },
  {
    id: 'boi-home-loan-1',
    code: 'BOI_HomeLoan1',
    name: 'BOI HOME LOAN-1',
    description: 'Due Diligence Audit Report for Home Loan / LAP (1 applicant).',
    path: '/executive/boi/templates/boi-home-loan-1',
    bank: 'BOI',
    category: 'Home Loan'
  },
  {
    id: 'boi-home-loan-2',
    code: 'BOI_HomeLoan2',
    name: 'BOI HOME LOAN-2',
    description: 'Due Diligence Audit Report for Home Loan / LAP (2 applicants).',
    path: '/executive/boi/templates/boi-home-loan-2',
    bank: 'BOI',
    category: 'Home Loan'
  },
  {
    id: 'boi-home-loan-3',
    code: 'BOI_HomeLoan3',
    name: 'BOI HOME LOAN-3',
    description: 'Due Diligence Audit Report for Home Loan / LAP (3 applicants).',
    path: '/executive/boi/templates/boi-home-loan-3',
    bank: 'BOI',
    category: 'Home Loan'
  },
  {
    id: 'boi-home-loan-3-guarantor',
    code: 'BOI_HomeLoan3_Guarantor',
    name: 'BOI HOME LOAN-3 with Guarantor',
    description: 'Due Diligence Audit Report for Home Loan / LAP (2 applicants + 1 Guarantor).',
    path: '/executive/boi/templates/boi-home-loan-3-guarantor',
    bank: 'BOI',
    category: 'Home Loan'
  },
  {
    id: 'boi-home-loan-4',
    code: 'BOI_HomeLoan4',
    name: 'BOI HOME LOAN-4',
    description: 'Due Diligence Audit Report for Home Loan / LAP (4 applicants).',
    path: '/executive/boi/templates/boi-home-loan-4',
    bank: 'BOI',
    category: 'Home Loan'
  }
];

export function getExecutiveTemplateByPath(pathname) {
  return EXECUTIVE_TEMPLATES.find((t) => t.path === pathname) || null;
}

/** Templates visible for sbi_executive / boi_executive (legacy executive → SBI). */
export function getTemplatesForExecutiveRole(role) {
  const r = String(role || '').trim().toLowerCase();
  const normalized = r === 'executive' ? 'sbi_executive' : r;
  if (normalized === 'boi_executive') {
    return EXECUTIVE_TEMPLATES.filter(
      (t) => t.bank === 'BOI' || /^BOI/i.test(t.code || '')
    );
  }
  if (normalized === 'sbi_executive') {
    return EXECUTIVE_TEMPLATES.filter((t) => t.bank === 'SBI');
  }
  return [];
}

export function getBankForExecutiveRole(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'boi_executive') return 'BOI';
  if (r === 'sbi_executive' || r === 'executive') return 'SBI';
  return null;
}
