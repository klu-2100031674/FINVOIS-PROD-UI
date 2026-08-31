import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Landmark,
  ClipboardList,
  Home,
  Briefcase,
  IdCard,
  Receipt,
  FolderCheck,
  Building2,
  ImageUp,
  Save,
  FileDown,
  Sparkles,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  ArrowLeft,
  UploadCloud,
  CheckCircle,
} from 'lucide-react';
import { useBoiVerification } from '../../../context/BoiVerificationContext';
import { useExecutiveDraft } from '../../../hooks/useExecutiveDraft';
import useAuth from '../../../hooks/useAuth';
import { executiveAPI } from '../../../api/executiveAPI';
import { apiErrorMessage } from '../../../api/apiClient';
import { executiveReportsPath } from '../../../utils/routePaths';
import {
  DEFAULT_BANK_NAME,
  REPORT_DEFAULTS,
  emptyModules,
  generateCaseId,
  deriveCaseStatus,
  isPropertyLoanType,
  labelApplicants,
} from '../../../utils/boi/boiVerificationSchema';
import {
  validateBoiHousingCase,
  mapEmploymentCategoryToType,
  MAX_APPLICANTS,
  buildSubmitChecklist,
  deriveModuleStatus,
  isEmployedCategory,
  isSalaryCategory,
  isBusinessCategory as isBizCat,
  validateApplicantModule,
  validateApplicantModuleFieldErrors,
} from '../../../utils/boi/boiValidation';

import {
  boiInputClass,
  boiSelectClass,
  boiTextareaClass,
  BoiFormField,
  BoiYesNoRadio,
  BoiTriRadio,
  BoiTalliedRadio,
  BoiSelectField,
  BoiSectionGroup,
  BoiMobileStepHeader,
  BoiApplicantTabsBar,
  BoiStickyMobileNav,
} from './boiFormShared';
import { Button } from '../../common';

const LOAN_TYPES = ['Home Loan', 'Mortgage Loan', 'Business Loan', 'Personal Loan', 'Vehicle Loan', 'Education Loan'];
const GENDER_OPTIONS = ['male', 'female', 'other'];
const RESIDENT_STATUS_OPTIONS = ['Resident', 'Non-Resident'];
const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Others'];
const EMPLOYMENT_CATEGORIES = [
  { value: 'Salaried', label: 'Salaried' },
  { value: 'Business', label: 'Business' },
  { value: 'Others', label: 'Others' },
];

const RES_NATURE_OPTIONS = ['Owned', 'Rental', 'Family Owned', 'Lease', 'PayingGuest', 'CompanyQuarts', 'Others'];
const RES_TYPE_OPTIONS = ['Flat', 'IndependentHouse', 'Multi-Tenanted House'];
const RES_RELATION_OPTIONS = ['Self', 'Spouse', 'Father', 'Mother', 'Sibling', 'Landlord', 'Other'];
const RES_LOCALITY_OPTIONS = ['Commercial', 'Residential', 'project/Security Area'];
const RES_LIVING_STANDARD_OPTIONS = ['Low Class', 'Middle', 'Upper Middle', 'High Class'];
const RES_ACCESSIBILITY_OPTIONS = ['Easy', 'Difficult', 'Very Difficult'];
const OFFICE_OWNERSHIP_OPTIONS = ['Owned', 'Rented', 'Leased', 'Other'];
const PROP_PROPERTY_TYPE_OPTIONS = ['Residential', 'Commercial', 'Industrial', 'Agriculture', 'Others'];

const DOC_FIELDS = [
  { key: 'sealOfOrganization', label: 'Seal of Organization matches original' },
  { key: 'signatureOfAuthority', label: 'Signature of Authority looks authentic' },
  { key: 'salarySlipDateAmount', label: 'Salary Slip dates and amount match' },
  { key: 'officeAddressCorrect', label: 'Office address matches record' },
];

const MAX_SIZE = 10 * 1024 * 1024;
const IMG_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const DOC_TYPES = ['application/pdf', ...IMG_TYPES];

const EVIDENCE_SECTIONS = [
  { key: 'applicantPhotos', title: 'Applicant Photos', subtitle: 'Photos of the primary applicant', accept: 'image/jpeg,image/png,image/jpg', allowed: IMG_TYPES },
  { key: 'coApplicantPhotos', title: 'Co-Applicant Photos', subtitle: 'Photos of all co-applicants', accept: 'image/jpeg,image/png,image/jpg', allowed: IMG_TYPES, showOnlyIfCoApplicants: true },
  { key: 'residencePhotos', title: 'Residence Photos', subtitle: 'Photos captured during residence visit', accept: 'image/jpeg,image/png,image/jpg', allowed: IMG_TYPES },
  { key: 'employmentPhotos', title: 'Workplace Photos', subtitle: 'Photos captured at office/business', accept: 'image/jpeg,image/png,image/jpg', allowed: IMG_TYPES, isEmploymentRelated: true },
  { key: 'identityDocs', title: 'Identity Documents', subtitle: 'Government-issued ID proofs (PAN / Aadhaar)', accept: 'application/pdf,image/jpeg,image/png,image/jpg', allowed: DOC_TYPES },
  { key: 'incomeDocs', title: 'Income Documents', subtitle: 'Salary slips, tax returns, bank statements', accept: 'application/pdf,image/jpeg,image/png,image/jpg', allowed: DOC_TYPES, isEmploymentRelated: true },
  { key: 'additionalDocs', title: 'Other Documents', subtitle: 'Any other supporting evidence', accept: 'application/pdf,image/jpeg,image/png,image/jpg', allowed: DOC_TYPES },
];

const FEEDBACK_FIELDS = [
  { key: 'personalDetails', label: 'Personal Details Verification' },
  { key: 'residenceVerification', label: 'Residence Verification' },
  { key: 'telephoneVerification', label: 'Telephone Verification' },
  { key: 'incomeProof', label: 'Income Proof Verification' },
  { key: 'itReturn', label: 'IT Return Verification' },
  { key: 'employerOffice', label: 'Employer / Office Verification' },
  { key: 'placeOfBusiness', label: 'Place of Business Verification' },
  { key: 'bankDetails', label: 'Bank Details Verification' },
  { key: 'otherDetails', label: 'Other Details Verification' },
];

/** Split stored multi-line report answers (a/b/c…) back into UI sub-fields. */
function splitReportParts(value, count) {
  const raw = String(value || '').trim();
  if (!raw) return Array.from({ length: count }, () => '');
  const parts = raw.split(/\n|;/).map((p) => p.trim()).filter((p) => p.length > 0);
  while (parts.length < count) parts.push('');
  return parts.slice(0, count);
}

function joinReportParts(parts) {
  return (parts || []).map((p) => String(p || '').trim()).join('\n');
}

const HOUSE_LOCKED_SUB_QUESTIONS = [
  { key: 'locksA', label: 'a) Does the applicant stay at this residence' },
  { key: 'locksB', label: 'b) Approximate age of Applicant' },
  { key: 'locksC', label: 'c) No. of family members in the house' },
  { key: 'locksD', label: 'd) Approximate age of Applicant' },
  { key: 'locksE', label: 'e) Occupation of Applicant' },
  { key: 'locksF', label: 'f) Staying Since' },
];

const ADDRESS_NOT_CONFIRMED_SUB_QUESTIONS = [
  { key: 'mismatchA', label: 'a) Reason for address not confirmed (Untraceable / Mismatched)' },
  { key: 'mismatchB', label: 'b) If Untraceable, Reason thereof' },
  { key: 'mismatchC', label: 'c) If mismatched, to whom does the address belong to' },
];

const initialFormState = {
  loanType: '',
  bankName: DEFAULT_BANK_NAME,
  branchName: '',
  loanAmount: '',
  borrowerName: '',
  coApplicant1Name: '',
  coApplicant2Name: '',
  fatherHusbandName: '',
  gender: '',
  residentStatus: '',
  panNumber: '',
  aadhaarNumber: '',
  dateOfBirth: '',
  qualification: '',
  maritalStatus: '',
  employmentType: '',
  udinNumber: REPORT_DEFAULTS.udinNumber,
  caName: REPORT_DEFAULTS.caName,
  dateOfVerification: '',
  dateOfReportSubmission: '',
  givenAddress: '',
  presentAddress: '',
  addressTallied: '',
  stayConfirmed: '',
  stayingSince: '',
  tenureStatus: '',
  rentAmount: '',
  houseType: '',
  structureType: '',
  plinthAreaSqft: '',
  localityType: '',
  landmark: '',
  city: '',
  pinCode: '',
  telephoneNumber: '',
  mobileNumber: '',
  contactPersonName: '',
  contactPersonRelation: '',
  livingStandard: '',
  accessibility: '',
  numberOfDependents: '',
  visitDateTime: '',
  namePlateSeen: '',
  namePlateMatches: '',
  houseLocked: '',
  locksReason: '',
  locksA: '',
  locksB: '',
  locksC: '',
  locksD: '',
  locksE: '',
  locksF: '',
  neighboursContacted: '',
  neighbourFeedback: '',
  mismatchDetails: '',
  mismatchA: '',
  mismatchB: '',
  mismatchC: '',
  residenceConfirmation: '',
  resDetailRemarks: 'NO REMARKS',
  resDetailStatus: 'Positive',
  resVerifierRemarks: '',
  resSupervisorRemarks: '',
  changeLikelihood: '',
  visitingCardDetails: '',
  employmentCategory: '',
  companyName: '',
  companyAddress: '',
  workContact: '',
  designation: '',
  yearsOfService: '',
  natureOfBusiness: '',
  officialEmailId: '',
  companyWebsite: '',
  nameBoardSighted: '',
  detailsOfSighting: '',
  metEmployee: '',
  employeesContacted: '',
  employeeNotes: '',
  businessRegistrationNumber: '',
  registrationAuthority: '',
  addressConfirmedBy: '',
  employmentLandmark: '',
  officeOwnership: '',
  proofsReceived: '',
  yearOfEstablishment: '',
  typeOfFirm: '',
  lineOfBusiness: '',
  termsOfEmployment: '',
  supervisorDetails: '',
  visitingCardObtained: '',
  supervisorRemarks: 'NO REMARKS',
  supervisorStatus: 'Positive',
  panPortalNumber: '',
  panPortalStatus: '',
  panPortalName: '',
  panPortalTally: '',
  panPortalMatchRemarks: '',
  panFinalStatus: '',
  panGenderMatching: '',
  panVerifierName: '',
  panVerifierRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
  panSupervisorName: '',
  panSupervisorRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
  panDetailRemarks: 'NO REMARKS',
  panDetailStatus: 'Positive',
  salaryCompanyName: '',
  salaryDesignation: '',
  salaryYearsOfService: '',
  salaryServiceConfirmed: '',
  salaryServiceTallyRemarks: '',
  salaryGrossMonthlyIncome: '',
  salaryMonthlyAllowances: '',
  salaryDeductions: '',
  salaryNetMonthlyTakeHome: '',
  salaryForm16Issued: '',
  salaryPayslipsAvailable: '',
  salaryBankStatementsAvailable: '',
  salaryTotalIncome: '',
  salaryNetTaxPayable: '',
  salaryTaxPaidRemarks: '',
  docSealOfOrganization: '',
  docSignatureOfAuthority: '',
  docSalarySlipDateAmount: '',
  docOfficeAddressCorrect: '',
  docOtherDocName1: '',
  docOtherDocTally1: '',
  docOtherDocName2: '',
  docOtherDocTally2: '',
  obsBusinessActivitySeen: '',
  obsEmployeesSeen: '',
  obsEquipmentStockSeen: '',
  obsBusinessAmbience: '',
  obsActivityLevel: '',
  obsVerifierName: '',
  obsVerifierRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
  obsSupervisorName: '',
  obsSupervisorRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
  obsNegativeRemarks: 'NO REMARKS',
  obsNegativeStatus: 'Positive',
  propOwnerName: '',
  propIndependentAccess: '',
  propIndependentAccessType: '',
  bizActivitySeen: '',
  bizRawMaterialsSeen: '',
  bizMachinerySeen: '',
  bizRemarks: '',
  bizNameBoardSighted: '',
  bizEmployeesSeen: '',
  bizTotalEmployees: '',
  bizFeedbackFromCustomers: '',
  bizFeedbackDetails: '',
  bizNote: '',
  bizAmbience: '',
  bizActivityLevel: '',
  propAddressOfProperty: '',
  propAddressMatchesApplication: '',
  propLandAreaSqft: '',
  propBoundEast: '',
  propBoundWest: '',
  propBoundNorth: '',
  propBoundSouth: '',
  propBoundaryMatch: '',
  propAreaMatch: '',
  propConstructionStatus: '',
  propLayoutApproved: '',
  propPropertyLandmark: '',
  propLocationAccessibility: '',
  propVehicleAccessType: '',
  propNeighborPropertyFeedback: '',
  propPropertyType: '',
  propPropertyLocality: '',
  propOwnershipType: '',
  propBuildingUsage: '',
  propVisitDateTime: '',
  propBuilderName: '',
  propBuilderReputation: '',
  propBuilderSource: '',
  propConstructionStageDetail: '',
  propWorkInFullSwing: '',
  propLikelyCompletionDate: '',
  applicantPhotos: [],
  coApplicantPhotos: [],
  residencePhotos: [],
  employmentPhotos: [],
  identityDocs: [],
  incomeDocs: [],
  additionalDocs: [],
  fbOverallFeedbackNote: '',
  fbGuarantorDetailsPresent: 'no',
  fbGuarantorName: '',
  fbGuarantorAddress: '',
  fbGuarantorVerified: '',
  fbGuarantorOpinion: '',
  bankReferenceNo: '',
  ddaReferenceNo: '',
  dateOfReceiptOfFile: '',
  particularsVerdict: 'Positive',
  overallOpinion: 'Positive',
  obs_app1_res: '',
  obs_app2_res: '',
  obs_app3_res: '',
  obs_guar_res: '',
  obs_app1_biz: '',
  obs_app2_biz: '',
  obs_app3_biz: '',
  obs_guar_emp: '',
  fbPersonalDetails_primary: 'positive',
  fbResidenceVerification_primary: 'positive',
  fbTelephoneVerification_primary: 'positive',
  fbIncomeProof_primary: 'positive',
  fbItReturn_primary: 'positive',
  fbEmployerOffice_primary: 'positive',
  fbPlaceOfBusiness_primary: 'na',
  fbBankDetails_primary: 'positive',
  fbOtherDetails_primary: 'positive',
  fbPersonalDetails_co_1: 'positive',
  fbResidenceVerification_co_1: 'positive',
  fbTelephoneVerification_co_1: 'positive',
  fbIncomeProof_co_1: 'positive',
  fbItReturn_co_1: 'positive',
  fbEmployerOffice_co_1: 'positive',
  fbPlaceOfBusiness_co_1: 'na',
  fbBankDetails_co_1: 'positive',
  fbOtherDetails_co_1: 'positive',
  fbPersonalDetails_co_2: 'positive',
  fbResidenceVerification_co_2: 'positive',
  fbTelephoneVerification_co_2: 'positive',
  fbIncomeProof_co_2: 'positive',
  fbItReturn_co_2: 'positive',
  fbEmployerOffice_co_2: 'positive',
  fbPlaceOfBusiness_co_2: 'na',
  fbBankDetails_co_2: 'positive',
  fbOtherDetails_co_2: 'positive',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function mapCaseToFormState(caseObj, applicantId) {
  const state = { ...initialFormState };
  if (!caseObj) return state;

  state.loanType = caseObj.loanType ?? '';
  state.bankName = caseObj.bankName ?? DEFAULT_BANK_NAME;
  state.branchName = caseObj.branchName ?? '';
  state.loanAmount = caseObj.loanAmount ?? '';
  state.bankReferenceNo = caseObj.bankReferenceNo ?? '';
  state.ddaReferenceNo = caseObj.ddaReferenceNo ?? caseObj.id ?? '';
  state.dateOfReceiptOfFile = caseObj.dateOfReceiptOfFile ?? '';
  state.dateOfReportSubmission = caseObj.dateOfReportSubmission ?? '';
  state.dateOfVerification =
    caseObj.dateOfVerification
    ?? caseObj.modules?.primary?.general?.general?.dateOfVerification
    ?? '';
  state.udinNumber =
    caseObj.udinNumber
    ?? caseObj.modules?.primary?.general?.general?.udinNumber
    ?? REPORT_DEFAULTS.udinNumber;
  state.caName =
    caseObj.caName
    ?? caseObj.modules?.primary?.general?.general?.caName
    ?? REPORT_DEFAULTS.caName;
  state.particularsVerdict = caseObj.particularsVerdict ?? 'Positive';
  state.overallOpinion = caseObj.overallOpinion ?? 'Positive';

  state.obs_app1_res = caseObj.obs_app1_res ?? '';
  state.obs_app2_res = caseObj.obs_app2_res ?? '';
  state.obs_app3_res = caseObj.obs_app3_res ?? '';
  state.obs_guar_res = caseObj.obs_guar_res ?? '';
  state.obs_app1_biz = caseObj.obs_app1_biz ?? '';
  state.obs_app2_biz = caseObj.obs_app2_biz ?? '';
  state.obs_app3_biz = caseObj.obs_app3_biz ?? '';
  state.obs_guar_emp = caseObj.obs_guar_emp ?? '';

  const appIds = ['primary', 'co_1', 'co_2'];
  appIds.forEach((appId) => {
    const appFb = caseObj.modules?.[appId]?.feedback?.feedback?.items ?? {};
    state[`fbPersonalDetails_${appId}`] = appFb.personalDetails ?? 'positive';
    state[`fbResidenceVerification_${appId}`] = appFb.residenceVerification ?? 'positive';
    state[`fbTelephoneVerification_${appId}`] = appFb.telephoneVerification ?? 'positive';
    state[`fbIncomeProof_${appId}`] = appFb.incomeProof ?? 'positive';
    state[`fbItReturn_${appId}`] = appFb.itReturn ?? 'positive';
    state[`fbEmployerOffice_${appId}`] = appFb.employerOffice ?? 'positive';
    state[`fbPlaceOfBusiness_${appId}`] = appFb.placeOfBusiness ?? 'na';
    state[`fbBankDetails_${appId}`] = appFb.bankDetails ?? 'positive';
    state[`fbOtherDetails_${appId}`] = appFb.otherDetails ?? 'positive';
  });

  const modules = caseObj.modules?.[applicantId];
  if (!modules) return state;

  // Start-page co-applicant names (always from case modules, independent of active tab)
  state.coApplicant1Name = caseObj.modules?.co_1?.general?.general?.borrowerName ?? '';
  state.coApplicant2Name = caseObj.modules?.co_2?.general?.general?.borrowerName ?? '';

  const general = modules.general?.general ?? {};
  state.borrowerName = general.borrowerName ?? '';
  state.fatherHusbandName = general.fatherHusbandName ?? '';
  state.gender = general.gender ?? '';
  state.residentStatus = general.residentStatus ?? '';
  state.panNumber = general.panNumber ?? '';
  state.aadhaarNumber = general.aadhaarNumber ?? '';
  state.dateOfBirth = general.dateOfBirth ?? '';
  state.qualification = general.qualification ?? '';
  state.maritalStatus = general.maritalStatus ?? '';
  state.employmentType = general.employmentType ?? '';
  // Keep case-level CA/UDIN/dates already loaded above (do not overwrite from co-app modules)

  const residence = modules.residence?.residence ?? {};
  state.givenAddress = residence.givenAddress ?? '';
  state.presentAddress = residence.presentAddress ?? '';
  state.addressTallied = residence.addressTallied ?? '';
  state.stayConfirmed = residence.stayConfirmed ?? '';
  state.stayingSince = residence.stayingSince ?? '';
  state.tenureStatus = residence.tenureStatus ?? '';
  state.rentAmount = residence.rentAmount ?? '';
  state.houseType = residence.houseType ?? '';
  state.structureType = residence.structureType ?? '';
  state.plinthAreaSqft = residence.plinthAreaSqft ?? '';
  state.localityType = residence.localityType ?? '';
  state.landmark = residence.landmark ?? '';
  state.city = residence.city ?? '';
  state.pinCode = residence.pinCode ?? '';
  state.telephoneNumber = residence.telephoneNumber ?? '';
  state.mobileNumber = residence.mobileNumber ?? '';
  state.contactPersonName = residence.contactPersonName ?? '';
  state.contactPersonRelation = residence.contactPersonRelation ?? '';
  state.livingStandard = residence.livingStandard ?? '';
  state.accessibility = residence.accessibility === 'Moderate' ? 'Easy' : (residence.accessibility ?? '');
  state.numberOfDependents = residence.numberOfDependents ?? '';
  state.visitDateTime = residence.visitDateTime ?? '';
  state.namePlateSeen = residence.namePlateSeen ?? '';
  state.namePlateMatches = residence.namePlateMatches ?? '';
  state.houseLocked = residence.houseLocked ?? '';
  state.locksReason = residence.locksReason ?? '';
  const lockParts = splitReportParts(residence.locksReason, 6);
  state.locksA = lockParts[0];
  state.locksB = lockParts[1];
  state.locksC = lockParts[2];
  state.locksD = lockParts[3];
  state.locksE = lockParts[4];
  state.locksF = lockParts[5];
  state.neighboursContacted = residence.neighboursContacted ?? '';
  state.neighbourFeedback = residence.neighbourFeedback ?? '';
  state.mismatchDetails = residence.mismatchDetails ?? '';
  const mismatchParts = splitReportParts(residence.mismatchDetails, 3);
  state.mismatchA = mismatchParts[0];
  state.mismatchB = mismatchParts[1];
  state.mismatchC = mismatchParts[2];
  state.residenceConfirmation = residence.residenceConfirmation ?? '';
  state.resDetailRemarks = residence.detailRemarks ?? residence.residenceConfirmation ?? 'NO REMARKS';
  state.resDetailStatus = residence.detailStatus || 'Positive';
  state.resVerifierRemarks = residence.resVerifierRemarks ?? '';
  state.resSupervisorRemarks = residence.resSupervisorRemarks ?? '';

  const employment = modules.employment?.employment ?? {};
  state.employmentCategory = employment.employmentCategory ?? '';
  state.companyName = employment.companyName ?? '';
  state.companyAddress = employment.companyAddress ?? '';
  state.workContact = employment.workContact ?? '';
  state.designation = employment.designation ?? '';
  state.yearsOfService = employment.yearsOfService ?? '';
  state.natureOfBusiness = employment.natureOfBusiness ?? '';
  state.officialEmailId = employment.officialEmailId ?? '';
  state.companyWebsite = employment.companyWebsite ?? '';
  state.nameBoardSighted = employment.nameBoardSighted ?? '';
  state.detailsOfSighting = employment.detailsOfSighting ?? '';
  state.metEmployee = employment.metEmployee ?? '';
  state.employeesContacted = employment.employeesContacted ?? '';
  state.employeeNotes = employment.employeeNotes ?? '';
  state.businessRegistrationNumber = employment.businessRegistrationNumber ?? '';
  state.registrationAuthority = employment.registrationAuthority ?? '';
  state.addressConfirmedBy = employment.addressConfirmedBy ?? '';
  state.employmentLandmark = employment.landmark ?? '';
  state.officeOwnership = employment.officeOwnership ?? '';
  state.proofsReceived = Array.isArray(employment.proofsReceived)
    ? employment.proofsReceived.join(', ')
    : (employment.proofsReceived ?? '');
  state.yearOfEstablishment = employment.yearOfEstablishment ?? '';
  state.typeOfFirm = employment.typeOfFirm ?? '';
  state.lineOfBusiness = employment.lineOfBusiness ?? '';
  state.termsOfEmployment = employment.termsOfEmployment ?? '';
  state.supervisorDetails = employment.supervisorDetails ?? '';
  state.visitingCardObtained = employment.visitingCardObtained ?? '';
  state.supervisorRemarks = employment.supervisorRemarks ?? 'NO REMARKS';
  state.supervisorStatus = employment.supervisorStatus ?? 'Positive';
  state.changeLikelihood = employment.changeLikelihood ?? '';
  state.visitingCardDetails = employment.visitingCardDetails ?? '';

  const pan = modules.pan?.pan ?? {};
  state.panPortalNumber = pan.panNumber ?? '';
  state.panPortalStatus = pan.statusOnPortal ?? '';
  state.panPortalName = pan.nameOnPortal ?? '';
  state.panPortalTally = pan.portalTally ?? '';
  state.panPortalMatchRemarks = pan.portalMatchRemarks ?? '';
  state.panFinalStatus = pan.finalStatus ?? '';
  state.panGenderMatching = pan.genderMatching ?? '';
  state.panVerifierName = pan.verifierName ?? '';
  state.panVerifierRemarks = pan.verifierRemarks ?? 'VERIFIED NO ADVERSE FEATURES FOUND';
  state.panSupervisorName = pan.supervisorName ?? '';
  state.panSupervisorRemarks = pan.supervisorRemarks ?? 'VERIFIED NO ADVERSE FEATURES FOUND';
  state.panDetailRemarks = pan.detailRemarks ?? 'NO REMARKS';
  state.panDetailStatus = pan.detailStatus ?? 'Positive';

  const salary = modules.salary?.salary ?? {};
  state.salaryCompanyName = salary.companyName ?? '';
  state.salaryDesignation = salary.designation ?? '';
  state.salaryYearsOfService = salary.yearsOfService ?? '';
  state.salaryServiceConfirmed = salary.serviceConfirmed ?? '';
  state.salaryServiceTallyRemarks = salary.serviceTallyRemarks ?? '';
  state.salaryGrossMonthlyIncome = salary.grossMonthlyIncome ?? '';
  state.salaryMonthlyAllowances = salary.monthlyAllowances ?? '';
  state.salaryDeductions = salary.deductions ?? '';
  state.salaryNetMonthlyTakeHome = salary.netMonthlyTakeHome ?? '';
  state.salaryForm16Issued = salary.form16Issued ?? '';
  state.salaryPayslipsAvailable = salary.payslipsAvailable ?? '';
  state.salaryBankStatementsAvailable = salary.bankStatementsAvailable ?? '';
  state.salaryTotalIncome = salary.totalIncome ?? '';
  state.salaryNetTaxPayable = salary.netTaxPayable ?? '';
  state.salaryTaxPaidRemarks = salary.remarks ?? salary.taxPaidRemarks ?? '';

  const documents = modules.documents?.documents ?? {};
  state.docSealOfOrganization = documents.sealOfOrganization ?? '';
  state.docSignatureOfAuthority = documents.signatureOfAuthority ?? '';
  state.docSalarySlipDateAmount = documents.salarySlipDateAmount ?? '';
  state.docOfficeAddressCorrect = documents.officeAddressCorrect ?? '';
  state.docOtherDocName1 = documents.otherDocName1 ?? '';
  state.docOtherDocTally1 = documents.otherDocTally1 ?? '';
  state.docOtherDocName2 = documents.otherDocName2 ?? '';
  state.docOtherDocTally2 = documents.otherDocTally2 ?? '';

  const business = modules.business?.business ?? {};
  state.obsBusinessActivitySeen = business.businessActivitySeen ?? '';
  state.obsEmployeesSeen = business.totalEmployees ?? '';
  state.obsEquipmentStockSeen = business.rawMaterialsSeen ?? '';
  state.obsBusinessAmbience = business.businessAmbience ?? '';
  state.obsActivityLevel = business.businessActivityLevel ?? '';
  state.obsVerifierName = business.verifierName ?? '';
  state.obsVerifierRemarks = business.verifierRemarks ?? 'VERIFIED NO ADVERSE FEATURES FOUND';
  state.obsSupervisorName = business.supervisorName ?? '';
  state.obsSupervisorRemarks = business.supervisorRemarks ?? 'VERIFIED NO ADVERSE FEATURES FOUND';
  state.obsNegativeRemarks = business.businessRemarks ?? 'NO REMARKS';
  state.obsNegativeStatus = business.detailStatus ?? 'Positive';

  const property = modules.property?.property ?? {};
  state.propAddressOfProperty = property.addressOfProperty ?? '';
  state.propAddressMatchesApplication = property.addressMatchesApplication ?? '';
  state.propLandAreaSqft = property.landAreaSqft ?? '';
  state.propBoundEast = property.boundEast ?? '';
  state.propBoundWest = property.boundWest ?? '';
  state.propBoundNorth = property.boundNorth ?? '';
  state.propBoundSouth = property.boundSouth ?? '';
  state.propBoundaryMatch = property.boundaryMatch ?? '';
  state.propAreaMatch = property.areaMatch ?? '';
  state.propConstructionStatus = property.constructionStatus ?? '';
  state.propStageOfConstruction = property.stageOfConstruction ?? '';
  state.propIndependentAccess = property.independentAccess ?? '';
  state.propIndependentAccessType = property.independentAccessType ?? '';
  state.propLayoutApproved = property.layoutApproved ?? '';
  state.propPropertyLandmark = property.propertyLandmark ?? '';
  state.propLocationAccessibility = property.locationAccessibility ?? '';
  state.propVehicleAccessType = property.vehicleAccessType ?? '';
  state.propNeighborPropertyFeedback = property.neighborPropertyFeedback ?? '';
  state.propPropertyType = property.propertyType ?? '';
  state.propPropertyLocality = property.propertyLocality ?? '';
  state.propOwnershipType = property.ownershipType ?? '';
  state.propBuildingUsage = property.buildingUsage ?? '';
  state.propVisitDateTime = property.visitDateTime ?? '';
  state.propBuilderName = property.builderName ?? '';
  state.propBuilderReputation = property.builderReputation ?? '';
  state.propBuilderSource = property.builderSource ?? '';
  state.propConstructionStageDetail = property.constructionStageDetail ?? '';
  state.propWorkInFullSwing = property.workInFullSwing ?? '';
  state.propLikelyCompletionDate = property.likelyCompletionDate ?? '';
  state.propOwnerName = property.ownerName ?? '';

  const evidence = modules.evidence?.evidence ?? {};
  state.applicantPhotos = evidence.applicantPhotos ?? [];
  state.coApplicantPhotos = evidence.coApplicantPhotos ?? [];
  state.residencePhotos = evidence.residencePhotos ?? [];
  state.employmentPhotos = evidence.employmentPhotos ?? [];
  state.identityDocs = evidence.identityDocs ?? [];
  state.incomeDocs = evidence.incomeDocs ?? [];
  state.additionalDocs = evidence.additionalDocs ?? [];

  const feedback = modules.feedback?.feedback ?? {};
  state.fbOverallFeedbackNote = feedback.overallFeedbackNote ?? '';
  state.fbGuarantorDetailsPresent = feedback.guarantorDetailsPresent ?? 'no';
  state.fbGuarantorName = feedback.guarantorName ?? '';
  state.fbGuarantorAddress = feedback.guarantorAddress ?? '';
  state.fbGuarantorVerified = feedback.guarantorVerified ?? '';
  state.fbGuarantorOpinion = feedback.guarantorOpinion ?? '';

  return state;
}

function mapFormStateToCase(state, caseObj, applicantId) {
  const updatedCase = {
    ...caseObj,
    loanType: state.loanType,
    bankName: state.bankName,
    branchName: state.branchName,
    loanAmount: state.loanAmount,
    bankReferenceNo: state.bankReferenceNo,
    ddaReferenceNo: state.ddaReferenceNo,
    dateOfReceiptOfFile: state.dateOfReceiptOfFile,
    dateOfReportSubmission: state.dateOfReportSubmission,
    dateOfVerification: state.dateOfVerification,
    udinNumber: state.udinNumber,
    caName: state.caName,
    particularsVerdict: state.particularsVerdict,
    overallOpinion: state.overallOpinion,
    obs_app1_res: state.obs_app1_res,
    obs_app2_res: state.obs_app2_res,
    obs_app3_res: state.obs_app3_res,
    obs_guar_res: state.obs_guar_res,
    obs_app1_biz: state.obs_app1_biz,
    obs_app2_biz: state.obs_app2_biz,
    obs_app3_biz: state.obs_app3_biz,
    obs_guar_emp: state.obs_guar_emp,
  };

  if (!updatedCase.modules) updatedCase.modules = {};
  
  const appIds = ['primary', 'co_1', 'co_2'];
  appIds.forEach((appId) => {
    if (updatedCase.applicants && updatedCase.applicants.some((a) => a.id === appId)) {
      if (!updatedCase.modules[appId]) {
        updatedCase.modules[appId] = emptyModules();
      }
      updatedCase.modules[appId].feedback = {
        status: 'completed',
        feedback: {
          items: {
            personalDetails: state[`fbPersonalDetails_${appId}`] || 'positive',
            residenceVerification: state[`fbResidenceVerification_${appId}`] || 'positive',
            telephoneVerification: state[`fbTelephoneVerification_${appId}`] || 'positive',
            incomeProof: state[`fbIncomeProof_${appId}`] || 'positive',
            itReturn: state[`fbItReturn_${appId}`] || 'positive',
            employerOffice: state[`fbEmployerOffice_${appId}`] || 'positive',
            placeOfBusiness: state[`fbPlaceOfBusiness_${appId}`] || 'na',
            bankDetails: state[`fbBankDetails_${appId}`] || 'positive',
            otherDetails: state[`fbOtherDetails_${appId}`] || 'positive',
          },
          overallFeedbackNote: state.fbOverallFeedbackNote || '',
          guarantorDetailsPresent: state.fbGuarantorDetailsPresent || 'no',
          guarantorName: state.fbGuarantorName || '',
          guarantorAddress: state.fbGuarantorAddress || '',
          guarantorVerified: state.fbGuarantorVerified || '',
          guarantorOpinion: state.fbGuarantorOpinion || '',
        }
      };
    }
  });

  if (!updatedCase.modules[applicantId]) {
    updatedCase.modules[applicantId] = emptyModules();
  }

  const appMods = updatedCase.modules[applicantId];

  appMods.general = {
    status: 'completed',
    general: {
      borrowerName: state.borrowerName,
      fatherHusbandName: state.fatherHusbandName,
      gender: state.gender,
      residentStatus: state.residentStatus,
      panNumber: state.panNumber,
      aadhaarNumber: state.aadhaarNumber,
      dateOfBirth: state.dateOfBirth,
      qualification: state.qualification,
      maritalStatus: state.maritalStatus,
      employmentType: mapEmploymentCategoryToType(state.employmentCategory),
      udinNumber: state.udinNumber,
      caName: state.caName,
      dateOfVerification: state.dateOfVerification,
      dateOfReportSubmission: state.dateOfReportSubmission,
    },
  };

  appMods.residence = {
    status: 'completed',
    residence: {
      givenAddress: state.givenAddress,
      presentAddress: state.presentAddress,
      addressTallied: state.addressTallied,
      stayConfirmed: state.stayConfirmed,
      stayingSince: state.stayingSince,
      tenureStatus: state.tenureStatus,
      rentAmount: state.rentAmount,
      houseType: state.houseType,
      structureType: state.structureType,
      plinthAreaSqft: state.plinthAreaSqft,
      localityType: state.localityType,
      landmark: state.landmark,
      city: state.city,
      pinCode: state.pinCode,
      telephoneNumber: state.telephoneNumber,
      mobileNumber: state.mobileNumber,
      contactPersonName: state.contactPersonName,
      contactPersonRelation: state.contactPersonRelation,
      livingStandard: state.livingStandard,
      accessibility: state.accessibility,
      numberOfDependents: state.numberOfDependents,
      visitDateTime: state.visitDateTime,
      namePlateSeen: state.namePlateSeen,
      namePlateMatches: state.namePlateMatches,
      houseLocked: state.houseLocked,
      locksReason: joinReportParts([
        state.locksA,
        state.locksB,
        state.locksC,
        state.locksD,
        state.locksE,
        state.locksF,
      ]) || state.locksReason,
      neighboursContacted: state.neighboursContacted,
      neighbourFeedback: state.neighbourFeedback,
      mismatchDetails: joinReportParts([
        state.mismatchA,
        state.mismatchB,
        state.mismatchC,
      ]) || state.mismatchDetails,
      residenceConfirmation: state.resDetailRemarks || state.residenceConfirmation,
      detailRemarks: state.resDetailRemarks || 'NO REMARKS',
      detailStatus: state.resDetailStatus || 'Positive',
      resVerifierRemarks: state.resVerifierRemarks,
      resSupervisorRemarks: state.resSupervisorRemarks,
    },
  };

  appMods.employment = {
    status: 'completed',
    employment: {
      employmentCategory: state.employmentCategory,
      companyName: state.companyName,
      companyAddress: state.companyAddress,
      workContact: state.workContact,
      designation: state.designation,
      natureOfBusiness: state.natureOfBusiness,
      officialEmailId: state.officialEmailId,
      companyWebsite: state.companyWebsite,
      nameBoardSighted: state.nameBoardSighted,
      detailsOfSighting: state.detailsOfSighting,
      metEmployee: state.metEmployee,
      employeesContacted: state.employeesContacted,
      employeeNotes: state.employeeNotes,
      businessRegistrationNumber: state.businessRegistrationNumber,
      registrationAuthority: state.registrationAuthority,
      yearsOfService: state.yearsOfService,
      addressConfirmedBy: state.addressConfirmedBy,
      landmark: state.employmentLandmark,
      officeOwnership: state.officeOwnership,
      proofsReceived: state.proofsReceived,
      yearOfEstablishment: state.yearOfEstablishment,
      typeOfFirm: state.typeOfFirm,
      lineOfBusiness: state.lineOfBusiness,
      termsOfEmployment: state.termsOfEmployment,
      supervisorDetails: state.supervisorDetails,
      visitingCardObtained: state.visitingCardObtained,
      supervisorRemarks: state.supervisorRemarks || 'NO REMARKS',
      supervisorStatus: state.supervisorStatus || 'Positive',
      changeLikelihood: state.changeLikelihood,
      visitingCardDetails: state.visitingCardDetails,
    },
  };

  appMods.pan = {
    status: 'completed',
    pan: {
      panNumber: state.panPortalNumber,
      statusOnPortal: state.panPortalStatus,
      nameOnPortal: state.panPortalName,
      portalTally: state.panPortalTally,
      portalMatchRemarks: state.panPortalMatchRemarks,
      finalStatus: state.panFinalStatus,
      genderMatching: state.panGenderMatching,
      verifierName: state.panVerifierName,
      verifierRemarks: state.panVerifierRemarks || 'VERIFIED NO ADVERSE FEATURES FOUND',
      supervisorName: state.panSupervisorName,
      supervisorRemarks: state.panSupervisorRemarks || 'VERIFIED NO ADVERSE FEATURES FOUND',
      detailRemarks: state.panDetailRemarks || 'NO REMARKS',
      detailStatus: state.panDetailStatus || 'Positive',
    },
  };

  appMods.salary = {
    status: 'completed',
    salary: {
      companyName: state.salaryCompanyName,
      designation: state.salaryDesignation,
      yearsOfService: state.salaryYearsOfService,
      serviceConfirmed: state.salaryServiceConfirmed,
      serviceTallyRemarks: state.salaryServiceTallyRemarks,
      grossMonthlyIncome: state.salaryGrossMonthlyIncome,
      monthlyAllowances: state.salaryMonthlyAllowances,
      deductions: state.salaryDeductions,
      netMonthlyTakeHome: state.salaryNetMonthlyTakeHome,
      form16Issued: state.salaryForm16Issued,
      payslipsAvailable: state.salaryPayslipsAvailable,
      bankStatementsAvailable: state.salaryBankStatementsAvailable,
      totalIncome: state.salaryTotalIncome,
      netTaxPayable: state.salaryNetTaxPayable,
      taxPaidRemarks: state.salaryTaxPaidRemarks,
      remarks: state.salaryTaxPaidRemarks,
    },
  };

  appMods.documents = {
    status: 'completed',
    documents: {
      sealOfOrganization: state.docSealOfOrganization,
      signatureOfAuthority: state.docSignatureOfAuthority,
      salarySlipDateAmount: state.docSalarySlipDateAmount,
      officeAddressCorrect: state.docOfficeAddressCorrect,
      otherDocName1: state.docOtherDocName1,
      otherDocTally1: state.docOtherDocTally1,
      otherDocName2: state.docOtherDocName2,
      otherDocTally2: state.docOtherDocTally2,
    },
  };

  appMods.business = {
    status: 'completed',
    business: {
      businessActivitySeen: state.obsBusinessActivitySeen,
      totalEmployees: state.obsEmployeesSeen,
      rawMaterialsSeen: state.obsEquipmentStockSeen,
      businessAmbience: state.obsBusinessAmbience,
      businessActivityLevel: state.obsActivityLevel,
      verifierName: state.obsVerifierName,
      verifierRemarks: state.obsVerifierRemarks || 'VERIFIED NO ADVERSE FEATURES FOUND',
      supervisorName: state.obsSupervisorName,
      supervisorRemarks: state.obsSupervisorRemarks || 'VERIFIED NO ADVERSE FEATURES FOUND',
      businessRemarks: state.obsNegativeRemarks || 'NO REMARKS',
      detailStatus: state.obsNegativeStatus || 'Positive',
    },
  };

  appMods.property = {
    status: 'completed',
    property: {
      addressOfProperty: state.propAddressOfProperty,
      addressMatchesApplication: state.propAddressMatchesApplication,
      landAreaSqft: state.propLandAreaSqft,
      boundEast: state.propBoundEast,
      boundWest: state.propBoundWest,
      boundNorth: state.propBoundNorth,
      boundSouth: state.propBoundSouth,
      boundaryMatch: state.propBoundaryMatch,
      areaMatch: state.propAreaMatch,
      constructionStatus: state.propConstructionStatus,
      stageOfConstruction: state.propStageOfConstruction,
      independentAccess: state.propIndependentAccess,
      independentAccessType: state.propIndependentAccessType,
      layoutApproved: state.propLayoutApproved,
      propertyLandmark: state.propPropertyLandmark,
      locationAccessibility: state.propLocationAccessibility,
      vehicleAccessType: state.propVehicleAccessType,
      neighborPropertyFeedback: state.propNeighborPropertyFeedback,
      propertyType: state.propPropertyType,
      propertyLocality: state.propPropertyLocality,
      ownershipType: state.propOwnershipType,
      buildingUsage: state.propBuildingUsage,
      visitDateTime: state.propVisitDateTime,
      builderName: state.propBuilderName,
      builderReputation: state.propBuilderReputation,
      builderSource: state.propBuilderSource,
      constructionStageDetail: state.propConstructionStageDetail,
      workInFullSwing: state.propWorkInFullSwing,
      likelyCompletionDate: state.propLikelyCompletionDate,
      ownerName: state.propOwnerName,
    },
  };

  appMods.evidence = {
    status: 'completed',
    evidence: {
      applicantPhotos: state.applicantPhotos,
      coApplicantPhotos: state.coApplicantPhotos,
      residencePhotos: state.residencePhotos,
      employmentPhotos: state.employmentPhotos,
      identityDocs: state.identityDocs,
      incomeDocs: state.incomeDocs,
      additionalDocs: state.additionalDocs,
    },
  };

  // Keep items-bearing feedback from the appIds loop (do not overwrite with flat fields).
  // Re-apply guarantor / overall note onto active applicant feedback if present.
  if (appMods.feedback?.feedback) {
    appMods.feedback.feedback.overallFeedbackNote = state.fbOverallFeedbackNote || '';
    appMods.feedback.feedback.guarantorDetailsPresent = state.fbGuarantorDetailsPresent || 'no';
    appMods.feedback.feedback.guarantorName = state.fbGuarantorName || '';
    appMods.feedback.feedback.guarantorAddress = state.fbGuarantorAddress || '';
    appMods.feedback.feedback.guarantorVerified = state.fbGuarantorVerified || '';
    appMods.feedback.feedback.guarantorOpinion = state.fbGuarantorOpinion || '';
  }

  const statusKeys = [
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
  for (const key of statusKeys) {
    if (appMods[key]) {
      appMods[key] = {
        ...appMods[key],
        status: deriveModuleStatus(updatedCase, applicantId, key),
      };
    }
  }

  // Persist start-page co-applicant names when saving from primary
  if (applicantId === 'primary' || !applicantId) {
    const syncCoName = (coId, name) => {
      if (!updatedCase.applicants?.some((a) => a.id === coId)) return;
      if (!updatedCase.modules[coId]) updatedCase.modules[coId] = emptyModules();
      const mod = updatedCase.modules[coId];
      const existing = mod.general?.general ?? {};
      mod.general = {
        ...(mod.general || {}),
        status: mod.general?.status || 'not_started',
        general: {
          ...existing,
          borrowerName: (name ?? existing.borrowerName ?? '').toString(),
        },
      };
    };
    syncCoName('co_1', state.coApplicant1Name);
    syncCoName('co_2', state.coApplicant2Name);
  }

  updatedCase.status = deriveCaseStatus(updatedCase);
  return updatedCase;
}

/** Minimal 1×1 PNG for fill-test evidence uploads (passes client + server file checks). */
const TEST_EVIDENCE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function makeTestEvidenceFile(name) {
  return {
    id: `test-${name.replace(/\W+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    size: 68,
    type: 'image/png',
    uploadedAt: new Date().toISOString(),
    dataUrl: TEST_EVIDENCE_PNG,
  };
}

const TEST_APPLICANT_PROFILES = [
  {
    borrowerName: 'RAVI KUMAR',
    fatherHusbandName: 'SURESH KUMAR',
    gender: 'male',
    // 4th char must be P for individuals
    panNumber: 'ABCPD1234F',
    aadhaarNumber: '234567890123',
    dateOfBirth: '1995-08-15',
    mobileNumber: '9876543210',
    contactPersonName: 'RAVI KUMAR',
    panPortalNumber: 'ABCPD1234F',
    panPortalName: 'RAVI KUMAR',
    designation: 'Senior Software Engineer',
    salaryDesignation: 'Senior Software Engineer',
    salaryGrossMonthlyIncome: '120000',
    salaryNetMonthlyTakeHome: '110000',
    salaryTotalIncome: '1440000',
  },
  {
    borrowerName: 'PRIYA KUMAR',
    fatherHusbandName: 'RAVI KUMAR',
    gender: 'female',
    panNumber: 'FGHPJ5678K',
    aadhaarNumber: '345678901234',
    dateOfBirth: '1997-03-22',
    mobileNumber: '9876543211',
    contactPersonName: 'PRIYA KUMAR',
    panPortalNumber: 'FGHPJ5678K',
    panPortalName: 'PRIYA KUMAR',
    designation: 'Accountant',
    salaryDesignation: 'Accountant',
    salaryGrossMonthlyIncome: '65000',
    salaryNetMonthlyTakeHome: '58000',
    salaryTotalIncome: '780000',
  },
  {
    borrowerName: 'AMIT SHARMA',
    fatherHusbandName: 'VIJAY SHARMA',
    gender: 'male',
    panNumber: 'KLMNP9012P',
    aadhaarNumber: '456789012345',
    dateOfBirth: '1990-11-08',
    mobileNumber: '9876543212',
    contactPersonName: 'AMIT SHARMA',
    panPortalNumber: 'KLMNP9012P',
    panPortalName: 'AMIT SHARMA',
    designation: 'Operations Manager',
    salaryDesignation: 'Operations Manager',
    salaryGrossMonthlyIncome: '90000',
    salaryNetMonthlyTakeHome: '82000',
    salaryTotalIncome: '1080000',
  },
];

function fillFeedbackKeysForApplicants(applicantCount) {
  const ids = ['primary'];
  if (applicantCount >= 2) ids.push('co_1');
  if (applicantCount >= 3) ids.push('co_2');
  const keys = [
    'PersonalDetails',
    'ResidenceVerification',
    'TelephoneVerification',
    'IncomeProof',
    'ItReturn',
    'EmployerOffice',
    'PlaceOfBusiness',
    'BankDetails',
    'OtherDetails',
  ];
  const out = {};
  ids.forEach((appId) => {
    keys.forEach((k) => {
      out[`fb${k}_${appId}`] = k === 'PlaceOfBusiness' ? 'na' : 'positive';
    });
  });
  return out;
}

function fillFormStateWithTestData(user, state, profileIndex = 0, applicantCount = 1) {
  const profile = TEST_APPLICANT_PROFILES[profileIndex % TEST_APPLICANT_PROFILES.length];
  const co1 = TEST_APPLICANT_PROFILES[1];
  const co2 = TEST_APPLICANT_PROFILES[2];
  return {
    ...state,
    loanType: 'Home Loan',
    bankName: 'Bank of India',
    branchName: 'Mumbai - Andheri East',
    loanAmount: '2500000',
    borrowerName: profile.borrowerName,
    coApplicant1Name: applicantCount >= 2 ? co1.borrowerName : '',
    coApplicant2Name: applicantCount >= 3 ? co2.borrowerName : '',
    fatherHusbandName: profile.fatherHusbandName,
    gender: profile.gender,
    residentStatus: 'Resident',
    panNumber: profile.panNumber,
    aadhaarNumber: profile.aadhaarNumber,
    dateOfBirth: profile.dateOfBirth,
    qualification: 'Graduate',
    maritalStatus: 'Married',
    employmentType: 'Salaried',
    udinNumber: '26222863ABCDEF0001',
    caName: user?.verified_by || 'PARVEZ MOHAMMED',
    dateOfVerification: todayISO(),
    dateOfReportSubmission: todayISO(),
    bankReferenceNo: 'BOI-REF-2026-001',
    ddaReferenceNo: 'DDA-2026-001',
    dateOfReceiptOfFile: todayISO(),
    particularsVerdict: 'Positive',
    overallOpinion: 'Positive',
    ...fillFeedbackKeysForApplicants(applicantCount),
    givenAddress: 'Flat 402, Sunrise Apartments, MG Road, Andheri East, Mumbai - 400069',
    presentAddress: 'Flat 402, Sunrise Apartments, MG Road, Andheri East, Mumbai - 400069',
    addressTallied: 'yes',
    stayConfirmed: 'yes',
    stayingSince: '6',
    tenureStatus: 'Owned',
    rentAmount: '',
    houseType: 'Flat',
    structureType: 'Pucca',
    plinthAreaSqft: '1200',
    localityType: 'Residential',
    landmark: "Opposite St. Mary's School",
    city: 'Mumbai',
    pinCode: '400069',
    telephoneNumber: '02226841234',
    mobileNumber: profile.mobileNumber,
    contactPersonName: profile.contactPersonName,
    contactPersonRelation: 'Self',
    livingStandard: 'Upper Middle',
    accessibility: 'Easy',
    numberOfDependents: '2',
    visitDateTime: `${todayISO()}T10:30`,
    namePlateSeen: 'yes',
    namePlateMatches: 'yes',
    houseLocked: 'no',
    locksReason: '',
    locksA: '',
    locksB: '',
    locksC: '',
    locksD: '',
    locksE: '',
    locksF: '',
    neighboursContacted: 'yes',
    neighbourFeedback: 'Confirm stay and good conduct',
    mismatchDetails: '',
    mismatchA: '',
    mismatchB: '',
    mismatchC: '',
    residenceConfirmation: 'NO REMARKS',
    resDetailRemarks: 'NO REMARKS',
    resDetailStatus: 'Positive',
    resVerifierRemarks: 'Amit Singh - Verified: no negative observations found.',
    resSupervisorRemarks: 'Rajesh Gupta - Checked and approved.',
    changeLikelihood: 'No change anticipated (Permanent contract)',
    visitingCardDetails: 'Employee visiting card obtained, matching Tech Enterprises.',
    employmentCategory: 'Salaried',
    companyName: 'Infotech Solutions Pvt Ltd',
    companyAddress: 'Tower B, 7th Floor, Hiranandani Business Park, Powai, Mumbai - 400076',
    workContact: '02240501234',
    designation: profile.designation,
    yearsOfService: '4',
    natureOfBusiness: 'Servicing',
    officialEmailId: 'hr@infotechsolutions.com',
    companyWebsite: 'www.infotechsolutions.com',
    nameBoardSighted: 'yes',
    detailsOfSighting: 'Company logo displayed at entrance',
    metEmployee: 'yes',
    employeesContacted: 'HR Manager',
    employeeNotes: 'Confirmed details',
    businessRegistrationNumber: 'U72900MH2019PTC321456',
    registrationAuthority: 'MCA',
    addressConfirmedBy: 'HR Manager',
    employmentLandmark: 'Near Powai Lake',
    officeOwnership: 'Rented',
    proofsReceived: 'Salary slip, ID card',
    yearOfEstablishment: '2019',
    typeOfFirm: 'Private Limited',
    lineOfBusiness: 'IT Services',
    termsOfEmployment: 'Permanent',
    supervisorDetails: 'Anita Shah - 9876501234',
    visitingCardObtained: 'yes',
    supervisorRemarks: 'NO REMARKS',
    supervisorStatus: 'Positive',
    panPortalNumber: profile.panPortalNumber,
    panPortalStatus: 'Active',
    panPortalName: profile.panPortalName,
    panPortalTally: 'yes',
    panPortalMatchRemarks: '100% Match',
    panFinalStatus: 'confirmed',
    panGenderMatching: 'yes',
    panVerifierName: user?.verified_by || 'SHAIK FAREED',
    panVerifierRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
    panSupervisorName: user?.verified_by || 'SHAIK FAREED',
    panSupervisorRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
    panDetailRemarks: 'NO REMARKS',
    panDetailStatus: 'Positive',
    salaryCompanyName: 'Infotech Solutions Pvt Ltd',
    salaryDesignation: profile.salaryDesignation,
    salaryYearsOfService: '4',
    salaryServiceConfirmed: 'yes',
    salaryServiceTallyRemarks: 'Confirmed with salary slip',
    salaryGrossMonthlyIncome: profile.salaryGrossMonthlyIncome,
    salaryForm16Issued: 'yes',
    salaryPayslipsAvailable: 'yes',
    salaryBankStatementsAvailable: 'yes',
    salaryTotalIncome: 'yes',
    salaryTaxPaidRemarks: 'Tax deducted at source',
    docSealOfOrganization: 'tallied',
    docSignatureOfAuthority: 'tallied',
    docSalarySlipDateAmount: 'tallied',
    docOfficeAddressCorrect: 'tallied',
    obsBusinessActivitySeen: 'Yes',
    obsEmployeesSeen: '10 employees present',
    obsEquipmentStockSeen: 'Adequate tools/stock seen',
    obsBusinessAmbience: 'Professional and well maintained',
    obsActivityLevel: 'High Activity',
    obsVerifierName: user?.verified_by || 'SHAIK FAREED',
    obsVerifierRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
    obsSupervisorName: user?.verified_by || 'SHAIK FAREED',
    obsSupervisorRemarks: 'VERIFIED NO ADVERSE FEATURES FOUND',
    obsNegativeRemarks: 'NO REMARKS',
    obsNegativeStatus: 'Positive',
    propAddressOfProperty: 'Plot 17, Green Valley Township, Sarjapur Road, Bengaluru - 560035',
    propAddressMatchesApplication: 'yes',
    propLandAreaSqft: '2400',
    propBoundEast: 'Plot 18',
    propBoundWest: 'Road',
    propBoundNorth: 'Plot 16',
    propBoundSouth: 'Plot 32',
    propBoundaryMatch: 'yes',
    propAreaMatch: 'yes',
    propConstructionStatus: 'Ready built Flat',
    propStageOfConstruction: 'Roof level',
    propIndependentAccess: 'Yes',
    propIndependentAccessType: 'Four wheeler Road',
    propLayoutApproved: 'yes',
    propPropertyLandmark: 'Near Sarjapur Police Station',
    propLocationAccessibility: 'good',
    propVehicleAccessType: 'Four Wheeler',
    propNeighborPropertyFeedback: 'Clean title and approved layout',
    propPropertyType: 'Residential',
    propPropertyLocality: 'Upper Middle Class',
    propOwnershipType: 'Free hold',
    propBuildingUsage: 'Residential',
    propVisitDateTime: todayISO(),
    propBuilderName: '',
    propBuilderReputation: '',
    propBuilderSource: '',
    propConstructionStageDetail: '',
    propWorkInFullSwing: '',
    propOwnerName: 'RAVI KUMAR',
    propLikelyCompletionDate: '',
    fbOverallFeedbackNote: 'Due diligence outcome is positive and satisfactory.',
    fbGuarantorDetailsPresent: 'no',
    fbGuarantorName: '',
    fbGuarantorAddress: '',
    fbGuarantorVerified: '',
    fbGuarantorOpinion: '',
    // Evidence only on primary fill (required for submit)
    ...(profileIndex === 0
      ? {
          applicantPhotos: [makeTestEvidenceFile('applicant-photo.png')],
          residencePhotos: [makeTestEvidenceFile('residence-photo.png')],
          identityDocs: [makeTestEvidenceFile('identity-doc.png')],
          incomeDocs: [makeTestEvidenceFile('income-doc.png')],
          employmentPhotos: [makeTestEvidenceFile('employment-photo.png')],
          coApplicantPhotos:
            applicantCount > 1 ? [makeTestEvidenceFile('co-applicant-photo.png')] : [],
          additionalDocs: [],
        }
      : {}),
  };
}

function buildTestCaseWithApplicants(user, existingCase, casesMap, applicantCount) {
  const capped = Math.min(Math.max(1, applicantCount), 3);
  const applicants = [{ id: 'primary', isPrimary: true }];
  if (capped >= 2) applicants.push({ id: 'co_1', isPrimary: false });
  if (capped >= 3) applicants.push({ id: 'co_2', isPrimary: false });

  let currentCase = existingCase;
  if (!currentCase) {
    const newId = generateCaseId(casesMap);
    currentCase = {
      id: newId,
      loanType: 'Home Loan',
      bankName: DEFAULT_BANK_NAME,
      branchName: 'Mumbai - Andheri East',
      loanAmount: '2500000',
      createdAt: new Date().toISOString(),
      status: 'draft',
      applicants: [{ id: 'primary', isPrimary: true }],
      activeApplicantId: 'primary',
      modules: { primary: emptyModules() },
    };
  }

  currentCase = {
    ...currentCase,
    applicants,
    activeApplicantId: 'primary',
    modules: { ...(currentCase.modules || {}) },
  };
  applicants.forEach((a) => {
    if (!currentCase.modules[a.id]) currentCase.modules[a.id] = emptyModules();
  });
  Object.keys(currentCase.modules).forEach((key) => {
    if (!applicants.some((a) => a.id === key)) delete currentCase.modules[key];
  });

  let nextCase = currentCase;
  for (let i = 0; i < capped; i++) {
    const appId = applicants[i].id;
    const filled = fillFormStateWithTestData(user, initialFormState, i, capped);
    nextCase = mapFormStateToCase(filled, nextCase, appId);
  }
  nextCase.activeApplicantId = 'primary';
  nextCase.status = 'in_progress';
  return nextCase;
}

export default function BoiHousingVerificationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    caseData,
    cases,
    loadCaseData,
    applicants,
    activeApplicantId,
    setActiveApplicant,
    isSubmittingReport,
    setIsSubmittingReport,
  } = useBoiVerification();

  const [formState, setFormState] = useState(initialFormState);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRefs = useRef({});

  const { saveDraft, savingDraft } = useExecutiveDraft('boi-housing', {
    onRestore: ({ form }) => {
      // handleSaveDraft persists `{ caseData: nextCase }`, so unwrap it the
      // same way BoiModuleTopBar does — otherwise loadCaseData/mapCaseToFormState
      // receive the wrapper object instead of the actual case shape.
      const restored = form?.caseData || form;
      if (restored?.modules) {
        loadCaseData(restored);
        setFormState(mapCaseToFormState(restored, restored.activeApplicantId || 'primary'));
      }
    },
  });

  // Sync state with caseData changes
  useEffect(() => {
    if (caseData && activeApplicantId) {
      setFormState(mapCaseToFormState(caseData, activeApplicantId));
    }
  }, [caseData, activeApplicantId]);

  const [fieldErrors, setFieldErrors] = useState({});

  // Inline errors belong to a specific step + applicant; drop them whenever
  // either changes so stale red borders don't leak into an unrelated section.
  useEffect(() => {
    setFieldErrors({});
  }, [currentStep, activeApplicantId]);

  const updateField = (key, val) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
    // Clear the inline error for this field as soon as the user edits it.
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const isBusinessCategory = isBizCat(formState.employmentCategory);
  const isEmployed = isEmployedCategory(formState.employmentCategory);
  const isSalaryApplicable = isSalaryCategory(formState.employmentCategory);
  const isPropertyApplicable = isPropertyLoanType(formState.loanType);

  const sections = useMemo(() => {
    const isPrimary = activeApplicantId === 'primary' || !activeApplicantId;
    const list = [
      { key: 'start_page', title: 'Start Page', icon: Landmark, applicable: isPrimary },
      { key: 'general', title: 'General Details', icon: ClipboardList, applicable: true },
      { key: 'residence', title: 'Residence', icon: Home, applicable: true },
      { key: 'employment', title: 'Employment', icon: Briefcase, applicable: isEmployed },
      { key: 'pan', title: 'PAN', icon: IdCard, applicable: true },
      { key: 'salary', title: 'Salary / Form-16', icon: Receipt, applicable: isSalaryApplicable },
      { key: 'property', title: 'Property', icon: MapPin, applicable: isPrimary && isPropertyApplicable },
      { key: 'business', title: 'Observations', icon: Building2, applicable: isBusinessCategory },
      { key: 'documents', title: 'Documents', icon: FolderCheck, applicable: isSalaryApplicable },
      { key: 'evidence', title: 'Evidence', icon: ImageUp, applicable: isPrimary },
    ];
    return list.filter((s) => s.applicable);
  }, [activeApplicantId, isEmployed, isSalaryApplicable, isBusinessCategory, isPropertyApplicable]);

  // Adjust currentStep if it goes out of bounds when sections change
  useEffect(() => {
    if (currentStep >= sections.length) {
      setCurrentStep(Math.max(0, sections.length - 1));
    }
  }, [sections, currentStep]);

  const validateCurrentStep = useCallback(() => {
    const sectionKey = sections[currentStep]?.key;
    if (!sectionKey || sectionKey === 'start_page') {
      setFieldErrors({});
      return true;
    }
    const moduleKey = sectionKey;
    let currentCase = caseData;
    if (!currentCase) {
      toast.error('Please fill Case Details first.');
      return false;
    }
    const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
    const label = labelApplicants(nextCase.applicants || []).find((a) => a.id === (activeApplicantId || 'primary'))?.label || 'Applicant';
    const errors = validateApplicantModule(nextCase, activeApplicantId || 'primary', moduleKey, label);
    const errorMap = validateApplicantModuleFieldErrors(nextCase, activeApplicantId || 'primary', moduleKey);
    setFieldErrors(errorMap);
    if (errors.length) {
      errors.slice(0, 5).forEach((e) => toast.error(e));
      return false;
    }
    return true;
  }, [sections, currentStep, caseData, formState, activeApplicantId]);

  const handleNext = () => {
    if (currentStep < sections.length - 1) {
      if (!validateCurrentStep()) return;
      let currentCase = caseData;
      if (currentCase) {
        const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
        loadCaseData(nextCase);
      }
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      let currentCase = caseData;
      if (currentCase) {
        const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
        loadCaseData(nextCase);
      }
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSwitchApplicant = (targetId) => {
    if (targetId === activeApplicantId) return;
    let currentCase = caseData;
    if (!currentCase) {
      const newId = generateCaseId(cases);
      currentCase = {
        id: newId,
        loanType: formState.loanType,
        bankName: formState.bankName || DEFAULT_BANK_NAME,
        branchName: formState.branchName,
        loanAmount: formState.loanAmount,
        createdAt: new Date().toISOString(),
        status: 'draft',
        applicants: [{ id: 'primary', isPrimary: true }],
        activeApplicantId: 'primary',
        modules: { primary: emptyModules() },
      };
    }
    const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
    const label = labelApplicants(nextCase.applicants || []).find((a) => a.id === (activeApplicantId || 'primary'))?.label || 'Applicant';
    const sectionKey = sections[currentStep]?.key;
    if (sectionKey && sectionKey !== 'start_page') {
      const errors = validateApplicantModule(nextCase, activeApplicantId || 'primary', sectionKey, label);
      if (errors.length) {
        const leave = window.confirm('Current section has incomplete required fields. Leave anyway?');
        if (!leave) return;
      }
    }
    nextCase.activeApplicantId = targetId;
    loadCaseData(nextCase);
    setActiveApplicant(targetId);
    setCurrentStep(0);
  };

  const handleSetApplicantsCount = (count) => {
    const capped = Math.min(Math.max(1, count), MAX_APPLICANTS);
    let currentCase = caseData;
    if (!currentCase) {
      const newId = generateCaseId(cases);
      currentCase = {
        id: newId,
        loanType: formState.loanType,
        bankName: formState.bankName || DEFAULT_BANK_NAME,
        branchName: formState.branchName,
        loanAmount: formState.loanAmount,
        createdAt: new Date().toISOString(),
        status: 'draft',
        applicants: [{ id: 'primary', isPrimary: true }],
        activeApplicantId: 'primary',
        modules: { primary: emptyModules() },
      };
    }
    const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');

    const nextApplicants = [...nextCase.applicants];
    if (nextApplicants.length > capped) {
      const ok = window.confirm(`Reduce applicants to ${capped}? Extra co-applicant data will be removed.`);
      if (!ok) return;
    }
    if (nextApplicants.length < capped) {
      for (let i = nextApplicants.length; i < capped; i++) {
        const coId = `co_${i}`;
        nextApplicants.push({ id: coId, isPrimary: false });
        if (!nextCase.modules[coId]) {
          nextCase.modules[coId] = emptyModules();
        }
      }
    } else if (nextApplicants.length > capped) {
      nextApplicants.splice(capped);
      Object.keys(nextCase.modules).forEach((key) => {
        if (key !== 'primary' && !nextApplicants.some((a) => a.id === key)) {
          delete nextCase.modules[key];
        }
      });
    }
    nextCase.applicants = nextApplicants;
    if (!nextApplicants.some((a) => a.id === nextCase.activeApplicantId)) {
      nextCase.activeApplicantId = 'primary';
      setActiveApplicant('primary');
    }
    loadCaseData(nextCase);
  };

  const handleAddCoApplicant = () => {
    if ((applicants?.length || 1) >= MAX_APPLICANTS) {
      toast.error(`Maximum ${MAX_APPLICANTS} applicants allowed.`);
      return;
    }
    handleSetApplicantsCount((applicants?.length || 1) + 1);
    setCurrentStep(0);
  };

  const handleRemoveApplicant = (targetId) => {
    if (targetId === 'primary') return;
    const ok = window.confirm('Remove this co-applicant and their verification data?');
    if (!ok) return;
    let currentCase = caseData;
    if (!currentCase) return;
    const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
    nextCase.applicants = nextCase.applicants.filter((a) => a.id !== targetId);
    delete nextCase.modules[targetId];
    const primaryId = nextCase.applicants.find((a) => a.isPrimary)?.id || 'primary';
    nextCase.activeApplicantId = primaryId;
    loadCaseData(nextCase);
    setActiveApplicant(primaryId);
    setCurrentStep(0);
  };

  const handleSaveDraft = async () => {
    let currentCase = caseData;
    if (!currentCase) {
      const newId = generateCaseId(cases);
      currentCase = {
        id: newId,
        loanType: formState.loanType,
        bankName: formState.bankName || DEFAULT_BANK_NAME,
        branchName: formState.branchName,
        loanAmount: formState.loanAmount,
        createdAt: new Date().toISOString(),
        status: 'draft',
        applicants: [{ id: 'primary', isPrimary: true }],
        activeApplicantId: 'primary',
        modules: { primary: emptyModules() },
      };
    }
    const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
    nextCase.status = 'draft';
    loadCaseData(nextCase);
    
    await saveDraft({ caseData: nextCase });
    toast.success('Draft saved successfully.');
  };

  const handleFillTestData = () => {
    // Always fill exactly the applicant count already selected on the Start
    // Page, instead of auto-cycling 1 -> 2 -> 3 on every click.
    const applicantCount = Math.min(Math.max(applicants?.length || 1, 1), MAX_APPLICANTS);

    const nextCase = buildTestCaseWithApplicants(
      { verified_by: 'PARVEZ MOHAMMED' },
      caseData,
      cases,
      applicantCount
    );
    loadCaseData(nextCase);
    setActiveApplicant('primary');
    setFormState(mapCaseToFormState(nextCase, 'primary'));
    setCurrentStep(0);

    const names = [TEST_APPLICANT_PROFILES[0].borrowerName];
    if (applicantCount >= 2) names.push(TEST_APPLICANT_PROFILES[1].borrowerName);
    if (applicantCount >= 3) names.push(TEST_APPLICANT_PROFILES[2].borrowerName);
    toast.success(`Test data: ${applicantCount} applicant(s) — ${names.join(', ')}`);
  };

  const handleFiles = useCallback(async (categoryKey, files, allowed) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const added = [];
    for (const file of list) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 10 MB limit.`);
        continue;
      }
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: unsupported format.`);
        continue;
      }
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error(`Failed to read "${file.name}"`));
          reader.readAsDataURL(file);
        });
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          dataUrl,
        });
      } catch (err) {
        toast.error(err.message);
      }
    }
    if (added.length) {
      setFormState((prev) => ({
        ...prev,
        [categoryKey]: [...(prev[categoryKey] || []), ...added],
      }));
      toast.success(`${added.length} file${added.length > 1 ? 's' : ''} added.`);
    }
  }, []);

  const removeFile = (categoryKey, fileId) => {
    updateField(
      categoryKey,
      (formState[categoryKey] || []).filter((f) => f.id !== fileId)
    );
  };

  const handleSubmitReport = useCallback(async () => {
    if (isSubmittingReport) return;
    let currentCase = caseData;
    if (!currentCase) {
      toast.error('No case data. Please fill in the Case Details first.');
      return;
    }
    const finalCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
    const errors = validateBoiHousingCase(finalCase);
    if (errors.length) {
      errors.slice(0, 8).forEach((e) => toast.error(e));
      if (errors.length > 8) toast.error(`…and ${errors.length - 8} more issue(s)`);
      return;
    }
    const checklist = buildSubmitChecklist(finalCase);
    const incomplete = checklist.filter((c) => !c.complete);
    if (incomplete.length) {
      const summary = incomplete
        .map((c) => `${c.label}: ${c.modules.filter((m) => m.status !== 'completed').map((m) => m.label).join(', ')}`)
        .join('\n');
      toast.error('Cannot submit — complete all applicants first.');
      window.alert(`Incomplete verification:\n${summary}`);
      return;
    }
    const n = finalCase.applicants?.length || 1;
    const names = (finalCase.applicants || [])
      .map((a) => finalCase.modules?.[a.id]?.general?.general?.borrowerName || a.id)
      .join(', ');
    const confirmed = window.confirm(
      `Submit verification for ${n} applicant(s) for admin approval?\n\n${names}\nLoan: ${finalCase.loanType} · ₹${finalCase.loanAmount}\n\nYou cannot edit after submit.`
    );
    if (!confirmed) return;

    setIsSubmittingReport(true);
    loadCaseData(finalCase);
    try {
      await new Promise((r) => setTimeout(r, 300)); // let DOM update
      
      const files = [];
      const EVIDENCE_KEYS = ['applicantPhotos', 'coApplicantPhotos', 'residencePhotos',
        'employmentPhotos', 'identityDocs', 'incomeDocs', 'additionalDocs'];
      
      const dataURLtoBlob = (dataurl) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      for (const app of finalCase.applicants) {
        const modules = finalCase.modules[app.id];
        const ev = modules?.evidence?.evidence;
        if (ev) {
          for (const key of EVIDENCE_KEYS) {
            const list = ev[key] || [];
            list.forEach(fileObj => {
              if (fileObj.dataUrl) {
                try {
                  const blob = dataURLtoBlob(fileObj.dataUrl);
                  files.push(new File([blob], fileObj.name, { type: fileObj.type }));
                } catch (e) {
                  console.error("Failed to parse dataurl for", fileObj.name, e);
                }
              }
            });
          }
        }
      }

      const sanitizeCaseForUpload = (caseObj) => {
        const sanitized = JSON.parse(JSON.stringify(caseObj));
        for (const appId of Object.keys(sanitized.modules ?? {})) {
          const evMod = sanitized.modules[appId]?.evidence?.evidence;
          if (evMod) {
            for (const key of EVIDENCE_KEYS) {
              if (Array.isArray(evMod[key])) {
                evMod[key] = evMod[key].map(({ dataUrl: _drop, ...rest }) => rest);
              }
            }
          }
        }
        return sanitized;
      };

      const sanitizedCase = sanitizeCaseForUpload(finalCase);

      await executiveAPI.generateExecutiveReport('boi-housing', sanitizedCase, files);
      toast.success('Report submitted for admin approval!');
      navigate(executiveReportsPath(user));
    } catch (err) {
      console.error('[handleSubmitReport]', err);
      toast.error(apiErrorMessage(err, 'Failed to submit report. Please try again.'));
    } finally {
      setIsSubmittingReport(false);
    }
  }, [isSubmittingReport, caseData, formState, activeApplicantId, setIsSubmittingReport, loadCaseData, navigate, user]);

  const renderCurrentStep = () => {
    const activeSection = sections[currentStep]?.key;
    if (activeSection === 'start_page') {
      const getApplicantName = (appId) => {
        if (appId === 'primary') return formState.borrowerName;
        if (appId === 'co_1') return formState.coApplicant1Name;
        if (appId === 'co_2') return formState.coApplicant2Name;
        return '';
      };

      const setApplicantName = (appId, val) => {
        if (appId === 'primary') updateField('borrowerName', val);
        else if (appId === 'co_1') updateField('coApplicant1Name', val);
        else if (appId === 'co_2') updateField('coApplicant2Name', val);
      };

      const SUMMARY_ITEMS = [
        { key: 'personalDetails', label: 'Personal Details' },
        { key: 'residenceVerification', label: 'Residence Verification' },
        { key: 'telephoneVerification', label: 'Telephone Verification' },
        { key: 'incomeProof', label: 'Income Proof' },
        { key: 'itReturn', label: 'IT Return' },
        { key: 'employerOffice', label: 'Employer Office' },
        { key: 'placeOfBusiness', label: 'Place of Business' },
        { key: 'bankDetails', label: 'Bank Details' },
        { key: 'otherDetails', label: 'Other Details' }
      ];

      return (
        <div className="space-y-6 text-left">
          {/* 1st Question: Applicants count & names */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">1. Number of Applicants & Names</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <BoiFormField label="Number of Applicants" required>
                <select
                  className={boiSelectClass}
                  value={applicants.length}
                  onChange={(e) => handleSetApplicantsCount(parseInt(e.target.value, 10))}
                >
                  <option value={1}>1 Applicant</option>
                  <option value={2}>2 Applicants</option>
                  <option value={3}>3 Applicants</option>
                </select>
              </BoiFormField>
              <BoiFormField label="Primary Applicant Name (UPPERCASE ONLY)" required>
                <input
                  className={`${boiInputClass} uppercase`}
                  placeholder="e.g. MOHAN MOURYA"
                  value={getApplicantName('primary')}
                  onChange={(e) => setApplicantName('primary', e.target.value.toUpperCase())}
                />
              </BoiFormField>
              {applicants.length >= 2 && (
                <BoiFormField label="Co-Applicant 1 Name (UPPERCASE ONLY)" required>
                  <input
                    className={`${boiInputClass} uppercase`}
                    placeholder="e.g. PANKAJ KUMAR"
                    value={getApplicantName('co_1')}
                    onChange={(e) => setApplicantName('co_1', e.target.value.toUpperCase())}
                  />
                </BoiFormField>
              )}
              {applicants.length >= 3 && (
                <BoiFormField label="Co-Applicant 2 Name (UPPERCASE ONLY)" required>
                  <input
                    className={`${boiInputClass} uppercase`}
                    placeholder="e.g. KORIPALLI SRINIVAS"
                    value={getApplicantName('co_2')}
                    onChange={(e) => setApplicantName('co_2', e.target.value.toUpperCase())}
                  />
                </BoiFormField>
              )}
            </div>
          </div>

          {/* 2nd Question: Verification Summary Radio Grids */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4 overflow-x-auto">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">2. Verification Summary Table</h2>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Verification Item</th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">Primary App</th>
                  {applicants.length >= 2 && <th className="px-4 py-2 text-center font-semibold text-gray-700">Co-App 1</th>}
                  {applicants.length >= 3 && <th className="px-4 py-2 text-center font-semibold text-gray-700">Co-App 2</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {SUMMARY_ITEMS.map((item) => (
                  <tr key={item.key}>
                    <td className="px-4 py-2 font-medium text-gray-900">{item.label}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        {['positive', 'negative', 'na'].map((opt) => (
                          <label key={opt} className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name={`summary_primary_${item.key}`}
                              value={opt}
                              checked={formState[`fb${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}_primary`] === opt}
                              onChange={() => updateField(`fb${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}_primary`, opt)}
                              className="text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-xs uppercase">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    {applicants.length >= 2 && (
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-2">
                          {['positive', 'negative', 'na'].map((opt) => (
                            <label key={opt} className="inline-flex items-center gap-1">
                              <input
                                type="radio"
                                name={`summary_co_1_${item.key}`}
                                value={opt}
                                checked={formState[`fb${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}_co_1`] === opt}
                                onChange={() => updateField(`fb${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}_co_1`, opt)}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs uppercase">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    )}
                    {applicants.length >= 3 && (
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-2">
                          {['positive', 'negative', 'na'].map((opt) => (
                            <label key={opt} className="inline-flex items-center gap-1">
                              <input
                                type="radio"
                                name={`summary_co_2_${item.key}`}
                                value={opt}
                                checked={formState[`fb${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}_co_2`] === opt}
                                onChange={() => updateField(`fb${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}_co_2`, opt)}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs uppercase">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3rd Question: Particulars & Overall Opinion */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">3. Overall Opinions & Visit Date</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <BoiFormField label="Particulars Verdict" required>
                <div className="flex gap-4 mt-1">
                  {['Positive', 'Negative', 'Not Applicable'].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="particularsVerdict"
                        value={opt}
                        checked={formState.particularsVerdict === opt}
                        onChange={() => updateField('particularsVerdict', opt)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </BoiFormField>
              <BoiFormField label="Overall Final View/Opinion" required>
                <div className="flex gap-4 mt-1">
                  {['Positive', 'Negative', 'Not Satisfactory'].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="overallOpinion"
                        value={opt}
                        checked={formState.overallOpinion === opt}
                        onChange={() => updateField('overallOpinion', opt)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </BoiFormField>
              <BoiFormField label="Date & Time Visit">
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                  value="Auto-generated at report creation time"
                />
              </BoiFormField>
            </div>
          </div>

          {/* 4th & 5th & 6th Question: UDIN & Metadata fields */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">4, 5 & 6. UDIN & Bank Metadata Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <BoiFormField label="CA Registration Name" required>
                <input
                  className={boiInputClass}
                  placeholder="e.g. PARVEZ MOHAMMED"
                  value={formState.caName}
                  onChange={(e) => updateField('caName', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="UDIN Number" required>
                <input
                  className={boiInputClass}
                  placeholder="e.g. 26222863NUGFLF6824"
                  value={formState.udinNumber}
                  onChange={(e) => updateField('udinNumber', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="Date of Verification" required>
                <input
                  type="date"
                  className={boiInputClass}
                  value={formState.dateOfVerification}
                  onChange={(e) => updateField('dateOfVerification', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="Date of Report Submission" required>
                <input
                  type="date"
                  className={boiInputClass}
                  value={formState.dateOfReportSubmission}
                  onChange={(e) => updateField('dateOfReportSubmission', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="Bank Reference No" required>
                <input
                  className={boiInputClass}
                  placeholder="e.g. Ref-12345"
                  value={formState.bankReferenceNo}
                  onChange={(e) => updateField('bankReferenceNo', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="DDA Reference No" required>
                <input
                  className={boiInputClass}
                  placeholder="e.g. DDA-2026-001"
                  value={formState.ddaReferenceNo}
                  onChange={(e) => updateField('ddaReferenceNo', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="Date of Receipt of File" required>
                <input
                  type="date"
                  className={boiInputClass}
                  value={formState.dateOfReceiptOfFile}
                  onChange={(e) => updateField('dateOfReceiptOfFile', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="Proposal pertaining to Branch" required>
                <input
                  className={boiInputClass}
                  placeholder="e.g. Mumbai - Andheri East"
                  value={formState.branchName}
                  onChange={(e) => updateField('branchName', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="Type/Purpose of the loan" required>
                <BoiSelectField
                  value={formState.loanType}
                  onChange={(v) => updateField('loanType', v)}
                  options={LOAN_TYPES}
                  placeholder="Select loan type"
                />
              </BoiFormField>
              <BoiFormField label="Loan Amount sought" required>
                <input
                  type="number"
                  inputMode="numeric"
                  className={boiInputClass}
                  placeholder="e.g. 2500000"
                  value={formState.loanAmount}
                  onChange={(e) => updateField('loanAmount', e.target.value)}
                />
              </BoiFormField>
            </div>
          </div>

          {/* 7th Question: Observations remarks */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">7. Special Observations (Left empty to hide in report)</h2>
            <div className="space-y-4">
              <BoiFormField label="APPLICANT RESIDENCE VERIFICATION: ">
                <textarea
                  rows={2}
                  className={boiTextareaClass}
                  placeholder="Primary applicant residence remarks"
                  value={formState.obs_app1_res}
                  onChange={(e) => updateField('obs_app1_res', e.target.value)}
                />
              </BoiFormField>
              {applicants.length >= 2 && (
                <BoiFormField label="APPLICANT-2 RESIDENCE VERIFICATION: ">
                  <textarea
                    rows={2}
                    className={boiTextareaClass}
                    placeholder="Co-applicant 1 residence remarks"
                    value={formState.obs_app2_res}
                    onChange={(e) => updateField('obs_app2_res', e.target.value)}
                  />
                </BoiFormField>
              )}
              {applicants.length >= 3 && (
                <BoiFormField label="APPLICANT-3 RESIDENCE VERIFICATION: ">
                  <textarea
                    rows={2}
                    className={boiTextareaClass}
                    placeholder="Co-applicant 2 residence remarks"
                    value={formState.obs_app3_res}
                    onChange={(e) => updateField('obs_app3_res', e.target.value)}
                  />
                </BoiFormField>
              )}
              <BoiFormField label="GUARANTOR RESIDENCE VERIFICATION: ">
                <textarea
                  rows={2}
                  className={boiTextareaClass}
                  placeholder="Guarantor residence remarks"
                  value={formState.obs_guar_res}
                  onChange={(e) => updateField('obs_guar_res', e.target.value)}
                />
              </BoiFormField>
              <BoiFormField label="APPLICANT BUSINESS VERIFICATION: ">
                <textarea
                  rows={2}
                  className={boiTextareaClass}
                  placeholder="Primary applicant business/employment remarks"
                  value={formState.obs_app1_biz}
                  onChange={(e) => updateField('obs_app1_biz', e.target.value)}
                />
              </BoiFormField>
              {applicants.length >= 2 && (
                <BoiFormField label="APPLICANT-2 BUSINESS VERIFICATION: ">
                  <textarea
                    rows={2}
                    className={boiTextareaClass}
                    placeholder="Co-applicant 1 business remarks"
                    value={formState.obs_app2_biz}
                    onChange={(e) => updateField('obs_app2_biz', e.target.value)}
                  />
                </BoiFormField>
              )}
              {applicants.length >= 3 && (
                <BoiFormField label="APPLICANT-3 BUSINESS VERIFICATION: ">
                  <textarea
                    rows={2}
                    className={boiTextareaClass}
                    placeholder="Co-applicant 2 business remarks"
                    value={formState.obs_app3_biz}
                    onChange={(e) => updateField('obs_app3_biz', e.target.value)}
                  />
                </BoiFormField>
              )}
              <BoiFormField label="GUARANTOR EMPLOYMENT VERIFICATION: ">
                <textarea
                  rows={2}
                  className={boiTextareaClass}
                  placeholder="Guarantor employment remarks"
                  value={formState.obs_guar_emp}
                  onChange={(e) => updateField('obs_guar_emp', e.target.value)}
                />
              </BoiFormField>
            </div>
          </div>

          {/* Guarantor details (editable from start page) */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">8. Guarantor Details</h2>
            <BoiFormField label="Guarantor Details Present in Application?">
              <BoiYesNoRadio name="fbGuarantorDetailsPresent" value={formState.fbGuarantorDetailsPresent} onChange={(v) => updateField('fbGuarantorDetailsPresent', v)} />
            </BoiFormField>
            {formState.fbGuarantorDetailsPresent === 'yes' && (
              <div className="grid gap-5 sm:grid-cols-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <BoiFormField label="Guarantor Name" required>
                  <input className={boiInputClass} value={formState.fbGuarantorName} onChange={(e) => updateField('fbGuarantorName', e.target.value)} />
                </BoiFormField>
                <BoiGuarantorOpinionInput value={formState.fbGuarantorOpinion} onChange={(v) => updateField('fbGuarantorOpinion', v)} />
                <BoiFormField label="Guarantor Address" className="sm:col-span-2" required>
                  <textarea rows={2} className={boiTextareaClass} value={formState.fbGuarantorAddress} onChange={(e) => updateField('fbGuarantorAddress', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="Guarantor Verification Details / Notes" className="sm:col-span-2" required>
                  <textarea rows={2} className={boiTextareaClass} value={formState.fbGuarantorVerified} onChange={(e) => updateField('fbGuarantorVerified', e.target.value)} />
                </BoiFormField>
              </div>
            )}
            <BoiFormField label="Overall CA Assessment Summary Note / Recommendation">
              <textarea rows={3} className={boiTextareaClass} placeholder="Summarize the overall verification recommendation" value={formState.fbOverallFeedbackNote} onChange={(e) => updateField('fbOverallFeedbackNote', e.target.value)} />
            </BoiFormField>
          </div>
        </div>
      );
    }

    if (activeSection === 'general') {
      const isStandardMarital = ['Single', 'Married'].includes(formState.maritalStatus);
      const maritalDropdownValue = isStandardMarital ? formState.maritalStatus : (formState.maritalStatus ? 'Others' : '');

      const isStandardEmp = ['Salaried', 'Business'].includes(formState.employmentCategory);
      const empDropdownValue = isStandardEmp ? formState.employmentCategory : (formState.employmentCategory ? 'Others' : '');

      return (
        <div className="space-y-4">
          <BoiSectionGroup>
            <BoiFormField label="1. Name of the Borrower" required error={fieldErrors.borrowerName}>
              <input className={boiInputClass} value={formState.borrowerName} onChange={(e) => updateField('borrowerName', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="2. Father's / Husband Name" required error={fieldErrors.fatherHusbandName}>
              <input className={boiInputClass} value={formState.fatherHusbandName} onChange={(e) => updateField('fatherHusbandName', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="3. Gender" required error={fieldErrors.gender}>
              <BoiSelectField value={formState.gender} onChange={(v) => updateField('gender', v)} options={GENDER_OPTIONS} placeholder="Select gender" />
            </BoiFormField>
            <BoiFormField label="4. Resident Status" required error={fieldErrors.residentStatus}>
              <BoiSelectField value={formState.residentStatus} onChange={(v) => updateField('residentStatus', v)} options={RESIDENT_STATUS_OPTIONS} placeholder="Select status" />
            </BoiFormField>
            <BoiFormField label="5. PAN No" required error={fieldErrors.panNumber}>
              <input
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7e22ce] uppercase tracking-wider font-mono"
                placeholder="ABCPD1234F"
                maxLength={10}
                value={formState.panNumber}
                onChange={(e) => updateField('panNumber', e.target.value)}
              />
            </BoiFormField>
            <BoiFormField label="6. Aadhaar No" required error={fieldErrors.aadhaarNumber}>
              <input
                className={boiInputClass}
                placeholder="12 digit Aadhaar"
                inputMode="numeric"
                maxLength={12}
                value={formState.aadhaarNumber}
                onChange={(e) => updateField('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
              />
            </BoiFormField>
            <BoiFormField label="7. Date Of Birth" required error={fieldErrors.dateOfBirth}>
              <input type="date" className={boiInputClass} value={formState.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="8. Qualification" required error={fieldErrors.qualification}>
              <input className={boiInputClass} placeholder="e.g. Graduate" value={formState.qualification} onChange={(e) => updateField('qualification', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="9. Marital Status" required error={fieldErrors.maritalStatus}>
              <BoiSelectField
                value={maritalDropdownValue}
                onChange={(v) => {
                  if (v === 'Others') {
                    updateField('maritalStatus', '');
                  } else {
                    updateField('maritalStatus', v);
                  }
                }}
                options={MARITAL_STATUS_OPTIONS}
                placeholder="Select status"
              />
            </BoiFormField>
            {maritalDropdownValue === 'Others' && (
              <BoiFormField label="Specify Marital Status" required>
                <input
                  className={boiInputClass}
                  value={formState.maritalStatus === 'Others' ? '' : formState.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value)}
                  placeholder="Specify marital status"
                />
              </BoiFormField>
            )}
            <BoiFormField label="10. Type Of Employment" required error={fieldErrors.employmentCategory}>
              <BoiSelectField
                value={empDropdownValue}
                onChange={(v) => {
                  if (v === 'Others') {
                    updateField('employmentCategory', '');
                  } else {
                    updateField('employmentCategory', v);
                  }
                }}
                options={EMPLOYMENT_CATEGORIES}
                placeholder="Select category"
              />
            </BoiFormField>
            {empDropdownValue === 'Others' && (
              <BoiFormField label="Specify Employment Category" required>
                <input
                  className={boiInputClass}
                  value={formState.employmentCategory === 'Others' ? '' : formState.employmentCategory}
                  onChange={(e) => updateField('employmentCategory', e.target.value)}
                  placeholder="Specify category"
                />
              </BoiFormField>
            )}
          </BoiSectionGroup>
        </div>
      );
    }

    if (activeSection === 'residence') {
      const isStandardNature = ['Owned', 'Rental', 'Family Owned', 'Lease', 'PayingGuest', 'CompanyQuarts'].includes(formState.tenureStatus);
      const natureDropdownValue = isStandardNature ? formState.tenureStatus : (formState.tenureStatus ? 'Others' : '');

      return (
        <div className="space-y-4 text-left">
          <BoiSectionGroup>
            <BoiFormField label="1. Present Residence Address Tallied" required error={fieldErrors.addressTallied}>
              <BoiYesNoRadio name="addressTallied" value={formState.addressTallied} onChange={(v) => updateField('addressTallied', v)} />
            </BoiFormField>
            <BoiFormField label="2. Applicant's Residence Landmark" required error={fieldErrors.landmark}>
              <input className={boiInputClass} value={formState.landmark} onChange={(e) => updateField('landmark', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="3. Name and Stay Confirmed?" required error={fieldErrors.stayConfirmed}>
              <BoiYesNoRadio name="stayConfirmed" value={formState.stayConfirmed} onChange={(v) => updateField('stayConfirmed', v)} />
            </BoiFormField>
            {formState.stayConfirmed === 'yes' && (
              <BoiFormField label="Staying Since (Years)" error={fieldErrors.stayingSince}>
                <input className={boiInputClass} inputMode="numeric" placeholder="e.g. 5" value={formState.stayingSince} onChange={(e) => updateField('stayingSince', e.target.value)} />
              </BoiFormField>
            )}
            <BoiFormField label="4. Name Plate Seen in the Building">
              <BoiYesNoRadio name="namePlateSeen" value={formState.namePlateSeen} onChange={(v) => updateField('namePlateSeen', v)} />
            </BoiFormField>
            {formState.namePlateSeen === 'yes' && (
              <BoiFormField label="5. Name On The Plate Tallies?" error={fieldErrors.namePlateMatches}>
                <BoiYesNoRadio name="namePlateMatches" value={formState.namePlateMatches} onChange={(v) => updateField('namePlateMatches', v)} />
              </BoiFormField>
            )}
            <BoiFormField label="6. Nature Of Residence" required error={fieldErrors.tenureStatus}>
              <BoiSelectField
                value={natureDropdownValue}
                onChange={(v) => {
                  if (v === 'Others') {
                    updateField('tenureStatus', '');
                  } else {
                    updateField('tenureStatus', v);
                  }
                }}
                options={RES_NATURE_OPTIONS}
                placeholder="Select tenure"
              />
            </BoiFormField>
            {natureDropdownValue === 'Others' && (
              <BoiFormField label="Specify Nature of Residence" required>
                <input
                  className={boiInputClass}
                  value={formState.tenureStatus === 'Others' ? '' : formState.tenureStatus}
                  onChange={(e) => updateField('tenureStatus', e.target.value)}
                  placeholder="Specify tenure"
                />
              </BoiFormField>
            )}
            {formState.tenureStatus === 'Rental' && (
              <BoiFormField label="Rent Amount (INR)" error={fieldErrors.rentAmount}>
                <input className={boiInputClass} type="number" inputMode="numeric" placeholder="Monthly rent" value={formState.rentAmount} onChange={(e) => updateField('rentAmount', e.target.value)} />
              </BoiFormField>
            )}
            <BoiFormField label="7. Type Of Residence" required error={fieldErrors.houseType}>
              <BoiSelectField value={formState.houseType} onChange={(v) => updateField('houseType', v)} options={RES_TYPE_OPTIONS} placeholder="Select type" />
            </BoiFormField>
            <BoiFormField label="8. Name Of Person Contacted" required error={fieldErrors.contactPersonName}>
              <input className={boiInputClass} value={formState.contactPersonName} onChange={(e) => updateField('contactPersonName', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="9. Relation With Applicant" required error={fieldErrors.contactPersonRelation}>
              <input className={boiInputClass} value={formState.contactPersonRelation} onChange={(e) => updateField('contactPersonRelation', e.target.value)} placeholder="Relation with applicant" />
            </BoiFormField>
            <BoiFormField label="10. Name Of City" required error={fieldErrors.city}>
              <input className={boiInputClass} value={formState.city} onChange={(e) => updateField('city', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="11. PIN Code" required error={fieldErrors.pinCode}>
              <input className={boiInputClass} placeholder="6 digit PIN" inputMode="numeric" maxLength={6} value={formState.pinCode} onChange={(e) => updateField('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </BoiFormField>
            <BoiFormField label="12. Residence Phone No" error={fieldErrors.telephoneNumber}>
              <input className={boiInputClass} inputMode="numeric" value={formState.telephoneNumber} onChange={(e) => updateField('telephoneNumber', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="13. Mobile No" required error={fieldErrors.mobileNumber}>
              <input className={boiInputClass} placeholder="10 digit mobile" inputMode="numeric" maxLength={10} value={formState.mobileNumber} onChange={(e) => updateField('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </BoiFormField>
            <BoiFormField label="14. Type Of Locality">
              <BoiSelectField value={formState.localityType} onChange={(v) => updateField('localityType', v)} options={RES_LOCALITY_OPTIONS} placeholder="Select locality" />
            </BoiFormField>
            <BoiFormField label="15. Locality/LandMark" required error={fieldErrors.landmark}>
              <input className={boiInputClass} value={formState.landmark} onChange={(e) => updateField('landmark', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="16. Living Standard and Assets Seen" required error={fieldErrors.livingStandard}>
              <BoiSelectField value={formState.livingStandard} onChange={(v) => updateField('livingStandard', v)} options={RES_LIVING_STANDARD_OPTIONS} placeholder="Select living standard" />
            </BoiFormField>
            <BoiFormField label="17. Given Address" required className="sm:col-span-2" error={fieldErrors.givenAddress}>
              <textarea rows={2} className={boiTextareaClass} value={formState.givenAddress} onChange={(e) => updateField('givenAddress', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="18. Present Address" required className="sm:col-span-2" error={fieldErrors.presentAddress}>
              <textarea rows={2} className={boiTextareaClass} value={formState.presentAddress} onChange={(e) => updateField('presentAddress', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="19. Number Of Dependents" required error={fieldErrors.numberOfDependents}>
              <input className={boiInputClass} type="number" inputMode="numeric" min="0" value={formState.numberOfDependents} onChange={(e) => updateField('numberOfDependents', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="20. Accessibility (Ease Of Locating)" required error={fieldErrors.accessibility}>
              <BoiSelectField value={formState.accessibility} onChange={(v) => updateField('accessibility', v)} options={RES_ACCESSIBILITY_OPTIONS} placeholder="Select accessibility" />
            </BoiFormField>

            <BoiFormField
              label="21. If Applicant's house locked, the following information to be obtained from Neighbours"
              className="sm:col-span-2"
              error={fieldErrors.locksReason || fieldErrors.houseLocked}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Was the house locked?</label>
                  <BoiYesNoRadio name="houseLocked" value={formState.houseLocked} onChange={(v) => updateField('houseLocked', v)} />
                </div>
                <div className="grid gap-3">
                  {HOUSE_LOCKED_SUB_QUESTIONS.map((q) => (
                    <BoiFormField key={q.key} label={q.label} error={fieldErrors[q.key]}>
                      <input
                        className={boiInputClass}
                        value={formState.houseLocked === 'yes' ? formState[q.key] : (formState[q.key] || 'N/A')}
                        onChange={(e) => updateField(q.key, e.target.value)}
                        placeholder={formState.houseLocked === 'yes' ? 'Enter answer' : 'N/A'}
                        disabled={formState.houseLocked !== 'yes'}
                      />
                    </BoiFormField>
                  ))}
                </div>
                {formState.houseLocked !== 'yes' && (
                  <p className="text-xs text-gray-500">When house is not locked, report shows NOT APPLICABLE with a–f as N/A.</p>
                )}
              </div>
            </BoiFormField>

            <BoiFormField label="Neighbours Contacted">
              <BoiYesNoRadio name="neighboursContacted" value={formState.neighboursContacted} onChange={(v) => updateField('neighboursContacted', v)} />
            </BoiFormField>
            <BoiFormField label="Neighbours / Reference Feedback">
              <input className={boiInputClass} placeholder="e.g. Confirmed stay and occupation" value={formState.neighbourFeedback} onChange={(e) => updateField('neighbourFeedback', e.target.value)} />
            </BoiFormField>

            <BoiFormField
              label="22. If Address is not confirmed, following Details to be obtained"
              className="sm:col-span-2"
              error={fieldErrors.mismatchDetails}
            >
              <div className="space-y-3">
                <div className={`space-y-3 ${formState.addressTallied === 'no' ? 'border-l-4 border-amber-500 pl-3' : ''}`}>
                  {ADDRESS_NOT_CONFIRMED_SUB_QUESTIONS.map((q) => (
                    <BoiFormField key={q.key} label={q.label} error={fieldErrors[q.key]}>
                      <input
                        className={boiInputClass}
                        value={formState.addressTallied === 'no' ? formState[q.key] : (formState[q.key] || 'N/A')}
                        onChange={(e) => updateField(q.key, e.target.value)}
                        placeholder={formState.addressTallied === 'no' ? 'Enter answer' : 'N/A'}
                        disabled={formState.addressTallied !== 'no'}
                      />
                    </BoiFormField>
                  ))}
                </div>
                {formState.addressTallied !== 'no' && (
                  <p className="text-xs text-gray-500">When address is tallied, report shows NOT APPLICABLE with a–c as N/A.</p>
                )}
              </div>
            </BoiFormField>

            <BoiFormField label="23. Date and Time Of Visit" required error={fieldErrors.visitDateTime}>
              <input type="datetime-local" className={boiInputClass} value={formState.visitDateTime} onChange={(e) => updateField('visitDateTime', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="24. Name Of Verifier & Remarks" required>
              <input className={boiInputClass} value={formState.resVerifierRemarks} onChange={(e) => updateField('resVerifierRemarks', e.target.value)} placeholder="Verifier name and remarks" />
            </BoiFormField>
            <BoiFormField label="25. Name Of Supervisor & Remarks" required>
              <input className={boiInputClass} value={formState.resSupervisorRemarks} onChange={(e) => updateField('resSupervisorRemarks', e.target.value)} placeholder="Supervisor name and remarks" />
            </BoiFormField>
            <BoiFormField
              label="26. Remarks in Detail, If Negative"
              required
              className="sm:col-span-2"
              error={fieldErrors.resDetailRemarks || fieldErrors.resDetailStatus || fieldErrors.residenceConfirmation}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">1. Remarks</label>
                  <textarea
                    rows={2}
                    className={boiTextareaClass}
                    value={formState.resDetailRemarks}
                    onChange={(e) => updateField('resDetailRemarks', e.target.value)}
                    placeholder="e.g. NO REMARKS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">2. Status</label>
                  <BoiSelectField
                    value={formState.resDetailStatus}
                    onChange={(v) => updateField('resDetailStatus', v)}
                    options={['Positive', 'Negative']}
                    placeholder="Select status"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  Report format: Remarks: {formState.resDetailRemarks || 'NO REMARKS'} / {(formState.resDetailStatus || 'Positive').toUpperCase()}
                </p>
              </div>
            </BoiFormField>
          </BoiSectionGroup>
        </div>
      );
    }

    if (activeSection === 'employment') {
      const PROOFS_OPTIONS = ['ID-CARD', 'LetterHead', 'Old Envelope/Billcopy', 'Others'];
      const isStandardProof = ['ID-CARD', 'LetterHead', 'Old Envelope/Billcopy'].includes(formState.proofsReceived);
      const proofDropdownValue = isStandardProof ? formState.proofsReceived : (formState.proofsReceived ? 'Others' : '');

      const DESIGNATION_OPTIONS = ['Owner', 'Partner', 'Others'];
      const isStandardDesig = ['Owner', 'Partner'].includes(formState.designation);
      const desigDropdownValue = isStandardDesig ? formState.designation : (formState.designation ? 'Others' : '');

      const FIRM_TYPE_OPTIONS = ['Pub Ltd', 'Pvt Ltd', 'Partnership', 'LLP', 'Others'];
      const isStandardFirm = ['Pub Ltd', 'Pvt Ltd', 'Partnership', 'LLP'].includes(formState.typeOfFirm);
      const firmDropdownValue = isStandardFirm ? formState.typeOfFirm : (formState.typeOfFirm ? 'Others' : '');

      const BIZ_NATURE_OPTIONS = ['Manufacturing', 'Trading', 'Servicing', 'Others'];
      const isStandardBizNature = ['Manufacturing', 'Trading', 'Servicing'].includes(formState.natureOfBusiness);
      const bizNatureDropdownValue = isStandardBizNature ? formState.natureOfBusiness : (formState.natureOfBusiness ? 'Others' : '');

      return (
        <div className="space-y-4 text-left">
          {!isEmployed ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for non-employed categories (Housewife, Student, Retired, Unemployed).
            </div>
          ) : (
            <BoiSectionGroup>
              <BoiFormField label="1. Name of the Business Firm / Employer" required error={fieldErrors.companyName}>
                <input className={boiInputClass} value={formState.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="2. Address of the Business Firm / Employer" required className="sm:col-span-2" error={fieldErrors.companyAddress}>
                <textarea rows={2} className={boiTextareaClass} value={formState.companyAddress} onChange={(e) => updateField('companyAddress', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="3. Address Confirmed By" required error={fieldErrors.addressConfirmedBy}>
                <input className={boiInputClass} placeholder="e.g. Reception / HR" value={formState.addressConfirmedBy} onChange={(e) => updateField('addressConfirmedBy', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="4. Landmark / Locality" required error={fieldErrors.employmentLandmark}>
                <input className={boiInputClass} value={formState.employmentLandmark} onChange={(e) => updateField('employmentLandmark', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="5. Ownership of Office / Shop / Factory" required error={fieldErrors.officeOwnership}>
                <BoiSelectField value={formState.officeOwnership} onChange={(v) => updateField('officeOwnership', v)} options={OFFICE_OWNERSHIP_OPTIONS} placeholder="Select ownership" />
              </BoiFormField>
              <BoiFormField label="6. Whether Name Board of Firm / Office Sighted" required error={fieldErrors.nameBoardSighted}>
                <BoiYesNoRadio name="nameBoardSighted" value={formState.nameBoardSighted} onChange={(v) => updateField('nameBoardSighted', v)} />
              </BoiFormField>
              {formState.nameBoardSighted === 'no' && (
                <BoiFormField label="7. If No, Comments thereof" error={fieldErrors.detailsOfSighting}>
                  <input className={boiInputClass} placeholder="e.g. Sign board at office entrance" value={formState.detailsOfSighting} onChange={(e) => updateField('detailsOfSighting', e.target.value)} />
                </BoiFormField>
              )}
              <BoiFormField label="8. Types of Proof Received" required error={fieldErrors.proofsReceived}>
                <BoiSelectField
                  value={proofDropdownValue}
                  onChange={(v) => {
                    if (v === 'Others') {
                      updateField('proofsReceived', '');
                    } else {
                      updateField('proofsReceived', v);
                    }
                  }}
                  options={PROOFS_OPTIONS}
                  placeholder="Select proof type"
                />
              </BoiFormField>
              {proofDropdownValue === 'Others' && (
                <BoiFormField label="Specify Proof Type" required>
                  <input
                    className={boiInputClass}
                    value={formState.proofsReceived === 'Others' ? '' : formState.proofsReceived}
                    onChange={(e) => updateField('proofsReceived', e.target.value)}
                    placeholder="Specify proof type"
                  />
                </BoiFormField>
              )}
              <BoiFormField label="9. Designation" required error={fieldErrors.designation}>
                <BoiSelectField
                  value={desigDropdownValue}
                  onChange={(v) => {
                    if (v === 'Others') {
                      updateField('designation', '');
                    } else {
                      updateField('designation', v);
                    }
                  }}
                  options={DESIGNATION_OPTIONS}
                  placeholder="Select designation"
                />
              </BoiFormField>
              {desigDropdownValue === 'Others' && (
                <BoiFormField label="Specify Designation" required>
                  <input
                    className={boiInputClass}
                    value={formState.designation === 'Others' ? '' : formState.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                    placeholder="Specify designation"
                  />
                </BoiFormField>
              )}
              {isBusinessCategory && (
                <BoiFormField label="10. If Business, Year of Establishment" required error={fieldErrors.yearOfEstablishment}>
                  <input className={boiInputClass} inputMode="numeric" placeholder="e.g. 2015" value={formState.yearOfEstablishment} onChange={(e) => updateField('yearOfEstablishment', e.target.value)} />
                </BoiFormField>
              )}
              <BoiFormField label="11. Type of Employer / Business Firm" required error={fieldErrors.typeOfFirm}>
                <BoiSelectField
                  value={firmDropdownValue}
                  onChange={(v) => {
                    if (v === 'Others') {
                      updateField('typeOfFirm', '');
                    } else {
                      updateField('typeOfFirm', v);
                    }
                  }}
                  options={FIRM_TYPE_OPTIONS}
                  placeholder="Select firm type"
                />
              </BoiFormField>
              {firmDropdownValue === 'Others' && (
                <BoiFormField label="Specify Firm Type" required>
                  <input
                    className={boiInputClass}
                    value={formState.typeOfFirm === 'Others' ? '' : formState.typeOfFirm}
                    onChange={(e) => updateField('typeOfFirm', e.target.value)}
                    placeholder="Specify firm type"
                  />
                </BoiFormField>
              )}
              {isBusinessCategory && (
                <>
                  <BoiFormField label="12. Nature of Business of Firm / Employer" required error={fieldErrors.natureOfBusiness}>
                    <BoiSelectField
                      value={bizNatureDropdownValue}
                      onChange={(v) => {
                        if (v === 'Others') {
                          updateField('natureOfBusiness', '');
                        } else {
                          updateField('natureOfBusiness', v);
                        }
                      }}
                      options={BIZ_NATURE_OPTIONS}
                      placeholder="Select nature of business"
                    />
                  </BoiFormField>
                  {bizNatureDropdownValue === 'Others' && (
                    <BoiFormField label="Specify Nature of Business" required>
                      <input
                        className={boiInputClass}
                        value={formState.natureOfBusiness === 'Others' ? '' : formState.natureOfBusiness}
                        onChange={(e) => updateField('natureOfBusiness', e.target.value)}
                        placeholder="Specify nature of business"
                      />
                    </BoiFormField>
                  )}
                </>
              )}
              <BoiFormField label="13. Website of the Employer">
                <input className={boiInputClass} placeholder="e.g. www.company.com" value={formState.companyWebsite} onChange={(e) => updateField('companyWebsite', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="13. Email ID of the Employer" error={fieldErrors.officialEmailId}>
                <input className={boiInputClass} type="email" inputMode="email" value={formState.officialEmailId} onChange={(e) => updateField('officialEmailId', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="14. If Employed, Since When / Years of Service" required error={fieldErrors.yearsOfService}>
                <input className={boiInputClass} placeholder="e.g. 3 years" value={formState.yearsOfService} onChange={(e) => updateField('yearsOfService', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="15. Any info on likelihood of change in Employment status (E.g. transfer/resignation)">
                <input className={boiInputClass} value={formState.changeLikelihood} onChange={(e) => updateField('changeLikelihood', e.target.value)} placeholder="Specify likelihood of change" />
              </BoiFormField>
              {isBusinessCategory && (
                <>
                  <BoiFormField label="16. Line of Business for Self-Employed" required error={fieldErrors.lineOfBusiness}>
                    <input className={boiInputClass} value={formState.lineOfBusiness} onChange={(e) => updateField('lineOfBusiness', e.target.value)} />
                  </BoiFormField>
                  <BoiFormField label="Business Registration / GST No." error={fieldErrors.businessRegistrationNumber}>
                    <input className={boiInputClass} value={formState.businessRegistrationNumber} onChange={(e) => updateField('businessRegistrationNumber', e.target.value)} />
                  </BoiFormField>
                  <BoiFormField label="Registration Licensing Authority">
                    <input className={boiInputClass} value={formState.registrationAuthority} onChange={(e) => updateField('registrationAuthority', e.target.value)} />
                  </BoiFormField>
                </>
              )}
              <BoiFormField label="17. Telephone No. of Business Firm / Employer" error={fieldErrors.workContact}>
                <input className={boiInputClass} inputMode="numeric" value={formState.workContact} onChange={(e) => updateField('workContact', e.target.value)} />
              </BoiFormField>
              {isSalaryApplicable && (
                <BoiFormField label="18. Terms of Employment" required error={fieldErrors.termsOfEmployment}>
                  <input className={boiInputClass} placeholder="e.g. Permanent / Contract" value={formState.termsOfEmployment} onChange={(e) => updateField('termsOfEmployment', e.target.value)} />
                </BoiFormField>
              )}
              <BoiFormField label="20. Name of the Supervisory Official & Mobile No." required error={fieldErrors.supervisorDetails}>
                <input className={boiInputClass} value={formState.supervisorDetails} onChange={(e) => updateField('supervisorDetails', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="21. Visting Card of Authorized Employement" required>
                <input className={boiInputClass} value={formState.visitingCardDetails} onChange={(e) => updateField('visitingCardDetails', e.target.value)} placeholder="Visiting card details" />
              </BoiFormField>
              <BoiFormField label="22. Name of Verifier & Remarks" className="sm:col-span-2" required error={fieldErrors.employeeNotes}>
                <textarea rows={2} className={boiTextareaClass} value={formState.employeeNotes} onChange={(e) => updateField('employeeNotes', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="23. Name of Supervisor & Remarks" className="sm:col-span-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">1. Remarks</label>
                    <textarea
                      rows={2}
                      className={boiTextareaClass}
                      value={formState.supervisorRemarks}
                      onChange={(e) => updateField('supervisorRemarks', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">2. Status</label>
                    <BoiSelectField
                      value={formState.supervisorStatus}
                      onChange={(v) => updateField('supervisorStatus', v)}
                      options={['Positive', 'Negative']}
                      placeholder="Select status"
                    />
                  </div>
                </div>
              </BoiFormField>
            </BoiSectionGroup>
          )}
        </div>
      );
    }

    if (activeSection === 'pan') {
      return (
        <div className="space-y-4 text-left">
          <BoiSectionGroup>
            <BoiFormField label="01. PAN Number" required error={fieldErrors.panPortalNumber}>
              <input
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7e22ce] uppercase tracking-wider font-mono"
                placeholder="ABCPD1234F"
                maxLength={10}
                value={formState.panPortalNumber}
                onChange={(e) => updateField('panPortalNumber', e.target.value)}
              />
            </BoiFormField>
            <BoiFormField label="Name on Portal" required error={fieldErrors.panPortalName}>
              <input className={boiInputClass} value={formState.panPortalName} onChange={(e) => updateField('panPortalName', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="02. Whether Name is Matching" required error={fieldErrors.panPortalTally}>
              <BoiYesNoRadio name="panPortalTally" value={formState.panPortalTally} onChange={(v) => updateField('panPortalTally', v)} />
            </BoiFormField>
            <BoiFormField label="03. Matching of Gender" required error={fieldErrors.panGenderMatching}>
              <BoiYesNoRadio name="panGenderMatching" value={formState.panGenderMatching} onChange={(v) => updateField('panGenderMatching', v)} />
            </BoiFormField>
            <BoiFormField label="08. Whether PAN Verified with IT Website" required error={fieldErrors.panPortalStatus}>
              <input className={boiInputClass} placeholder="e.g. Active / Valid" value={formState.panPortalStatus} onChange={(e) => updateField('panPortalStatus', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="09. Final Status" required error={fieldErrors.panFinalStatus}>
              <BoiSelectField value={formState.panFinalStatus} onChange={(v) => updateField('panFinalStatus', v)} options={[{ value: 'confirmed', label: 'Confirmed Authentic' }, { value: 'not_confirmed', label: 'Not Confirmed / Suspicious' }]} placeholder="Select status" />
            </BoiFormField>
            <BoiFormField label="10. Remark" className="sm:col-span-2" error={fieldErrors.panPortalMatchRemarks}>
              <input className={boiInputClass} value={formState.panPortalMatchRemarks} onChange={(e) => updateField('panPortalMatchRemarks', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="11. Name of Verifier & Remarks" className="sm:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">1. Name</label>
                  <input className={boiInputClass} value={formState.panVerifierName} onChange={(e) => updateField('panVerifierName', e.target.value)} placeholder="Verifier name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">2. Remarks</label>
                  <textarea rows={2} className={boiTextareaClass} value={formState.panVerifierRemarks} onChange={(e) => updateField('panVerifierRemarks', e.target.value)} />
                </div>
              </div>
            </BoiFormField>
            <BoiFormField label="12. Name Of Supervisor & Remarks" className="sm:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">1. Name</label>
                  <input className={boiInputClass} value={formState.panSupervisorName} onChange={(e) => updateField('panSupervisorName', e.target.value)} placeholder="Supervisor name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">2. Remarks</label>
                  <textarea rows={2} className={boiTextareaClass} value={formState.panSupervisorRemarks} onChange={(e) => updateField('panSupervisorRemarks', e.target.value)} />
                </div>
              </div>
            </BoiFormField>
            <BoiFormField label="13. Remarks in detail" className="sm:col-span-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">1. Remarks</label>
                  <textarea rows={2} className={boiTextareaClass} value={formState.panDetailRemarks} onChange={(e) => updateField('panDetailRemarks', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">2. Status</label>
                  <BoiSelectField
                    value={formState.panDetailStatus}
                    onChange={(v) => updateField('panDetailStatus', v)}
                    options={['Positive', 'Negative']}
                    placeholder="Select status"
                  />
                </div>
              </div>
            </BoiFormField>
          </BoiSectionGroup>
        </div>
      );
    }

    if (activeSection === 'salary') {
      return (
        <div className="space-y-4 text-left">
          {!isSalaryApplicable ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for self-employed/business or non-employed applicants.
            </div>
          ) : (
            <BoiSectionGroup>
              <BoiFormField label="01. Name of Firm / Company / Institution" required error={fieldErrors.salaryCompanyName}>
                <input className={boiInputClass} value={formState.salaryCompanyName} onChange={(e) => updateField('salaryCompanyName', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="02. Applicant Designation" required error={fieldErrors.salaryDesignation}>
                <input className={boiInputClass} value={formState.salaryDesignation} onChange={(e) => updateField('salaryDesignation', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="03. Applicant's Years of Service with Organisation" required error={fieldErrors.salaryYearsOfService}>
                <input className={boiInputClass} placeholder="e.g. 4 years" value={formState.salaryYearsOfService} onChange={(e) => updateField('salaryYearsOfService', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="04. Whether Services are Confirmed?" required error={fieldErrors.salaryServiceConfirmed}>
                <BoiYesNoRadio name="salaryServiceConfirmed" value={formState.salaryServiceConfirmed} onChange={(v) => updateField('salaryServiceConfirmed', v)} />
              </BoiFormField>
              <BoiFormField label="Service Tally Remarks (if not confirmed)" className="sm:col-span-2">
                <input className={boiInputClass} value={formState.salaryServiceTallyRemarks} onChange={(e) => updateField('salaryServiceTallyRemarks', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="05. Gross Annual / Monthly Income" required error={fieldErrors.salaryGrossMonthlyIncome}>
                <input className={boiInputClass} type="number" inputMode="numeric" value={formState.salaryGrossMonthlyIncome} onChange={(e) => updateField('salaryGrossMonthlyIncome', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="06. Total Income as per SS / SC / PS / F-16" required error={fieldErrors.salaryTotalIncome}>
                <BoiYesNoRadio name="salaryTotalIncome" value={formState.salaryTotalIncome} onChange={(v) => updateField('salaryTotalIncome', v)} />
              </BoiFormField>
              <BoiFormField label="07. Income Under Head Salaries Verified" required error={fieldErrors.salaryPayslipsAvailable}>
                <BoiYesNoRadio name="salaryPayslipsAvailable" value={formState.salaryPayslipsAvailable} onChange={(v) => updateField('salaryPayslipsAvailable', v)} />
              </BoiFormField>
              <BoiFormField label="08. Tax Calculation Verified" required error={fieldErrors.salaryBankStatementsAvailable}>
                <BoiYesNoRadio name="salaryBankStatementsAvailable" value={formState.salaryBankStatementsAvailable} onChange={(v) => updateField('salaryBankStatementsAvailable', v)} />
              </BoiFormField>
              <BoiFormField label="09. Form-16 Tax Payable is Correct" required error={fieldErrors.salaryForm16Issued}>
                <BoiYesNoRadio name="salaryForm16Issued" value={formState.salaryForm16Issued} onChange={(v) => updateField('salaryForm16Issued', v)} />
              </BoiFormField>
              <BoiFormField label="10. If No, Remarks" className="sm:col-span-2">
                <input className={boiInputClass} value={formState.salaryTaxPaidRemarks} onChange={(e) => updateField('salaryTaxPaidRemarks', e.target.value)} />
              </BoiFormField>
            </BoiSectionGroup>
          )}
        </div>
      );
    }

    if (activeSection === 'documents') {
      return (
        <div className="space-y-4 text-left">
          {!isEmployed ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for non-employed applicants.
            </div>
          ) : (
            <BoiSectionGroup className="space-y-4">
              <BoiFormField label="01. Seal of the Organisation as per Document" required className="sm:col-span-2" error={fieldErrors.docSealOfOrganization}>
                <BoiTalliedRadio name="docSealOfOrganization" value={formState.docSealOfOrganization} onChange={(v) => updateField('docSealOfOrganization', v)} />
              </BoiFormField>
              <BoiFormField label="02. Signature of the Issuing Authority as per Document" required className="sm:col-span-2" error={fieldErrors.docSignatureOfAuthority}>
                <BoiTalliedRadio name="docSignatureOfAuthority" value={formState.docSignatureOfAuthority} onChange={(v) => updateField('docSignatureOfAuthority', v)} />
              </BoiFormField>
              <BoiFormField label="03. Date & Amount on the SS / PS / SC" required className="sm:col-span-2" error={fieldErrors.docSalarySlipDateAmount}>
                <BoiTalliedRadio name="docSalarySlipDateAmount" value={formState.docSalarySlipDateAmount} onChange={(v) => updateField('docSalarySlipDateAmount', v)} />
              </BoiFormField>
              <BoiFormField label="04. Address of the Applicant's Office is Correct" required className="sm:col-span-2" error={fieldErrors.docOfficeAddressCorrect}>
                <BoiTalliedRadio name="docOfficeAddressCorrect" value={formState.docOfficeAddressCorrect} onChange={(v) => updateField('docOfficeAddressCorrect', v)} />
              </BoiFormField>
            </BoiSectionGroup>
          )}
        </div>
      );
    }

    if (activeSection === 'business') {
      return (
        <div className="space-y-4 text-left">
          {!isBusinessCategory ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for salaried or non-employed applicants.
            </div>
          ) : (
            <BoiSectionGroup>
                <BoiFormField label="1. Business Activity seen" required className="sm:col-span-2" error={fieldErrors.obsBusinessActivitySeen}>
                  <input className={boiInputClass} value={formState.obsBusinessActivitySeen} onChange={(e) => updateField('obsBusinessActivitySeen', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="2. Number of Employee seen" required error={fieldErrors.obsEmployeesSeen}>
                  <input className={boiInputClass} value={formState.obsEmployeesSeen} onChange={(e) => updateField('obsEmployeesSeen', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="3. Equipment/Stock seen" required error={fieldErrors.obsEquipmentStockSeen}>
                  <input className={boiInputClass} value={formState.obsEquipmentStockSeen} onChange={(e) => updateField('obsEquipmentStockSeen', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="4. Business premises ambience" required error={fieldErrors.obsBusinessAmbience}>
                  <input className={boiInputClass} value={formState.obsBusinessAmbience} onChange={(e) => updateField('obsBusinessAmbience', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="5. Level of Business activity (if self employed)" required error={fieldErrors.obsActivityLevel}>
                  <input className={boiInputClass} value={formState.obsActivityLevel} onChange={(e) => updateField('obsActivityLevel', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="6. Name of Verifier & Remarks" required className="sm:col-span-2" error={fieldErrors.obsVerifierName || fieldErrors.obsVerifierRemarks}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">1. Name</label>
                      <input className={boiInputClass} value={formState.obsVerifierName} onChange={(e) => updateField('obsVerifierName', e.target.value)} placeholder="Verifier name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">2. Remarks</label>
                      <textarea rows={2} className={boiTextareaClass} value={formState.obsVerifierRemarks} onChange={(e) => updateField('obsVerifierRemarks', e.target.value)} />
                    </div>
                  </div>
                </BoiFormField>
                <BoiFormField label="7. Name of Supervisor & Remarks" required className="sm:col-span-2" error={fieldErrors.obsSupervisorName || fieldErrors.obsSupervisorRemarks}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">1. Name</label>
                      <input className={boiInputClass} value={formState.obsSupervisorName} onChange={(e) => updateField('obsSupervisorName', e.target.value)} placeholder="Supervisor name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">2. Remarks</label>
                      <textarea rows={2} className={boiTextareaClass} value={formState.obsSupervisorRemarks} onChange={(e) => updateField('obsSupervisorRemarks', e.target.value)} />
                    </div>
                  </div>
                </BoiFormField>
                <BoiFormField label="8. Remarks in Detail" required className="sm:col-span-2" error={fieldErrors.obsNegativeRemarks || fieldErrors.obsNegativeStatus}>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">1. Remarks</label>
                      <textarea rows={2} className={boiTextareaClass} value={formState.obsNegativeRemarks} onChange={(e) => updateField('obsNegativeRemarks', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">2. Status</label>
                      <BoiSelectField
                        value={formState.obsNegativeStatus}
                        onChange={(v) => updateField('obsNegativeStatus', v)}
                        options={['Positive', 'Negative']}
                        placeholder="Select status"
                      />
                    </div>
                  </div>
                </BoiFormField>
            </BoiSectionGroup>
          )}
        </div>
      );
    }

    if (activeSection === 'property') {
      const isStdPropType = ['Residential', 'Commercial', 'Industrial', 'Agriculture'].includes(formState.propPropertyType);
      const propTypeDropdownValue = isStdPropType ? formState.propPropertyType : (formState.propPropertyType ? 'Others' : '');

      const isStdLocality = ['Posh locality', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class', 'Slum area'].includes(formState.propPropertyLocality);
      const localityDropdownValue = isStdLocality ? formState.propPropertyLocality : (formState.propPropertyLocality ? 'Other' : '');

      const isStdOwnership = ['Independently owned', 'Jointly owned', 'Free hold', 'Lease hold'].includes(formState.propOwnershipType);
      const ownershipDropdownValue = isStdOwnership ? formState.propOwnershipType : (formState.propOwnershipType ? 'Others' : '');

      const isStdConstStatus = ['Ready built house', 'House under construction', 'Ready built Flat', 'Flat under construction', 'Group of houses', 'Vacant Land'].includes(formState.propConstructionStatus);
      const constStatusDropdownValue = isStdConstStatus ? formState.propConstructionStatus : (formState.propConstructionStatus ? 'Others' : '');

      const isStdStage = ['Ground leveling', 'Foundation level', 'Lintel level', 'Roof level'].includes(formState.propStageOfConstruction);
      const stageDropdownValue = isStdStage ? formState.propStageOfConstruction : (formState.propStageOfConstruction ? 'Other' : '');

      const isStdAccessType = ['Pedestrian Road', 'Two wheeler Road', 'Four wheeler Road'].includes(formState.propIndependentAccessType);
      const accessTypeDropdownValue = isStdAccessType ? formState.propIndependentAccessType : (formState.propIndependentAccessType ? 'Other' : '');

      const isStdUsage = ['Shops', 'Godown/Shed', 'Temple', 'Educational institution', 'Wine shop/Club/Bar', 'Residential'].includes(formState.propBuildingUsage);
      const usageDropdownValue = isStdUsage ? formState.propBuildingUsage : (formState.propBuildingUsage ? 'Other' : '');

      return (
        <div className="space-y-4 text-left">
          {!isPropertyApplicable ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for selected Loan Type. Required only for Home Loan and Mortgage Loan.
            </div>
          ) : (
            <BoiSectionGroup>
              <BoiFormField label="1. Address of the Property" required className="sm:col-span-2" error={fieldErrors.propAddressOfProperty}>
                <textarea rows={2} className={boiTextareaClass} value={formState.propAddressOfProperty} onChange={(e) => updateField('propAddressOfProperty', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="2. Whether the Address of the Property is as Given in the Application" required error={fieldErrors.propAddressMatchesApplication}>
                <BoiYesNoRadio name="propAddressMatchesApplication" value={formState.propAddressMatchesApplication} onChange={(v) => updateField('propAddressMatchesApplication', v)} />
              </BoiFormField>
              <BoiFormField label="3. Name of Owner" required error={fieldErrors.propOwnerName}>
                <input className={boiInputClass} value={formState.propOwnerName} onChange={(e) => updateField('propOwnerName', e.target.value)} placeholder="Name of the owner" />
              </BoiFormField>
              <BoiFormField label="4. Type of the property" required error={fieldErrors.propPropertyType}>
                <BoiSelectField
                  value={propTypeDropdownValue}
                  onChange={(v) => {
                    if (v === 'Others') {
                      updateField('propPropertyType', '');
                    } else {
                      updateField('propPropertyType', v);
                    }
                  }}
                  options={['Residential', 'Commercial', 'Industrial', 'Agriculture', 'Others']}
                  placeholder="Select property type"
                />
              </BoiFormField>
              {propTypeDropdownValue === 'Others' && (
                <BoiFormField label="Specify Property Type" required>
                  <input
                    className={boiInputClass}
                    value={formState.propPropertyType === 'Others' ? '' : formState.propPropertyType}
                    onChange={(e) => updateField('propPropertyType', e.target.value)}
                    placeholder="Specify property type"
                  />
                </BoiFormField>
              )}
              <BoiFormField label="5. Locality of the property" required error={fieldErrors.propPropertyLocality}>
                <BoiSelectField
                  value={localityDropdownValue}
                  onChange={(v) => {
                    if (v === 'Other') {
                      updateField('propPropertyLocality', '');
                    } else {
                      updateField('propPropertyLocality', v);
                    }
                  }}
                  options={['Posh locality', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class', 'Slum area', 'Other']}
                  placeholder="Select locality"
                />
              </BoiFormField>
              {localityDropdownValue === 'Other' && (
                <BoiFormField label="Specify Locality" required>
                  <input
                    className={boiInputClass}
                    value={formState.propPropertyLocality === 'Other' ? '' : formState.propPropertyLocality}
                    onChange={(e) => updateField('propPropertyLocality', e.target.value)}
                    placeholder="Specify locality"
                  />
                </BoiFormField>
              )}
              <BoiFormField label="6. Ownership" required error={fieldErrors.propOwnershipType}>
                <BoiSelectField
                  value={ownershipDropdownValue}
                  onChange={(v) => {
                    if (v === 'Others') {
                      updateField('propOwnershipType', '');
                    } else {
                      updateField('propOwnershipType', v);
                    }
                  }}
                  options={['Independently owned', 'Jointly owned', 'Free hold', 'Lease hold', 'Others']}
                  placeholder="Select ownership"
                />
              </BoiFormField>
              {ownershipDropdownValue === 'Others' && (
                <BoiFormField label="Specify Ownership" required>
                  <input
                    className={boiInputClass}
                    value={formState.propOwnershipType === 'Others' ? '' : formState.propOwnershipType}
                    onChange={(e) => updateField('propOwnershipType', e.target.value)}
                    placeholder="Specify ownership"
                  />
                </BoiFormField>
              )}
              <BoiFormField label="7. Type of construction" required error={fieldErrors.propConstructionStatus}>
                <BoiSelectField
                  value={constStatusDropdownValue}
                  onChange={(v) => {
                    if (v === 'Others') {
                      updateField('propConstructionStatus', '');
                    } else {
                      updateField('propConstructionStatus', v);
                    }
                  }}
                  options={['Ready built house', 'House under construction', 'Ready built Flat', 'Flat under construction', 'Group of houses', 'Vacant Land', 'Others']}
                  placeholder="Select type of construction"
                />
              </BoiFormField>
              {constStatusDropdownValue === 'Others' && (
                <BoiFormField label="Specify Type of Construction" required>
                  <input
                    className={boiInputClass}
                    value={formState.propConstructionStatus === 'Others' ? '' : formState.propConstructionStatus}
                    onChange={(e) => updateField('propConstructionStatus', e.target.value)}
                    placeholder="Specify construction type"
                  />
                </BoiFormField>
              )}
              <BoiFormField label="8. Stage of construction (if property is under construction)">
                <BoiSelectField
                  value={stageDropdownValue}
                  onChange={(v) => {
                    if (v === 'Other') {
                      updateField('propStageOfConstruction', '');
                    } else {
                      updateField('propStageOfConstruction', v);
                    }
                  }}
                  options={['Ground leveling', 'Foundation level', 'Lintel level', 'Roof level', 'Other']}
                  placeholder="Select stage of construction"
                />
              </BoiFormField>
              {stageDropdownValue === 'Other' && (
                <BoiFormField label="Specify Stage of Construction" required>
                  <input
                    className={boiInputClass}
                    value={formState.propStageOfConstruction === 'Other' ? '' : formState.propStageOfConstruction}
                    onChange={(e) => updateField('propStageOfConstruction', e.target.value)}
                    placeholder="Specify stage of construction"
                  />
                </BoiFormField>
              )}
              <BoiFormField label="9. Whether the property has independent access" required error={fieldErrors.propIndependentAccess}>
                <BoiSelectField value={formState.propIndependentAccess} onChange={(v) => updateField('propIndependentAccess', v)} options={['Yes', 'No']} placeholder="Select access type" />
              </BoiFormField>
              {formState.propIndependentAccess === 'Yes' && (
                <>
                  <BoiFormField label="9th sub-questions Type of independent access" required>
                    <BoiSelectField
                      value={accessTypeDropdownValue}
                      onChange={(v) => {
                        if (v === 'Other') {
                          updateField('propIndependentAccessType', '');
                        } else {
                          updateField('propIndependentAccessType', v);
                        }
                      }}
                      options={['Pedestrian Road', 'Two wheeler Road', 'Four wheeler Road', 'Other']}
                      placeholder="Select independent access type"
                    />
                  </BoiFormField>
                  {accessTypeDropdownValue === 'Other' && (
                    <BoiFormField label="Specify Independent Access Type" required>
                      <input
                        className={boiInputClass}
                        value={formState.propIndependentAccessType === 'Other' ? '' : formState.propIndependentAccessType}
                        onChange={(e) => updateField('propIndependentAccessType', e.target.value)}
                        placeholder="Specify access type"
                      />
                    </BoiFormField>
                  )}
                </>
              )}
              <BoiFormField label="10. Type of building/usage or construction activity found" required error={fieldErrors.propBuildingUsage}>
                <BoiSelectField
                  value={usageDropdownValue}
                  onChange={(v) => {
                    if (v === 'Other') {
                      updateField('propBuildingUsage', '');
                    } else {
                      updateField('propBuildingUsage', v);
                    }
                  }}
                  options={['Shops', 'Godown/Shed', 'Temple', 'Educational institution', 'Wine shop/Club/Bar', 'Residential', 'Other']}
                  placeholder="Select usage type"
                />
              </BoiFormField>
              {usageDropdownValue === 'Other' && (
                <BoiFormField label="Specify Usage Type" required>
                  <input
                    className={boiInputClass}
                    value={formState.propBuildingUsage === 'Other' ? '' : formState.propBuildingUsage}
                    onChange={(e) => updateField('propBuildingUsage', e.target.value)}
                    placeholder="Specify usage type"
                  />
                </BoiFormField>
              )}
              <BoiFormField label="11. If Flat is under construction — Name of the Builder">
                <input className={boiInputClass} value={formState.propBuilderName} onChange={(e) => updateField('propBuilderName', e.target.value)} placeholder="Name of builder" />
              </BoiFormField>
              <BoiFormField label="11. Reputation of the Builder">
                <input className={boiInputClass} value={formState.propBuilderReputation} onChange={(e) => updateField('propBuilderReputation', e.target.value)} placeholder="Reputation of builder" />
              </BoiFormField>
              <BoiFormField label="11. Source of the above Application">
                <input className={boiInputClass} value={formState.propBuilderSource} onChange={(e) => updateField('propBuilderSource', e.target.value)} placeholder="Source of info" />
              </BoiFormField>
              <BoiFormField label="11. Stage of construction (if flat under construction)">
                <input className={boiInputClass} value={formState.propConstructionStageDetail} onChange={(e) => updateField('propConstructionStageDetail', e.target.value)} placeholder="Stage details" />
              </BoiFormField>
              <BoiFormField label="11. Whether work is in progress in full swing">
                <input className={boiInputClass} value={formState.propWorkInFullSwing} onChange={(e) => updateField('propWorkInFullSwing', e.target.value)} placeholder="e.g. Yes / No / Slow" />
              </BoiFormField>
              <BoiFormField label="11. Likely date of completion">
                <input className={boiInputClass} value={formState.propLikelyCompletionDate} onChange={(e) => updateField('propLikelyCompletionDate', e.target.value)} placeholder="e.g. Dec 2026 / 6 months" />
              </BoiFormField>
              <BoiFormField label="12. Date of site visit" required error={fieldErrors.propVisitDateTime}>
                <input type="date" className={boiInputClass} value={formState.propVisitDateTime} onChange={(e) => updateField('propVisitDateTime', e.target.value)} />
              </BoiFormField>
            </BoiSectionGroup>
          )}
        </div>
      );
    }

    if (activeSection === 'evidence') {
      return (
        <div className="space-y-6 text-left">
          {EVIDENCE_SECTIONS.filter((s) => {
            if (s.showOnlyIfCoApplicants && applicants.length <= 1) return false;
            if (s.isEmploymentRelated && !isEmployed) return false;
            return true;
          }).map((sec) => {
            const files = formState[sec.key] || [];
            return (
              <div key={sec.key} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{sec.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{sec.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                    {files.length} file{files.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div
                  className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-5 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/20 transition-colors"
                  onClick={() => fileInputRefs.current[sec.key]?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFiles(sec.key, e.dataTransfer.files, sec.allowed);
                  }}
                >
                  <UploadCloud className="h-7 w-7 mx-auto text-gray-400 mb-1.5" />
                  <p className="text-sm text-gray-600">Click to browse or drag files here</p>
                  <p className="text-[10px] text-gray-400 mt-1">Max 10 MB per file</p>
                  <input
                    ref={(el) => { fileInputRefs.current[sec.key] = el; }}
                    type="file"
                    multiple
                    accept={sec.accept}
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(sec.key, e.target.files, sec.allowed);
                      e.target.value = '';
                    }}
                  />
                </div>

                {files.length > 0 && (
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 mt-4">
                    {files.map((f) => (
                      <div key={f.id} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50 p-2">
                        {f.type.startsWith('image/') ? (
                          <img src={f.dataUrl} className="h-20 w-full object-cover rounded-md" alt={f.name} />
                        ) : (
                          <div className="h-20 w-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold text-xs rounded-md">PDF</div>
                        )}
                        <div className="p-1 min-w-0">
                          <p className="text-[10px] text-gray-600 truncate mt-1">{f.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(sec.key, f.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-red-600 border border-gray-200 opacity-90 hover:bg-white transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (activeSection === 'feedback') {
      return (
        <div className="space-y-6 text-left">
          <div className="space-y-4">
            {FEEDBACK_FIELDS.map((fb) => {
              const localKey = `fb${fb.key.charAt(0).toUpperCase()}${fb.key.slice(1)}`;
              return (
                <BoiFormField key={fb.key} label={fb.label} required>
                  <BoiTriRadio
                    name={localKey}
                    value={formState[localKey]}
                    onChange={(v) => updateField(localKey, v)}
                  />
                </BoiFormField>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-4">
            <BoiFormField label="Guarantor Details Present in Application?">
              <BoiYesNoRadio name="fbGuarantorDetailsPresent" value={formState.fbGuarantorDetailsPresent} onChange={(v) => updateField('fbGuarantorDetailsPresent', v)} />
            </BoiFormField>
            {formState.fbGuarantorDetailsPresent === 'yes' && (
              <div className="grid gap-5 sm:grid-cols-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <BoiFormField label="Guarantor Name" required>
                  <input className={boiInputClass} value={formState.fbGuarantorName} onChange={(e) => updateField('fbGuarantorName', e.target.value)} />
                </BoiFormField>
                <BoiGuarantorOpinionInput value={formState.fbGuarantorOpinion} onChange={(v) => updateField('fbGuarantorOpinion', v)} />
                <BoiFormField label="Guarantor Address" className="sm:col-span-2" required>
                  <textarea rows={2} className={boiTextareaClass} value={formState.fbGuarantorAddress} onChange={(e) => updateField('fbGuarantorAddress', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="Guarantor Verification Details / Notes" className="sm:col-span-2" required>
                  <textarea rows={2} className={boiTextareaClass} value={formState.fbGuarantorVerified} onChange={(e) => updateField('fbGuarantorVerified', e.target.value)} />
                </BoiFormField>
              </div>
            )}
          </div>

          <BoiFormField label="Overall CA Assessment Summary Note / Recommendation" required>
            <textarea rows={3} className={boiTextareaClass} placeholder="Summarize the overall verification recommendation" value={formState.fbOverallFeedbackNote} onChange={(e) => updateField('fbOverallFeedbackNote', e.target.value)} />
          </BoiFormField>
        </div>
      );
    }

    return null;
  };

  const labeled = labelApplicants(applicants);
  const activeLabel = labeled.find((a) => a.id === activeApplicantId)?.label ?? 'Applicant';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 relative">
      
      {/* Floating Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6 text-purple-600" />
            BOI Due Diligence Form
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete the verification details below to submit the CA assessment report.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleFillTestData} className="gap-1.5 h-10 border-purple-200 bg-purple-50 text-[#7e22ce] hover:bg-purple-100">
            <Sparkles className="h-4 w-4" />
            Fill Test Data
          </Button>
        </div>
      </div>

      {/* Applicant tabs switcher (larger touch targets + status dots on mobile, same on desktop) */}
      <BoiApplicantTabsBar
        applicants={labeled}
        activeApplicantId={activeApplicantId}
        onSwitch={handleSwitchApplicant}
        onAdd={handleAddCoApplicant}
        onRemove={handleRemoveApplicant}
        canAdd={(applicants?.length || 1) < MAX_APPLICANTS}
        getStatus={(appId) => {
          const key = sections[currentStep]?.key;
          if (!key || key === 'start_page' || !caseData) return null;
          return deriveModuleStatus(caseData, appId, key);
        }}
      />

      {/* Condensed step title + progress, mobile only */}
      {sections[currentStep] && (
        <BoiMobileStepHeader
          icon={sections[currentStep].icon}
          title={sections[currentStep].title}
          stepIndex={currentStep}
          stepCount={sections.length}
        />
      )}

      {/* Stepper Progress Indicator (tablet/desktop) */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
          <span className="flex items-center gap-1 bg-purple-50 text-[#7e22ce] px-2.5 py-1 rounded-full text-[11px] font-bold">
            Step {currentStep + 1} of {sections.length}
          </span>
          <span className="text-gray-500 font-medium">
            {Math.round(((currentStep + 1) / sections.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Horizontal Scrollable Tabs bar (tablet/desktop; mobile uses the condensed step header above) */}
      <div className="hidden sm:block overflow-x-auto custom-scrollbar pb-2">
        <div className="flex gap-2 min-w-max">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            const isCurrent = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <button
                key={section.key}
                type="button"
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 border ${
                  isCurrent
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : isCompleted
                      ? 'bg-purple-50 text-[#7e22ce] border-purple-200 hover:bg-purple-100'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                }`}
                onClick={() => {
                  let currentCase = caseData;
                  if (currentCase) {
                    const nextCase = mapFormStateToCase(formState, currentCase, activeApplicantId || 'primary');
                    loadCaseData(nextCase);
                  }
                  setCurrentStep(index);
                }}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{section.title}</span>
                {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-purple-700 fill-purple-100" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Form Content Wrapper */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm min-h-[300px]">
        {sections[currentStep] && (
          <div className="hidden sm:flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
            {React.createElement(sections[currentStep].icon, { className: "w-5 h-5 text-purple-600" })}
            <h2 className="text-base font-bold text-gray-900">
              {sections[currentStep].title}
            </h2>
          </div>
        )}
        {renderCurrentStep()}
      </div>

      {/* Bottom Action Buttons (tablet/desktop; mobile uses the fixed sticky nav below) */}
      <div className="hidden sm:flex p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isSubmittingReport}
          className="gap-1.5 h-10 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 w-full sm:w-auto justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={savingDraft || isSubmittingReport}
            className="gap-1.5 h-10 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none justify-center"
          >
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin text-purple-600" /> : <Save className="h-4 w-4" />}
            {savingDraft ? 'Saving Draft...' : 'Save Draft'}
          </Button>

          {currentStep === sections.length - 1 ? (
            <Button
              type="button"
              onClick={handleSubmitReport}
              disabled={savingDraft || isSubmittingReport}
              className="gap-1.5 h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm flex-1 sm:flex-none justify-center"
            >
              {isSubmittingReport ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <FileDown className="h-4 w-4" />}
              {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmittingReport}
              className="gap-1.5 h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm flex-1 sm:flex-none justify-center"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Fixed bottom nav bar, mobile only — wraps the same handlers as above */}
      <BoiStickyMobileNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmitReport}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === sections.length - 1}
        savingDraft={savingDraft}
        busy={isSubmittingReport}
      />

      {/* Background submission loader overlay */}
      {isSubmittingReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-white gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
          <p className="text-sm font-semibold">Generating PDF & submitting for admin approval...</p>
        </div>
      )}

    </div>
  );
}

function BoiGuarantorOpinionInput({ value, onChange }) {
  return (
    <BoiFormField label="Guarantor Opinion (Verdict)" required>
      <div className="flex flex-wrap gap-4 pt-1">
        {[
          { v: 'positive', l: 'Positive' },
          { v: 'negative', l: 'Negative' },
          { v: 'na', l: 'Not Applicable' },
        ].map((opt) => (
          <label key={opt.v} className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="fbGuarantorOpinion"
              value={opt.v}
              checked={value === opt.v}
              onChange={() => onChange(opt.v)}
              className="text-[#7e22ce] focus:ring-[#7e22ce] w-4 h-4 border-gray-300"
            />
            <span className="text-sm text-gray-800">{opt.l}</span>
          </label>
        ))}
      </div>
    </BoiFormField>
  );
}
