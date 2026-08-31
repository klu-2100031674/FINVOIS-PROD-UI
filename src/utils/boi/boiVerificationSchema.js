/**
 * BOI verification schema — ported from Loan-Verifier-Pro verification-store.ts
 */

export const MODULE_KEYS = [
  'general',
  'residence',
  'employment',
  'pan',
  'salary',
  'documents',
  'business',
  'property',
  'evidence',
  'feedback',
];

export const DEFAULT_BANK_NAME = 'Bank of India';

export const REPORT_DEFAULTS = {
  udinNumber: '26222863',
  caName: 'PARVEZ MOHAMMED',
};

export const FINAL_FEEDBACK_ITEMS = [
  { key: 'personalDetails', label: 'Personal Details' },
  { key: 'residenceVerification', label: 'Residence Verification' },
  { key: 'telephoneVerification', label: 'Telephone Verification' },
  { key: 'incomeProof', label: 'Income Proof' },
  { key: 'itReturn', label: 'IT Return' },
  { key: 'employerOffice', label: 'Employer Office' },
  { key: 'placeOfBusiness', label: 'Place of Business' },
  { key: 'bankDetails', label: 'Bank Details' },
  { key: 'otherDetails', label: 'Other Details' },
];

export const PROPERTY_LOAN_TYPES = ['Home Loan', 'Mortgage Loan'];

export const NON_EMPLOYED_CATEGORIES = ['housewife', 'retired', 'unemployed', 'student'];

export const BUSINESS_CATEGORIES = ['business_owner', 'self_employed'];

export const MODULE_META = {
  general: { label: 'General Details' },
  residence: { label: 'Residence Verification' },
  employment: { label: 'Employment Verification' },
  pan: { label: 'PAN Verification' },
  salary: { label: 'Salary / Form-16 Verification' },
  documents: { label: 'Documents Verification' },
  business: { label: 'Business Activity Verification' },
  property: { label: 'Property Details Verification' },
  evidence: { label: 'Evidence Upload' },
  feedback: { label: 'Final Feedback' },
};

export const CASE_STATUS_META = {
  draft: { label: 'Draft', className: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted For Approval', className: 'bg-indigo-100 text-indigo-700' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-700' },
};

export function isPropertyLoanType(loanType) {
  return !!loanType && PROPERTY_LOAN_TYPES.includes(loanType);
}

export function labelApplicants(applicants) {
  let co = 0;
  return (applicants ?? []).map((a) => {
    if (!a.isPrimary) co += 1;
    return { ...a, label: a.isPrimary ? 'Applicant' : `Co-Applicant ${co}` };
  });
}

export function isModuleApplicable(modules, key, loanType) {
  if (key === 'property') {
    return isPropertyLoanType(loanType);
  }
  if (!modules) return true;

  const cat = modules.employment?.employment?.employmentCategory ?? '';
  const employmentNA = NON_EMPLOYED_CATEGORIES.includes(cat);

  if (key === 'employment') return !employmentNA;
  if (key === 'salary') {
    if (employmentNA) return false;
    if (cat === 'business_owner' || cat === 'self_employed') return false;
    return true;
  }
  if (key === 'business') return BUSINESS_CATEGORIES.includes(cat);
  // Salary-slip document tallies — salaried only (not business / non-employed)
  if (key === 'documents') {
    if (employmentNA) return false;
    if (cat === 'business_owner' || cat === 'self_employed') return false;
    return true;
  }
  return true;
}

export function isModuleVisible() {
  return true;
}

export function applicableModuleKeys(modules, loanType) {
  return MODULE_KEYS.filter((k) => isModuleApplicable(modules, k, loanType));
}

export function workflowModuleKeys(modules, loanType) {
  const cat = modules?.employment?.employment?.employmentCategory ?? '';
  const employmentNA = NON_EMPLOYED_CATEGORIES.includes(cat);
  return MODULE_KEYS.filter((k) => {
    if (['general', 'residence', 'employment', 'pan', 'evidence', 'feedback'].includes(k)) {
      return true;
    }
    if (k === 'salary') {
      return !employmentNA && cat !== 'business_owner' && cat !== 'self_employed';
    }
    if (k === 'documents') {
      return !employmentNA && cat !== 'business_owner' && cat !== 'self_employed';
    }
    if (k === 'business') return BUSINESS_CATEGORIES.includes(cat);
    if (k === 'property') return isPropertyLoanType(loanType);
    return true;
  });
}

export function nextModuleKey(modules, current, loanType) {
  const seq = workflowModuleKeys(modules, loanType);
  const i = seq.indexOf(current);
  if (i >= 0 && i < seq.length - 1) return seq[i + 1];
  return null;
}

export function isCaseLocked(status) {
  return status === 'submitted' || status === 'approved';
}

export function emptyModules() {
  return MODULE_KEYS.reduce((acc, k) => {
    acc[k] = { status: 'not_started' };
    return acc;
  }, {});
}

export function generateCaseId(existingCases = {}) {
  const year = new Date().getFullYear();
  const prefix = `VER-${year}-`;
  const nums = Object.keys(existingCases)
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export function deriveCaseStatus(caseObj) {
  if (['submitted', 'approved', 'rejected'].includes(caseObj.status)) {
    return caseObj.status;
  }
  const anyActive = caseObj.applicants.some((a) =>
    MODULE_KEYS.some((k) => {
      const st = caseObj.modules[a.id]?.[k]?.status;
      return st === 'in_progress' || st === 'completed';
    })
  );
  return anyActive ? 'in_progress' : 'draft';
}

export function emptyBoiCase(existingCases = {}, overrides = {}) {
  const id = overrides.id ?? generateCaseId(existingCases);
  const primaryId = 'primary';
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    loanType: '',
    bankName: DEFAULT_BANK_NAME,
    branchName: '',
    loanAmount: '',
    createdAt: new Date().toISOString(),
    status: 'draft',
    applicants: [{ id: primaryId, isPrimary: true }],
    activeApplicantId: primaryId,
    modules: {
      [primaryId]: {
        ...emptyModules(),
        general: {
          status: 'not_started',
          general: {
            udinNumber: REPORT_DEFAULTS.udinNumber,
            caName: REPORT_DEFAULTS.caName,
            dateOfVerification: today,
            dateOfReportSubmission: today,
          },
        },
      },
    },
    ...overrides,
  };
}

/** @returns {string[]} validation error messages — prefer validateBoiHousingCase from boiValidation.js */
export function validateBoiCaseForGenerate(caseData) {
  const errors = [];
  if (!caseData) return ['No case data'];
  if (!caseData.loanType) errors.push('Loan type is required');
  if (!String(caseData.branchName || '').trim()) errors.push('Branch name is required');
  if (!caseData.loanAmount || Number(caseData.loanAmount) <= 0) {
    errors.push('Loan amount must be greater than 0');
  }

  const labeled = labelApplicants(caseData.applicants);
  for (const applicant of labeled) {
    const mods = caseData.modules?.[applicant.id];
    const applicable = applicableModuleKeys(mods, caseData.loanType);
    for (const key of applicable) {
      const status = mods?.[key]?.status;
      if (status !== 'completed') {
        errors.push(`${applicant.label}: ${MODULE_META[key]?.label ?? key} is not completed`);
      }
    }
  }
  return errors;
}

export function nextModuleRoute(modules, current, loanType) {
  const next = nextModuleKey(modules, current, loanType);
  return next ? `/executive/boi/templates/boi/${next}` : '/executive/boi/templates/boi/report';
}
