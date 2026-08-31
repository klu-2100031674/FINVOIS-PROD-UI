/**
 * Production validation for BOI Housing due-diligence cases.
 * Used by UI submit and (mirrored) API generate.
 */

import {
  BUSINESS_CATEGORIES,
  MODULE_META,
  NON_EMPLOYED_CATEGORIES,
  PROPERTY_LOAN_TYPES,
  applicableModuleKeys,
  isPropertyLoanType,
  labelApplicants,
} from './boiVerificationSchema';

export const MAX_APPLICANTS = 3;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const AADHAAR_REGEX = /^[2-9][0-9]{11}$/;
export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;
export const PIN_REGEX = /^[1-9][0-9]{5}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,99}$/;
export const MAX_LOAN_AMOUNT = 50000000; // ₹5 Cr scheme ceiling in report header

export function mapEmploymentCategoryToType(category) {
  const c = String(category || '').toLowerCase();
  if (c === 'salaried') return 'salaried';
  if (c === 'business_owner' || c === 'self_employed') return 'business';
  if (NON_EMPLOYED_CATEGORIES.includes(c)) return c || 'other';
  return c || '';
}

export function isEmployedCategory(category) {
  const c = String(category || '').toLowerCase();
  return c === 'salaried' || c === 'business' || c === 'business_owner' || c === 'self_employed';
}

export function isSalaryCategory(category) {
  const c = String(category || '').toLowerCase();
  return c === 'salaried';
}

export function isBusinessCategory(category) {
  const c = String(category || '').toLowerCase();
  return c === 'business' || c === 'business_owner' || c === 'self_employed';
}

function trim(v) {
  return String(v ?? '').trim();
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function hasText(v, min = 1) {
  return trim(v).length >= min;
}

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ageYears(dob, asOf) {
  const birth = parseDate(dob);
  const ref = parseDate(asOf) || new Date();
  if (!birth) return null;
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age -= 1;
  return age;
}

function getMod(caseData, appId, moduleKey, sectionKey) {
  return caseData?.modules?.[appId]?.[moduleKey]?.[sectionKey] || {};
}

function getCat(caseData, appId) {
  return getMod(caseData, appId, 'employment', 'employment').employmentCategory || '';
}

export function validatePan(pan, label = 'PAN') {
  const p = trim(pan).toUpperCase();
  if (!p) return `${label} is required`;
  return null;
}

export function validateAadhaar(aadhaar, label = 'Aadhaar') {
  const a = trim(aadhaar).replace(/\s/g, '');
  if (!a) return `${label} is required`;
  if (!AADHAAR_REGEX.test(a)) return `${label} must be 12 digits and not start with 0 or 1`;
  if (/^(\d)\1{11}$/.test(a)) return `${label} cannot be all identical digits`;
  return null;
}

export function validateMobile(mobile, label = 'Mobile') {
  const m = trim(mobile).replace(/\D/g, '');
  if (!m) return `${label} is required`;
  if (!MOBILE_REGEX.test(m)) return `${label} must be a valid 10-digit Indian mobile`;
  return null;
}

export function validatePin(pin, label = 'PIN code') {
  const p = trim(pin);
  if (!p) return `${label} is required`;
  if (!PIN_REGEX.test(p)) return `${label} must be 6 digits (1–9 then 5 digits)`;
  return null;
}

export function validateLoanAmount(amount) {
  const n = num(amount);
  if (!Number.isFinite(n) || n <= 0) return 'Loan amount must be greater than 0';
  if (n > MAX_LOAN_AMOUNT) return `Loan amount cannot exceed ₹${MAX_LOAN_AMOUNT.toLocaleString('en-IN')}`;
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount).trim())) return 'Loan amount may have at most 2 decimal places';
  return null;
}

/**
 * Each `build*Issues` function below returns an ordered list of
 * `[formStateFieldKey, message]` tuples for one module. `formStateFieldKey`
 * is the exact key used in `BoiHousingVerificationForm.jsx`'s flat
 * `formState` (not the nested case-module key), so callers can look up
 * `fieldErrors[formStateFieldKey]` to show an inline error under the right
 * input. This is the single source of truth consumed both by the
 * toast-message list (`validateApplicantModule`) and the new inline
 * field-error map (`validateApplicantModuleFieldErrors`) — the underlying
 * rules/order are unchanged from before this refactor.
 */
function buildGeneralIssues(g, cat, caseData) {
  const out = [];
  if (!hasText(g.borrowerName, 2)) out.push(['borrowerName', 'Borrower name is required']);
  else if (!NAME_REGEX.test(g.borrowerName.trim())) out.push(['borrowerName', 'Borrower name has invalid characters']);
  if (!hasText(g.fatherHusbandName, 2)) out.push(['fatherHusbandName', "Father / Husband name is required"]);
  if (!g.gender) out.push(['gender', 'Gender is required']);
  if (!g.residentStatus) out.push(['residentStatus', 'Resident status is required']);
  const panErr = validatePan(g.panNumber, 'PAN');
  if (panErr) out.push(['panNumber', panErr]);
  const aadErr = validateAadhaar(g.aadhaarNumber);
  if (aadErr) out.push(['aadhaarNumber', aadErr]);
  if (!g.dateOfBirth) out.push(['dateOfBirth', 'Date of birth is required']);
  else {
    const age = ageYears(g.dateOfBirth, g.dateOfVerification || caseData.dateOfReportSubmission);
    if (age == null) out.push(['dateOfBirth', 'Date of birth is invalid']);
    else if (age < 18 || age > 100) out.push(['dateOfBirth', 'Applicant age must be between 18 and 100']);
  }
  if (!hasText(g.qualification)) out.push(['qualification', 'Qualification is required']);
  if (!g.maritalStatus) out.push(['maritalStatus', 'Marital status is required']);
  if (!cat) out.push(['employmentCategory', 'Employment category is required']);
  // CA / UDIN / verification dates are case-level (Start Page) — not repeated per applicant
  return out;
}

function buildResidenceIssues(r) {
  const out = [];
  if (!hasText(r.givenAddress, 10)) out.push(['givenAddress', 'Given address is required (min 10 chars)']);
  if (!hasText(r.presentAddress, 10)) out.push(['presentAddress', 'Present address is required (min 10 chars)']);
  if (!r.addressTallied) out.push(['addressTallied', 'Address tallied is required']);
  if (r.addressTallied === 'no' && !hasText(r.mismatchDetails, 5)) {
    out.push(['mismatchDetails', 'Fill a–c details when address is not confirmed']);
  }
  if (!r.stayConfirmed) out.push(['stayConfirmed', 'Stay confirmed is required']);
  if (r.stayConfirmed === 'yes' && !hasText(r.stayingSince)) out.push(['stayingSince', 'Staying since (years) is required']);
  if (!r.tenureStatus) out.push(['tenureStatus', 'Tenure status is required']);
  if (r.tenureStatus === 'Rented' && !(num(r.rentAmount) > 0)) out.push(['rentAmount', 'Rent amount is required when rented']);
  if (!r.houseType) out.push(['houseType', 'House type is required']);
  if (!hasText(r.city, 2)) out.push(['city', 'City is required']);
  const pinErr = validatePin(r.pinCode);
  if (pinErr) out.push(['pinCode', pinErr]);
  const mobErr = validateMobile(r.mobileNumber);
  if (mobErr) out.push(['mobileNumber', mobErr]);
  if (r.telephoneNumber && trim(r.telephoneNumber).replace(/\D/g, '').length > 0) {
    const tel = trim(r.telephoneNumber).replace(/\D/g, '');
    if (tel.length < 6 || tel.length > 11) out.push(['telephoneNumber', 'Residence phone must be 6–11 digits']);
  }
  if (!hasText(r.contactPersonName, 2)) out.push(['contactPersonName', 'Contact person name is required']);
  if (!r.contactPersonRelation) out.push(['contactPersonRelation', 'Contact person relation is required']);
  if (!r.livingStandard) out.push(['livingStandard', 'Living standard is required']);
  if (!r.accessibility) out.push(['accessibility', 'Accessibility is required']);
  if (!hasText(r.visitDateTime)) out.push(['visitDateTime', 'Residence visit date/time is required']);
  if (r.numberOfDependents === '' || r.numberOfDependents == null || Number(r.numberOfDependents) < 0) {
    out.push(['numberOfDependents', 'Number of dependents is required (≥ 0)']);
  }
  if (!r.houseLocked) out.push(['houseLocked', 'House locked Yes/No is required']);
  if (r.houseLocked === 'yes' && !hasText(r.locksReason, 5)) {
    out.push(['locksReason', 'Fill neighbour a–f answers when house is locked']);
  }
  if (r.namePlateSeen === 'yes' && !r.namePlateMatches) out.push(['namePlateMatches', 'Name plate match is required']);
  if (!hasText(r.detailRemarks || r.residenceConfirmation, 2)) {
    out.push(['resDetailRemarks', 'Remarks are required']);
  }
  if (!r.detailStatus) out.push(['resDetailStatus', 'Status is required']);
  return out;
}

function buildEmploymentIssues(e, cat) {
  const out = [];
  if (!isEmployedCategory(cat)) return out;
  if (!hasText(e.companyName, 2)) out.push(['companyName', 'Employer / business name is required']);
  if (!hasText(e.companyAddress, 10)) out.push(['companyAddress', 'Office address is required']);
  if (!hasText(e.designation)) out.push(['designation', 'Designation is required']);
  if (!hasText(e.yearsOfService)) out.push(['yearsOfService', 'Years of service is required']);
  if (!e.nameBoardSighted) out.push(['nameBoardSighted', 'Name board sighted is required']);
  if (e.nameBoardSighted === 'no' && !hasText(e.detailsOfSighting, 5)) {
    out.push(['detailsOfSighting', 'Details of sighting required when name board not seen']);
  }
  if (!hasText(e.addressConfirmedBy, 2)) out.push(['addressConfirmedBy', 'Address confirmed by is required']);
  if (!hasText(e.landmark, 2)) out.push(['employmentLandmark', 'Office landmark is required']);
  if (!e.officeOwnership) out.push(['officeOwnership', 'Office ownership is required']);
  if (!hasText(e.proofsReceived) && !(Array.isArray(e.proofsReceived) && e.proofsReceived.length)) {
    out.push(['proofsReceived', 'Types of proof received is required']);
  }
  if (!e.typeOfFirm) out.push(['typeOfFirm', 'Type of employer/firm is required']);
  if (!hasText(e.supervisorDetails, 2)) out.push(['supervisorDetails', 'Supervisory official & mobile is required']);
  if (!e.visitingCardObtained) out.push(['visitingCardObtained', 'Visiting card obtained is required']);
  if (!hasText(e.employeeNotes, 5)) out.push(['employeeNotes', 'Verifier notes are required']);
  if (isSalaryCategory(cat) && !e.metEmployee) out.push(['metEmployee', 'Met employee in person is required']);
  if (isBusinessCategory(cat)) {
    if (!hasText(e.natureOfBusiness)) out.push(['natureOfBusiness', 'Nature of business is required']);
    if (!hasText(e.yearOfEstablishment)) out.push(['yearOfEstablishment', 'Year of establishment is required']);
    if (!hasText(e.lineOfBusiness)) out.push(['lineOfBusiness', 'Line of business is required']);
  }
  if (isSalaryCategory(cat) && !hasText(e.termsOfEmployment)) {
    out.push(['termsOfEmployment', 'Terms of employment is required']);
  }
  if (e.officialEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(e.officialEmailId))) {
    out.push(['officialEmailId', 'Official email is invalid']);
  }
  if (e.workContact) {
    const digits = trim(e.workContact).replace(/\D/g, '');
    if (!(MOBILE_REGEX.test(digits) || (digits.length >= 6 && digits.length <= 11))) {
      out.push(['workContact', 'Office phone is invalid']);
    }
  }
  if (e.businessRegistrationNumber) {
    const gst = trim(e.businessRegistrationNumber).toUpperCase();
    if (gst.length === 15 && !GSTIN_REGEX.test(gst)) out.push(['businessRegistrationNumber', 'GSTIN format is invalid']);
  }
  return out;
}

function buildPanIssues(g, pan) {
  const out = [];
  const panErr = validatePan(pan.panNumber, 'Portal PAN');
  if (panErr) out.push(['panPortalNumber', panErr]);
  if (g.panNumber && pan.panNumber && trim(g.panNumber).toUpperCase() !== trim(pan.panNumber).toUpperCase()) {
    out.push(['panPortalNumber', 'Portal PAN must match general PAN']);
  }
  if (!pan.statusOnPortal) out.push(['panPortalStatus', 'Portal validation status is required']);
  if (!pan.portalTally) out.push(['panPortalTally', 'Name match tally is required']);
  if (!hasText(pan.nameOnPortal, 2)) out.push(['panPortalName', 'Name on portal is required']);
  if (!pan.genderMatching) out.push(['panGenderMatching', 'Gender matching is required']);
  if (!pan.finalStatus) out.push(['panFinalStatus', 'PAN final status is required']);
  if (pan.finalStatus === 'not_confirmed' && !hasText(pan.portalMatchRemarks, 5)) {
    out.push(['panPortalMatchRemarks', 'Remarks required when PAN not confirmed']);
  }
  return out;
}

function buildSalaryIssues(sal, cat) {
  const out = [];
  if (!isSalaryCategory(cat)) return out;
  if (!hasText(sal.companyName, 2)) out.push(['salaryCompanyName', 'Salary employer name is required']);
  if (!hasText(sal.designation)) out.push(['salaryDesignation', 'Salary designation is required']);
  if (!hasText(sal.yearsOfService)) out.push(['salaryYearsOfService', 'Service tenure is required']);
  if (!sal.serviceConfirmed) out.push(['salaryServiceConfirmed', 'Service confirmed is required']);
  if (!(num(sal.grossMonthlyIncome) >= 0) || sal.grossMonthlyIncome === '') {
    out.push(['salaryGrossMonthlyIncome', 'Gross monthly income is required']);
  }
  if (!sal.totalIncome) out.push(['salaryTotalIncome', 'Total income verification is required']);
  if (!sal.form16Issued) out.push(['salaryForm16Issued', 'Form-16 issued is required']);
  if (!sal.payslipsAvailable) out.push(['salaryPayslipsAvailable', 'Payslips verified is required']);
  if (!sal.bankStatementsAvailable) out.push(['salaryBankStatementsAvailable', 'Bank statement match is required']);
  return out;
}

const DOC_FIELD_TO_STATE_KEY = {
  sealOfOrganization: 'docSealOfOrganization',
  signatureOfAuthority: 'docSignatureOfAuthority',
  salarySlipDateAmount: 'docSalarySlipDateAmount',
  officeAddressCorrect: 'docOfficeAddressCorrect',
};

function buildDocumentsIssues(doc, cat) {
  const out = [];
  if (!isSalaryCategory(cat) && !isEmployedCategory(cat)) return out;
  if (!isSalaryCategory(cat)) return out;
  for (const k of Object.keys(DOC_FIELD_TO_STATE_KEY)) {
    if (!doc[k]) out.push([DOC_FIELD_TO_STATE_KEY[k], `Document tally (${k}) is required`]);
  }
  return out;
}

function buildBusinessIssues(biz, cat) {
  const out = [];
  if (!isBusinessCategory(cat)) return out;
  if (!biz.businessActivitySeen) out.push(['obsBusinessActivitySeen', 'Business activity seen is required']);
  if (!biz.totalEmployees) out.push(['obsEmployeesSeen', 'Number of employee seen is required']);
  if (!biz.rawMaterialsSeen) out.push(['obsEquipmentStockSeen', 'Equipment/Stock seen is required']);
  if (!biz.businessAmbience) out.push(['obsBusinessAmbience', 'Business premises ambience is required']);
  if (!biz.businessActivityLevel) out.push(['obsActivityLevel', 'Level of Business activity is required']);
  if (!biz.verifierName) out.push(['obsVerifierName', 'Verifier name is required']);
  if (!biz.verifierRemarks) out.push(['obsVerifierRemarks', 'Verifier remarks are required']);
  if (!biz.supervisorName) out.push(['obsSupervisorName', 'Supervisor name is required']);
  if (!biz.supervisorRemarks) out.push(['obsSupervisorRemarks', 'Supervisor remarks are required']);
  if (!biz.businessRemarks) out.push(['obsNegativeRemarks', 'Remarks in Detail are required']);
  if (!biz.detailStatus) out.push(['obsNegativeStatus', 'Remarks status (Positive/Negative) is required']);
  return out;
}

function buildPropertyIssues(prop, r, caseData, appId) {
  const out = [];
  if (!isPropertyLoanType(caseData.loanType)) return out;
  const isPrimary = caseData.applicants?.find((a) => a.id === appId)?.isPrimary;
  if (!isPrimary) return out;
  if (!hasText(prop.addressOfProperty, 10)) out.push(['propAddressOfProperty', 'Property address is required']);
  if (!prop.addressMatchesApplication) out.push(['propAddressMatchesApplication', 'Address matches application is required']);
  if (!prop.ownerName) out.push(['propOwnerName', 'Name of owner is required']);
  if (!prop.propertyType) out.push(['propPropertyType', 'Type of property is required']);
  if (!prop.propertyLocality) out.push(['propPropertyLocality', 'Locality of property is required']);
  if (!prop.ownershipType) out.push(['propOwnershipType', 'Ownership type is required']);
  if (!prop.constructionStatus) out.push(['propConstructionStatus', 'Construction status is required']);
  if (!prop.independentAccess) out.push(['propIndependentAccess', 'Whether the property has independent access is required']);
  if (!prop.buildingUsage) out.push(['propBuildingUsage', 'Building/usage type is required']);
  if (!hasText(prop.visitDateTime) && !hasText(r.visitDateTime)) {
    out.push(['propVisitDateTime', 'Property site visit date is required']);
  }
  return out;
}

function buildFeedbackIssues(items, appId) {
  const keys = [
    'personalDetails',
    'residenceVerification',
    'telephoneVerification',
    'incomeProof',
    'itReturn',
    'employerOffice',
    'placeOfBusiness',
    'bankDetails',
    'otherDetails',
  ];
  const out = [];
  for (const k of keys) {
    if (!items[k]) {
      const stateKey = `fb${k.charAt(0).toUpperCase()}${k.slice(1)}_${appId}`;
      out.push([stateKey, `Verification summary (${k}) is required`]);
    }
  }
  return out;
}

/** Ordered `[formStateFieldKey, message]` issues for one applicant module. */
function getModuleIssues(caseData, appId, moduleKey) {
  const g = getMod(caseData, appId, 'general', 'general');
  const r = getMod(caseData, appId, 'residence', 'residence');
  const e = getMod(caseData, appId, 'employment', 'employment');
  const pan = getMod(caseData, appId, 'pan', 'pan');
  const sal = getMod(caseData, appId, 'salary', 'salary');
  const doc = getMod(caseData, appId, 'documents', 'documents');
  const biz = getMod(caseData, appId, 'business', 'business');
  const prop = getMod(caseData, appId, 'property', 'property');
  const fb = caseData?.modules?.[appId]?.feedback?.feedback || {};
  const items = fb.items || {};
  const cat = e.employmentCategory || '';

  switch (moduleKey) {
    case 'general':
      return buildGeneralIssues(g, cat, caseData);
    case 'residence':
      return buildResidenceIssues(r);
    case 'employment':
      return buildEmploymentIssues(e, cat);
    case 'pan':
      return buildPanIssues(g, pan);
    case 'salary':
      return buildSalaryIssues(sal, cat);
    case 'documents':
      return buildDocumentsIssues(doc, cat);
    case 'business':
      return buildBusinessIssues(biz, cat);
    case 'property':
      return buildPropertyIssues(prop, r, caseData, appId);
    case 'evidence':
      // isPrimary-only gate, no per-field checks — kept for parity with checklist callers.
      return [];
    case 'feedback':
      return buildFeedbackIssues(items, appId);
    default:
      return [];
  }
}

/** Field-level completeness for a module (not just status stamp). */
export function validateApplicantModule(caseData, appId, moduleKey, labelPrefix) {
  const pfx = (msg) => `${labelPrefix}: ${msg}`;
  return getModuleIssues(caseData, appId, moduleKey).map(([, msg]) => pfx(msg));
}

/**
 * Same underlying rules as `validateApplicantModule`, but keyed by the exact
 * `formState` field name so the form can show an inline error under each
 * invalid input (in addition to the toast summary). First rule wins if two
 * checks target the same field.
 */
export function validateApplicantModuleFieldErrors(caseData, appId, moduleKey) {
  const out = {};
  for (const [field, message] of getModuleIssues(caseData, appId, moduleKey)) {
    if (field && !(field in out)) out[field] = message;
  }
  return out;
}

/**
 * Full production validation for generate/submit.
 * @returns {string[]}
 */
export function validateBoiHousingCase(caseData) {
  const errors = [];
  if (!caseData) return ['No case data'];

  if (!caseData.loanType) errors.push('Loan type is required');
  else if (!['Home Loan', 'Mortgage Loan', 'Business Loan', 'Personal Loan', 'Vehicle Loan', 'Education Loan'].includes(caseData.loanType)) {
    errors.push('Loan type is invalid');
  }
  if (!trim(caseData.branchName)) errors.push('Branch name is required');
  const amtErr = validateLoanAmount(caseData.loanAmount);
  if (amtErr) errors.push(amtErr);
  if (!trim(caseData.bankReferenceNo)) errors.push('Bank reference number is required');
  if (!trim(caseData.ddaReferenceNo) && !trim(caseData.id)) errors.push('DDA reference number is required');
  if (!trim(caseData.udinNumber) || trim(caseData.udinNumber).length < 8) errors.push('UDIN is required');
  const primaryGeneral = caseData.modules?.primary?.general?.general || {};
  const caName = trim(caseData.caName) || trim(primaryGeneral.caName);
  if (!caName || caName.length < 2) errors.push('CA registration name is required');
  const dov = caseData.dateOfVerification || primaryGeneral.dateOfVerification;
  if (!dov) errors.push('Date of verification is required');
  if (!caseData.dateOfReceiptOfFile) errors.push('Date of receipt of file is required');
  if (!caseData.dateOfReportSubmission) errors.push('Date of report submission is required');
  if (!caseData.particularsVerdict) errors.push('Particulars verdict is required');
  if (!caseData.overallOpinion) errors.push('Overall opinion is required');

  const receipt = parseDate(caseData.dateOfReceiptOfFile);
  const submit = parseDate(caseData.dateOfReportSubmission);
  if (receipt && submit && submit < receipt) {
    errors.push('Date of submission cannot be before date of receipt');
  }

  const apps = caseData.applicants || [];
  if (apps.length < 1 || apps.length > MAX_APPLICANTS) {
    errors.push(`Applicants must be between 1 and ${MAX_APPLICANTS}`);
  }

  const labeled = labelApplicants(apps);
  for (const applicant of labeled) {
    const mods = caseData.modules?.[applicant.id];
    if (!mods) {
      errors.push(`${applicant.label}: no verification modules`);
      continue;
    }
    const applicable = applicableModuleKeys(mods, caseData.loanType).filter(
      (k) => k !== 'feedback' || true
    );
    // Always validate core modules by content
    const always = ['general', 'residence', 'pan'];
    for (const key of always) {
      errors.push(...validateApplicantModule(caseData, applicant.id, key, applicant.label));
    }
    const cat = getCat(caseData, applicant.id);
    if (isEmployedCategory(cat)) {
      errors.push(...validateApplicantModule(caseData, applicant.id, 'employment', applicant.label));
    }
    if (isSalaryCategory(cat)) {
      errors.push(...validateApplicantModule(caseData, applicant.id, 'salary', applicant.label));
      errors.push(...validateApplicantModule(caseData, applicant.id, 'documents', applicant.label));
    }
    if (isBusinessCategory(cat)) {
      errors.push(...validateApplicantModule(caseData, applicant.id, 'business', applicant.label));
    }
    if (applicant.isPrimary && isPropertyLoanType(caseData.loanType)) {
      errors.push(...validateApplicantModule(caseData, applicant.id, 'property', applicant.label));
    }
    if (applicant.isPrimary) {
      errors.push(...validateApplicantModule(caseData, applicant.id, 'evidence', applicant.label));
    }
    // Summary items for each applicant
    errors.push(...validateApplicantModule(caseData, applicant.id, 'feedback', applicant.label));
  }

  return [...new Set(errors)];
}

/** Compute module status from field completeness (not forced completed). */
export function deriveModuleStatus(caseData, appId, moduleKey) {
  const errs = validateApplicantModule(caseData, appId, moduleKey, 'x');
  if (errs.length === 0) return 'completed';
  const mod = caseData?.modules?.[appId]?.[moduleKey];
  const section = mod?.[moduleKey];
  if (section && Object.values(section).some((v) => (Array.isArray(v) ? v.length : trim(v)))) {
    return 'in_progress';
  }
  return 'not_started';
}

export function buildSubmitChecklist(caseData) {
  const labeled = labelApplicants(caseData?.applicants || []);
  return labeled.map((a) => {
    const cat = getCat(caseData, a.id);
    const modules = [];
    for (const key of ['general', 'residence', 'pan', 'employment', 'salary', 'documents', 'business', 'property', 'evidence']) {
      const applicable =
        key === 'employment'
          ? isEmployedCategory(cat)
          : key === 'salary' || key === 'documents'
            ? isSalaryCategory(cat)
            : key === 'business'
              ? isBusinessCategory(cat)
              : key === 'property'
                ? a.isPrimary && isPropertyLoanType(caseData.loanType)
                : key === 'evidence'
                  ? a.isPrimary
                  : true;
      if (!applicable) continue;
      const status = deriveModuleStatus(caseData, a.id, key);
      modules.push({ key, label: MODULE_META[key]?.label || key, status });
    }
    return { id: a.id, label: a.label, modules, complete: modules.every((m) => m.status === 'completed') };
  });
}

// Re-export helpers used by form
export { PROPERTY_LOAN_TYPES, NON_EMPLOYED_CATEGORIES, BUSINESS_CATEGORIES };
