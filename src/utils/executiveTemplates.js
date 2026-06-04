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
    path: '/executive/templates/sbi-house',
    bank: 'SBI',
    category: 'Home'
  },
  {
    id: 'sbi-office',
    code: 'SBI_Office',
    name: 'SBI Office',
    description: 'Office verification due diligence report for SBI.',
    path: '/executive/templates/sbi-office',
    bank: 'SBI',
    category: 'Office'
  },
  {
    id: 'sbi-bussiness',
    code: 'SBI_Bussiness',
    name: 'SBI Business',
    description: 'Business verification due diligence report for SBI.',
    path: '/executive/templates/sbi-bussiness',
    bank: 'SBI',
    category: 'Business'
  },
  {
    id: 'income-tax',
    code: 'SBI_IncomeTax',
    name: 'Income Tax (ITR)',
    description: 'ITR acknowledgement confirmation letter with return details table.',
    path: '/executive/templates/income-tax',
    bank: 'SBI',
    category: 'Tax'
  }
];

export function getExecutiveTemplateByPath(pathname) {
  return EXECUTIVE_TEMPLATES.find((t) => t.path === pathname) || null;
}
