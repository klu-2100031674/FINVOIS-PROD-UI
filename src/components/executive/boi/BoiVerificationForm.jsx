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
  ClipboardCheck,
  Save,
  FileDown,
  Sparkles,
  UserPlus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Lock,
  Eye,
  ArrowLeft,
  UploadCloud,
  CheckCircle,
} from 'lucide-react';
import { useBoiVerification } from '../../../context/BoiVerificationContext';
import { useExecutiveDraft } from '../../../hooks/useExecutiveDraft';
import useAuth from '../../../hooks/useAuth';
import { executiveAPI } from '../../../api/executiveAPI';
import { executiveReportsPath } from '../../../utils/routePaths';
import {
  DEFAULT_BANK_NAME,
  REPORT_DEFAULTS,
  emptyModules,
  generateCaseId,
  deriveCaseStatus,
  isPropertyLoanType,
  labelApplicants,
  validateBoiCaseForGenerate,
  NON_EMPLOYED_CATEGORIES,
} from '../../../utils/boi/boiVerificationSchema';
import { exportBoiPdf } from '../../../utils/boi/boiPdfExport';
import BoiReportDocument from './BoiReportDocument';
import {
  boiInputClass,
  boiSelectClass,
  boiTextareaClass,
  BoiFormField,
  BoiYesNoRadio,
  BoiTriRadio,
  BoiTalliedRadio,
  BoiSelectField,
} from './boiFormShared';
import { Button } from '../../common';

const LOAN_TYPES = ['Home Loan', 'Mortgage Loan', 'Business Loan', 'Personal Loan', 'Vehicle Loan', 'Education Loan'];
const GENDER_OPTIONS = ['male', 'female', 'other'];
const RESIDENT_STATUS_OPTIONS = ['resident', 'nri', 'foreign_national'];
const MARITAL_STATUS_OPTIONS = ['single', 'married', 'divorced', 'widowed'];
const EMPLOYMENT_CATEGORIES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'self_employed', label: 'Self Employed Professional' },
  { value: 'housewife', label: 'Housewife' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
];

const RES_NATURE_OPTIONS = ['Owned', 'Rented', 'Ancestral', 'Company Provided', 'Other'];
const RES_TYPE_OPTIONS = ['Flat', 'Independent House', 'Villa', 'Chawl', 'Other'];
const RES_RELATION_OPTIONS = ['Self', 'Spouse', 'Father', 'Mother', 'Sibling', 'Landlord', 'Other'];
const RES_LOCALITY_OPTIONS = ['Residential', 'Commercial', 'Industrial', 'Slum', 'Rural'];
const RES_LIVING_STANDARD_OPTIONS = ['Upper Class', 'Upper Middle', 'Middle Class', 'Lower Middle', 'Lower Class'];
const RES_ACCESSIBILITY_OPTIONS = ['Easy', 'Moderate', 'Difficult'];

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

const initialFormState = {
  loanType: '',
  bankName: DEFAULT_BANK_NAME,
  branchName: '',
  loanAmount: '',
  borrowerName: '',
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
  caSignatureDataUrl: '',
  givenAddress: '',
  presentAddress: '',
  addressTallied: '',
  stayConfirmed: '',
  stayingSince: '',
  tenureStatus: '',
  rentAmount: '',
  landlordName: '',
  houseType: '',
  structureType: '',
  plinthAreaSqft: '',
  localityType: '',
  landmark: '',
  namePlateSeen: '',
  namePlateMatches: '',
  houseLocked: '',
  locksReason: '',
  neighboursContacted: '',
  neighbourFeedback: '',
  mismatchDetails: '',
  residenceConfirmation: '',
  employmentCategory: '',
  companyName: '',
  companyAddress: '',
  workContact: '',
  designation: '',
  yearsOfService: '',
  natureOfBusiness: '',
  natureOfBusinessOther: '',
  officialEmailId: '',
  companyWebsite: '',
  nameBoardSighted: '',
  detailsOfSighting: '',
  metEmployee: '',
  employeesContacted: '',
  employeeNotes: '',
  businessRegistrationNumber: '',
  registrationAuthority: '',
  panPortalNumber: '',
  panPortalStatus: '',
  panPortalName: '',
  panPortalTally: '',
  panPortalMatchRemarks: '',
  panFinalStatus: '',
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
  bizActivitySeen: '',
  bizRawMaterialsSeen: '',
  bizMachinerySeen: '',
  bizRemarks: '',
  bizOfficeAddressCorrect: '',
  bizNameBoardSighted: '',
  bizEmployeesSeen: '',
  bizTotalEmployees: '',
  bizFeedbackFromCustomers: '',
  bizFeedbackDetails: '',
  bizNote: '',
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
  applicantPhotos: [],
  coApplicantPhotos: [],
  residencePhotos: [],
  employmentPhotos: [],
  identityDocs: [],
  incomeDocs: [],
  additionalDocs: [],
  fbPersonalDetails: '',
  fbResidenceVerification: '',
  fbTelephoneVerification: '',
  fbIncomeProof: '',
  fbItReturn: '',
  fbEmployerOffice: '',
  fbPlaceOfBusiness: '',
  fbBankDetails: '',
  fbOtherDetails: '',
  fbOverallFeedbackNote: '',
  fbGuarantorDetailsPresent: 'no',
  fbGuarantorName: '',
  fbGuarantorAddress: '',
  fbGuarantorVerified: '',
  fbGuarantorOpinion: '',
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

  const modules = caseObj.modules?.[applicantId];
  if (!modules) return state;

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
  state.udinNumber = general.udinNumber ?? REPORT_DEFAULTS.udinNumber;
  state.caName = general.caName ?? REPORT_DEFAULTS.caName;
  state.dateOfVerification = general.dateOfVerification ?? '';
  state.dateOfReportSubmission = general.dateOfReportSubmission ?? '';
  state.caSignatureDataUrl = general.caSignatureDataUrl ?? '';

  const residence = modules.residence?.residence ?? {};
  state.givenAddress = residence.givenAddress ?? '';
  state.presentAddress = residence.presentAddress ?? '';
  state.addressTallied = residence.addressTallied ?? '';
  state.stayConfirmed = residence.stayConfirmed ?? '';
  state.stayingSince = residence.stayingSince ?? '';
  state.tenureStatus = residence.tenureStatus ?? '';
  state.rentAmount = residence.rentAmount ?? '';
  state.landlordName = residence.landlordName ?? '';
  state.houseType = residence.houseType ?? '';
  state.structureType = residence.structureType ?? '';
  state.plinthAreaSqft = residence.plinthAreaSqft ?? '';
  state.localityType = residence.localityType ?? '';
  state.landmark = residence.landmark ?? '';
  state.namePlateSeen = residence.namePlateSeen ?? '';
  state.namePlateMatches = residence.namePlateMatches ?? '';
  state.houseLocked = residence.houseLocked ?? '';
  state.locksReason = residence.locksReason ?? '';
  state.neighboursContacted = residence.neighboursContacted ?? '';
  state.neighbourFeedback = residence.neighbourFeedback ?? '';
  state.mismatchDetails = residence.mismatchDetails ?? '';
  state.residenceConfirmation = residence.residenceConfirmation ?? '';

  const employment = modules.employment?.employment ?? {};
  state.employmentCategory = employment.employmentCategory ?? '';
  state.companyName = employment.companyName ?? '';
  state.companyAddress = employment.companyAddress ?? '';
  state.workContact = employment.workContact ?? '';
  state.designation = employment.designation ?? '';
  state.yearsOfService = employment.yearsOfService ?? '';
  state.natureOfBusiness = employment.natureOfBusiness ?? '';
  state.natureOfBusinessOther = employment.natureOfBusinessOther ?? '';
  state.officialEmailId = employment.officialEmailId ?? '';
  state.companyWebsite = employment.companyWebsite ?? '';
  state.nameBoardSighted = employment.nameBoardSighted ?? '';
  state.detailsOfSighting = employment.detailsOfSighting ?? '';
  state.metEmployee = employment.metEmployee ?? '';
  state.employeesContacted = employment.employeesContacted ?? '';
  state.employeeNotes = employment.employeeNotes ?? '';
  state.businessRegistrationNumber = employment.businessRegistrationNumber ?? '';
  state.registrationAuthority = employment.registrationAuthority ?? '';

  const pan = modules.pan?.pan ?? {};
  state.panPortalNumber = pan.panNumber ?? '';
  state.panPortalStatus = pan.statusOnPortal ?? '';
  state.panPortalName = pan.nameOnPortal ?? '';
  state.panPortalTally = pan.portalTally ?? '';
  state.panPortalMatchRemarks = pan.portalMatchRemarks ?? '';
  state.panFinalStatus = pan.finalStatus ?? '';

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
  state.salaryTaxPaidRemarks = salary.taxPaidRemarks ?? '';

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
  state.bizActivitySeen = business.businessActivitySeen ?? '';
  state.bizRawMaterialsSeen = business.rawMaterialsSeen ?? '';
  state.bizMachinerySeen = business.machinerySeen ?? '';
  state.bizRemarks = business.businessRemarks ?? '';
  state.bizOfficeAddressCorrect = business.officeAddressCorrect ?? '';
  state.bizNameBoardSighted = business.nameBoardSighted ?? '';
  state.bizEmployeesSeen = business.employeesSeen ?? '';
  state.bizTotalEmployees = business.totalEmployees ?? '';
  state.bizFeedbackFromCustomers = business.feedbackFromCustomers ?? '';
  state.bizFeedbackDetails = business.feedbackDetails ?? '';
  state.bizNote = business.businessNote ?? '';

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
  state.propLayoutApproved = property.layoutApproved ?? '';
  state.propPropertyLandmark = property.propertyLandmark ?? '';
  state.propLocationAccessibility = property.locationAccessibility ?? '';
  state.propVehicleAccessType = property.vehicleAccessType ?? '';
  state.propNeighborPropertyFeedback = property.neighborPropertyFeedback ?? '';

  const evidence = modules.evidence?.evidence ?? {};
  state.applicantPhotos = evidence.applicantPhotos ?? [];
  state.coApplicantPhotos = evidence.coApplicantPhotos ?? [];
  state.residencePhotos = evidence.residencePhotos ?? [];
  state.employmentPhotos = evidence.employmentPhotos ?? [];
  state.identityDocs = evidence.identityDocs ?? [];
  state.incomeDocs = evidence.incomeDocs ?? [];
  state.additionalDocs = evidence.additionalDocs ?? [];

  const feedback = modules.feedback?.feedback ?? {};
  state.fbPersonalDetails = feedback.personalDetails ?? '';
  state.fbResidenceVerification = feedback.residenceVerification ?? '';
  state.fbTelephoneVerification = feedback.telephoneVerification ?? '';
  state.fbIncomeProof = feedback.incomeProof ?? '';
  state.fbItReturn = feedback.itReturn ?? '';
  state.fbEmployerOffice = feedback.employerOffice ?? '';
  state.fbPlaceOfBusiness = feedback.placeOfBusiness ?? '';
  state.fbBankDetails = feedback.bankDetails ?? '';
  state.fbOtherDetails = feedback.otherDetails ?? '';
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
  };

  if (!updatedCase.modules) updatedCase.modules = {};
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
      employmentType: state.employmentType,
      udinNumber: state.udinNumber,
      caName: state.caName,
      dateOfVerification: state.dateOfVerification,
      dateOfReportSubmission: state.dateOfReportSubmission,
      caSignatureDataUrl: state.caSignatureDataUrl,
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
      landlordName: state.landlordName,
      houseType: state.houseType,
      structureType: state.structureType,
      plinthAreaSqft: state.plinthAreaSqft,
      localityType: state.localityType,
      landmark: state.landmark,
      namePlateSeen: state.namePlateSeen,
      namePlateMatches: state.namePlateMatches,
      houseLocked: state.houseLocked,
      locksReason: state.locksReason,
      neighboursContacted: state.neighboursContacted,
      neighbourFeedback: state.neighbourFeedback,
      mismatchDetails: state.mismatchDetails,
      residenceConfirmation: state.residenceConfirmation,
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
      natureOfBusinessOther: state.natureOfBusinessOther,
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
      businessActivitySeen: state.bizActivitySeen,
      rawMaterialsSeen: state.bizRawMaterialsSeen,
      machinerySeen: state.bizMachinerySeen,
      businessRemarks: state.bizRemarks,
      officeAddressCorrect: state.bizOfficeAddressCorrect,
      nameBoardSighted: state.bizNameBoardSighted,
      employeesSeen: state.bizEmployeesSeen,
      totalEmployees: state.bizTotalEmployees,
      feedbackFromCustomers: state.bizFeedbackFromCustomers,
      feedbackDetails: state.bizFeedbackDetails,
      businessNote: state.bizNote,
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
      layoutApproved: state.propLayoutApproved,
      propertyLandmark: state.propPropertyLandmark,
      locationAccessibility: state.propLocationAccessibility,
      vehicleAccessType: state.propVehicleAccessType,
      neighborPropertyFeedback: state.propNeighborPropertyFeedback,
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

  appMods.feedback = {
    status: 'completed',
    feedback: {
      personalDetails: state.fbPersonalDetails,
      residenceVerification: state.fbResidenceVerification,
      telephoneVerification: state.fbTelephoneVerification,
      incomeProof: state.fbIncomeProof,
      itReturn: state.fbItReturn,
      employerOffice: state.fbEmployerOffice,
      placeOfBusiness: state.fbPlaceOfBusiness,
      bankDetails: state.fbBankDetails,
      otherDetails: state.fbOtherDetails,
      overallFeedbackNote: state.fbOverallFeedbackNote,
      guarantorDetailsPresent: state.fbGuarantorDetailsPresent,
      guarantorName: state.fbGuarantorName,
      guarantorAddress: state.fbGuarantorAddress,
      guarantorVerified: state.fbGuarantorVerified,
      guarantorOpinion: state.fbGuarantorOpinion,
    },
  };

  updatedCase.status = deriveCaseStatus(updatedCase);
  return updatedCase;
}

function fillFormStateWithTestData(user, state) {
  return {
    ...state,
    loanType: 'Home Loan',
    bankName: 'Bank of India',
    branchName: 'Mumbai - Andheri East',
    loanAmount: '2500000',
    borrowerName: 'Ravi Kumar',
    fatherHusbandName: 'Suresh Kumar',
    gender: 'male',
    residentStatus: 'resident',
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123412341234',
    dateOfBirth: '1995-08-15',
    qualification: 'Graduate',
    maritalStatus: 'married',
    employmentType: 'Salaried',
    udinNumber: '26222863ABCDEF0001',
    caName: user?.verified_by || 'PARVEZ MOHAMMED',
    dateOfVerification: todayISO(),
    dateOfReportSubmission: todayISO(),
    caSignatureDataUrl: '',
    givenAddress: 'Flat 402, Sunrise Apartments, MG Road, Andheri East, Mumbai - 400069',
    presentAddress: 'Flat 402, Sunrise Apartments, MG Road, Andheri East, Mumbai - 400069',
    addressTallied: 'yes',
    stayConfirmed: 'yes',
    stayingSince: '6',
    tenureStatus: 'Owned',
    rentAmount: '',
    landlordName: '',
    houseType: 'Flat',
    structureType: 'Pucca',
    plinthAreaSqft: '1200',
    localityType: 'Residential',
    landmark: "Opposite St. Mary's School",
    namePlateSeen: 'yes',
    namePlateMatches: 'yes',
    houseLocked: 'no',
    locksReason: '',
    neighboursContacted: 'yes',
    neighbourFeedback: 'Confirm stay and good conduct',
    mismatchDetails: '',
    residenceConfirmation: 'Stay confirmed by neighbour',
    employmentCategory: 'salaried',
    companyName: 'Infotech Solutions Pvt Ltd',
    companyAddress: 'Tower B, 7th Floor, Hiranandani Business Park, Powai, Mumbai - 400076',
    workContact: '02240501234',
    designation: 'Senior Software Engineer',
    yearsOfService: '4',
    natureOfBusiness: 'Servicing',
    natureOfBusinessOther: '',
    officialEmailId: 'hr@infotechsolutions.com',
    companyWebsite: 'www.infotechsolutions.com',
    nameBoardSighted: 'yes',
    detailsOfSighting: 'Company logo displayed at entrance',
    metEmployee: 'yes',
    employeesContacted: 'HR Manager',
    employeeNotes: 'Confirmed details',
    businessRegistrationNumber: 'U72900MH2019PTC321456',
    registrationAuthority: 'MCA',
    panPortalNumber: 'ABCDE1234F',
    panPortalStatus: 'Active',
    panPortalName: 'Ravi Kumar',
    panPortalTally: 'yes',
    panPortalMatchRemarks: '100% Match',
    panFinalStatus: 'confirmed',
    salaryCompanyName: 'Infotech Solutions Pvt Ltd',
    salaryDesignation: 'Senior Software Engineer',
    salaryYearsOfService: '4',
    salaryServiceConfirmed: 'yes',
    salaryServiceTallyRemarks: 'Confirmed with salary slip',
    salaryGrossMonthlyIncome: '120000',
    salaryMonthlyAllowances: '20000',
    salaryDeductions: '10000',
    salaryNetMonthlyTakeHome: '110000',
    salaryForm16Issued: 'yes',
    salaryPayslipsAvailable: 'yes',
    salaryBankStatementsAvailable: 'yes',
    salaryTotalIncome: '1440000',
    salaryNetTaxPayable: '120000',
    salaryTaxPaidRemarks: 'Tax deducted at source',
    docSealOfOrganization: 'tallied',
    docSignatureOfAuthority: 'tallied',
    docSalarySlipDateAmount: 'tallied',
    docOfficeAddressCorrect: 'tallied',
    docOtherDocName1: 'Offer Letter',
    docOtherDocTally1: 'tallied',
    docOtherDocName2: 'Aadhaar Card',
    docOtherDocTally2: 'tallied',
    bizActivitySeen: 'yes',
    bizRawMaterialsSeen: 'na',
    bizMachinerySeen: 'na',
    bizRemarks: 'Workplace is fully operational with active staff',
    bizOfficeAddressCorrect: 'tallied',
    bizNameBoardSighted: 'yes',
    bizEmployeesSeen: '8',
    bizTotalEmployees: '10',
    bizFeedbackFromCustomers: 'positive',
    bizFeedbackDetails: 'Good reputation',
    bizNote: 'Stable business operation',
    propAddressOfProperty: 'Plot 17, Green Valley Township, Sarjapur Road, Bengaluru - 560035',
    propAddressMatchesApplication: 'yes',
    propLandAreaSqft: '2400',
    propBoundEast: 'Plot 18',
    propBoundWest: 'Road',
    propBoundNorth: 'Plot 16',
    propBoundSouth: 'Plot 32',
    propBoundaryMatch: 'yes',
    propAreaMatch: 'yes',
    propConstructionStatus: 'Completed',
    propLayoutApproved: 'yes',
    propPropertyLandmark: 'Near Sarjapur Police Station',
    propLocationAccessibility: 'good',
    propVehicleAccessType: 'Four Wheeler',
    propNeighborPropertyFeedback: 'Clean title and approved layout',
    fbPersonalDetails: 'positive',
    fbResidenceVerification: 'positive',
    fbTelephoneVerification: 'positive',
    fbIncomeProof: 'positive',
    fbItReturn: 'positive',
    fbEmployerOffice: 'positive',
    fbPlaceOfBusiness: 'na',
    fbBankDetails: 'positive',
    fbOtherDetails: 'positive',
    fbOverallFeedbackNote: 'Due diligence outcome is positive and satisfactory.',
    fbGuarantorDetailsPresent: 'no',
    fbGuarantorName: '',
    fbGuarantorAddress: '',
    fbGuarantorVerified: '',
    fbGuarantorOpinion: '',
  };
}

export default function BoiVerificationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    caseData,
    cases,
    loadCaseData,
    applicants,
    activeApplicantId,
    setActiveApplicant,
    addCoApplicant,
    removeApplicant,
isSubmittingReport,
    setIsSubmittingReport,
  } = useBoiVerification();

  const [formState, setFormState] = useState(initialFormState);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRefs = useRef({});
  const viewportRef = useRef(null);
  const pdfRef = useRef(null);

  const { saveDraft, savingDraft } = useExecutiveDraft('boi', {
    onRestore: ({ form: restored }) => {
      if (restored) {
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

  const updateField = (key, val) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
  };

  const isBusinessCategory = formState.employmentCategory === 'business_owner' || formState.employmentCategory === 'self_employed';
  const isEmployed = !NON_EMPLOYED_CATEGORIES.includes(formState.employmentCategory);
  const isSalaryApplicable = isEmployed && !isBusinessCategory;
  const isPropertyApplicable = isPropertyLoanType(formState.loanType);

  const sections = useMemo(() => {
    const isPrimary = activeApplicantId === 'primary' || !activeApplicantId;
    const list = [
      { key: 'case', title: 'Case Details', icon: Landmark, applicable: isPrimary },
      { key: 'general', title: 'General Details', icon: ClipboardList, applicable: true },
      { key: 'residence', title: 'Residence', icon: Home, applicable: true },
      { key: 'employment', title: 'Employment', icon: Briefcase, applicable: true },
      { key: 'pan', title: 'PAN', icon: IdCard, applicable: true },
      { key: 'salary', title: 'Salary / Form-16', icon: Receipt, applicable: isSalaryApplicable },
      { key: 'documents', title: 'Documents', icon: FolderCheck, applicable: isSalaryApplicable },
      { key: 'business', title: 'Business', icon: Building2, applicable: isBusinessCategory },
      { key: 'property', title: 'Property', icon: MapPin, applicable: isPrimary && isPropertyApplicable },
      { key: 'evidence', title: 'Evidence', icon: ImageUp, applicable: isPrimary },
      { key: 'feedback', title: 'Feedback', icon: ClipboardCheck, applicable: isPrimary },
    ];
    return list.filter((s) => s.applicable);
  }, [activeApplicantId, isSalaryApplicable, isBusinessCategory, isPropertyApplicable]);

  // Adjust currentStep if it goes out of bounds when sections change
  useEffect(() => {
    if (currentStep >= sections.length) {
      setCurrentStep(Math.max(0, sections.length - 1));
    }
  }, [sections, currentStep]);

  const handleNext = () => {
    if (currentStep < sections.length - 1) {
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
    nextCase.activeApplicantId = targetId;
    loadCaseData(nextCase);
    setActiveApplicant(targetId);
    setCurrentStep(0);
  };

  const handleAddCoApplicant = () => {
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
    loadCaseData(nextCase);
    addCoApplicant();
    setCurrentStep(0);
  };

  const handleRemoveApplicant = (targetId) => {
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
    const filled = fillFormStateWithTestData({ verified_by: 'PARVEZ MOHAMMED' }, formState);
    setFormState(filled);

    let currentCase = caseData;
    if (!currentCase) {
      const newId = generateCaseId(cases);
      currentCase = {
        id: newId,
        loanType: filled.loanType,
        bankName: filled.bankName || DEFAULT_BANK_NAME,
        branchName: filled.branchName,
        loanAmount: filled.loanAmount,
        createdAt: new Date().toISOString(),
        status: 'draft',
        applicants: [{ id: 'primary', isPrimary: true }],
        activeApplicantId: 'primary',
        modules: { primary: emptyModules() },
      };
    }
    const nextCase = mapFormStateToCase(filled, currentCase, activeApplicantId || 'primary');
    nextCase.status = 'in_progress';
    loadCaseData(nextCase);

    toast.success('Test data filled and loaded.');
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
    const errors = [];
    if (!finalCase.loanType) errors.push('Loan type is required.');
    if (!String(finalCase.branchName || '').trim()) errors.push('Branch name is required.');
    if (!finalCase.loanAmount || Number(finalCase.loanAmount) <= 0) errors.push('Loan amount must be greater than 0.');
    if (errors.length) {
      errors.forEach((e) => toast.error(e));
      return;
    }
    setIsSubmittingReport(true);
    loadCaseData(finalCase);
    try {
      await new Promise((r) => setTimeout(r, 300)); // let DOM update
      const pdfBlob = await exportBoiPdf(pdfRef, viewportRef);
      await executiveAPI.generateBoiReport(finalCase, pdfBlob);
      toast.success('Report submitted for admin approval!');
      navigate(executiveReportsPath(user));
    } catch (err) {
      console.error('[handleSubmitReport]', err);
      toast.error(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  }, [isSubmittingReport, caseData, formState, activeApplicantId, setIsSubmittingReport, loadCaseData, navigate, user]);

  const renderCurrentStep = () => {
    const activeSection = sections[currentStep]?.key;
    if (activeSection === 'case') {
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <BoiFormField label="Loan Type" required>
            <BoiSelectField
              value={formState.loanType}
              onChange={(v) => updateField('loanType', v)}
              options={LOAN_TYPES}
              placeholder="Select loan type"
            />
          </BoiFormField>
          <BoiFormField label="Bank Name" required>
            <input className={boiInputClass} value={formState.bankName} onChange={(e) => updateField('bankName', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Branch Name" required>
            <input className={boiInputClass} placeholder="e.g. Mumbai - Andheri East" value={formState.branchName} onChange={(e) => updateField('branchName', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Loan Amount (INR)" required>
            <input className={boiInputClass} type="number" placeholder="e.g. 2500000" value={formState.loanAmount} onChange={(e) => updateField('loanAmount', e.target.value)} />
          </BoiFormField>
        </div>
      );
    }

    if (activeSection === 'general') {
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <BoiFormField label="Borrower Name" required>
            <input className={boiInputClass} value={formState.borrowerName} onChange={(e) => updateField('borrowerName', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Father / Husband Name" required>
            <input className={boiInputClass} value={formState.fatherHusbandName} onChange={(e) => updateField('fatherHusbandName', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Gender" required>
            <BoiSelectField value={formState.gender} onChange={(v) => updateField('gender', v)} options={GENDER_OPTIONS} placeholder="Select gender" />
          </BoiFormField>
          <BoiFormField label="Resident Status" required>
            <BoiSelectField value={formState.residentStatus} onChange={(v) => updateField('residentStatus', v)} options={RESIDENT_STATUS_OPTIONS} placeholder="Select status" />
          </BoiFormField>
          <BoiFormField label="PAN Number" required>
            <input className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7e22ce] uppercase tracking-wider font-mono" placeholder="ABCDE1234F" value={formState.panNumber} onChange={(e) => updateField('panNumber', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Aadhaar Number" required>
            <input className={boiInputClass} placeholder="12 digit Aadhaar" value={formState.aadhaarNumber} onChange={(e) => updateField('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))} />
          </BoiFormField>
          <BoiFormField label="Date of Birth" required>
            <input type="date" className={boiInputClass} value={formState.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Qualification" required>
            <input className={boiInputClass} placeholder="e.g. Graduate" value={formState.qualification} onChange={(e) => updateField('qualification', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Marital Status" required>
            <BoiSelectField value={formState.maritalStatus} onChange={(v) => updateField('maritalStatus', v)} options={MARITAL_STATUS_OPTIONS} placeholder="Select status" />
          </BoiFormField>
          <BoiFormField label="Employment Category" required>
            <BoiSelectField value={formState.employmentCategory} onChange={(v) => updateField('employmentCategory', v)} options={EMPLOYMENT_CATEGORIES} placeholder="Select category" />
          </BoiFormField>
          <BoiFormField label="CA Registration Name" required>
            <input className={boiInputClass} value={formState.caName} onChange={(e) => updateField('caName', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="UDIN Number" required>
            <input className={boiInputClass} value={formState.udinNumber} onChange={(e) => updateField('udinNumber', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Date of Verification" required>
            <input type="date" className={boiInputClass} value={formState.dateOfVerification} onChange={(e) => updateField('dateOfVerification', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Date of Report Submission" required>
            <input type="date" className={boiInputClass} value={formState.dateOfReportSubmission} onChange={(e) => updateField('dateOfReportSubmission', e.target.value)} />
          </BoiFormField>
        </div>
      );
    }

    if (activeSection === 'residence') {
      return (
        <div className="space-y-6 text-left">
          <div className="grid gap-5 sm:grid-cols-2">
            <BoiFormField label="Given Address" required className="sm:col-span-2">
              <textarea rows={2} className={boiTextareaClass} value={formState.givenAddress} onChange={(e) => updateField('givenAddress', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Present Address" required className="sm:col-span-2">
              <textarea rows={2} className={boiTextareaClass} value={formState.presentAddress} onChange={(e) => updateField('presentAddress', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Address Tallied with Application" required>
              <BoiYesNoRadio name="addressTallied" value={formState.addressTallied} onChange={(v) => updateField('addressTallied', v)} />
            </BoiFormField>
            <BoiFormField label="Stay Confirmed" required>
              <BoiYesNoRadio name="stayConfirmed" value={formState.stayConfirmed} onChange={(v) => updateField('stayConfirmed', v)} />
            </BoiFormField>
            {formState.stayConfirmed === 'yes' && (
              <BoiFormField label="Staying Since (Years)">
                <input className={boiInputClass} placeholder="e.g. 5" value={formState.stayingSince} onChange={(e) => updateField('stayingSince', e.target.value)} />
              </BoiFormField>
            )}
            <BoiFormField label="Tenure Status" required>
              <BoiSelectField value={formState.tenureStatus} onChange={(v) => updateField('tenureStatus', v)} options={RES_NATURE_OPTIONS} placeholder="Select tenure" />
            </BoiFormField>
            {formState.tenureStatus === 'Rented' && (
              <BoiFormField label="Rent Amount (INR)">
                <input className={boiInputClass} type="number" placeholder="Monthly rent" value={formState.rentAmount} onChange={(e) => updateField('rentAmount', e.target.value)} />
              </BoiFormField>
            )}
            <BoiFormField label="House Structure Type" required>
              <BoiSelectField value={formState.houseType} onChange={(v) => updateField('houseType', v)} options={RES_TYPE_OPTIONS} placeholder="Select type" />
            </BoiFormField>
            <BoiFormField label="Area standard of construction">
              <input className={boiInputClass} placeholder="e.g. Pucca/Semi-Pucca" value={formState.structureType} onChange={(e) => updateField('structureType', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Plinth Area (Sqft)">
              <input className={boiInputClass} type="number" value={formState.plinthAreaSqft} onChange={(e) => updateField('plinthAreaSqft', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Locality Type">
              <BoiSelectField value={formState.localityType} onChange={(v) => updateField('localityType', v)} options={RES_LOCALITY_OPTIONS} placeholder="Select locality" />
            </BoiFormField>
            <BoiFormField label="Address Landmark">
              <input className={boiInputClass} value={formState.landmark} onChange={(e) => updateField('landmark', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Name Plate Sighted">
              <BoiYesNoRadio name="namePlateSeen" value={formState.namePlateSeen} onChange={(v) => updateField('namePlateSeen', v)} />
            </BoiFormField>
            {formState.namePlateSeen === 'yes' && (
              <BoiFormField label="Name Matches Borrower">
                <BoiYesNoRadio name="namePlateMatches" value={formState.namePlateMatches} onChange={(v) => updateField('namePlateMatches', v)} />
              </BoiFormField>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <BoiFormField label="Was the House Locked?">
              <BoiYesNoRadio name="houseLocked" value={formState.houseLocked} onChange={(v) => updateField('houseLocked', v)} />
            </BoiFormField>
            {formState.houseLocked === 'yes' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <BoiFormField label="Reason for Lock (as per neighbours)" className="sm:col-span-2">
                  <input className={boiInputClass} value={formState.locksReason} onChange={(e) => updateField('locksReason', e.target.value)} />
                </BoiFormField>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <BoiFormField label="Neighbours Contacted">
                <BoiYesNoRadio name="neighboursContacted" value={formState.neighboursContacted} onChange={(v) => updateField('neighboursContacted', v)} />
              </BoiFormField>
              <BoiFormField label="Neighbours / Reference Feedback">
                <input className={boiInputClass} placeholder="e.g. Confirmed stay and occupation" value={formState.neighbourFeedback} onChange={(e) => updateField('neighbourFeedback', e.target.value)} />
              </BoiFormField>
            </div>
          </div>

          {formState.addressTallied === 'no' && (
            <BoiFormField label="Mismatch / Deviation Details" className="border-l-4 border-amber-500 pl-3">
              <textarea rows={2} className={boiTextareaClass} placeholder="Reason for address mismatch" value={formState.mismatchDetails} onChange={(e) => updateField('mismatchDetails', e.target.value)} />
            </BoiFormField>
          )}

          <BoiFormField label="Residence Final Confirmation / Recommendation" required>
            <textarea rows={2} className={boiTextareaClass} placeholder="Summary of residence confirmation" value={formState.residenceConfirmation} onChange={(e) => updateField('residenceConfirmation', e.target.value)} />
          </BoiFormField>
        </div>
      );
    }

    if (activeSection === 'employment') {
      return (
        <div className="space-y-6 text-left">
          {!isEmployed ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for non-employed categories (Housewife, Student, Retired, Unemployed).
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <BoiFormField label="Employer / Business Name" required>
                <input className={boiInputClass} value={formState.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Office Address" required className="sm:col-span-2">
                <textarea rows={2} className={boiTextareaClass} value={formState.companyAddress} onChange={(e) => updateField('companyAddress', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Office Phone / Work Contact">
                <input className={boiInputClass} value={formState.workContact} onChange={(e) => updateField('workContact', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Designation" required>
                <input className={boiInputClass} value={formState.designation} onChange={(e) => updateField('designation', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Years in Business / Service" required>
                <input className={boiInputClass} placeholder="e.g. 3 years" value={formState.yearsOfService} onChange={(e) => updateField('yearsOfService', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Nature of Business">
                <input className={boiInputClass} placeholder="e.g. IT, Manufacturing" value={formState.natureOfBusiness} onChange={(e) => updateField('natureOfBusiness', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Official Email ID">
                <input className={boiInputClass} type="email" value={formState.officialEmailId} onChange={(e) => updateField('officialEmailId', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Company Website">
                <input className={boiInputClass} placeholder="e.g. www.company.com" value={formState.companyWebsite} onChange={(e) => updateField('companyWebsite', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Company Name Board Sighted" required>
                <BoiYesNoRadio name="nameBoardSighted" value={formState.nameBoardSighted} onChange={(v) => updateField('nameBoardSighted', v)} />
              </BoiFormField>
              {formState.nameBoardSighted === 'yes' && (
                <BoiFormField label="Details of Sighting">
                  <input className={boiInputClass} placeholder="e.g. Sign board at office entrance" value={formState.detailsOfSighting} onChange={(e) => updateField('detailsOfSighting', e.target.value)} />
                </BoiFormField>
              )}
              <BoiFormField label="Met Employee in Person" required>
                <BoiYesNoRadio name="metEmployee" value={formState.metEmployee} onChange={(v) => updateField('metEmployee', v)} />
              </BoiFormField>
              <BoiFormField label="Office / Reference Contacts Contacted">
                <input className={boiInputClass} placeholder="e.g. HR Manager / Supervisor" value={formState.employeesContacted} onChange={(e) => updateField('employeesContacted', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Verifier Verification Notes / Remarks" className="sm:col-span-2" required>
                <textarea rows={2} className={boiTextareaClass} value={formState.employeeNotes} onChange={(e) => updateField('employeeNotes', e.target.value)} />
              </BoiFormField>
              {isBusinessCategory && (
                <>
                  <BoiFormField label="Business Registration / GST No.">
                    <input className={boiInputClass} value={formState.businessRegistrationNumber} onChange={(e) => updateField('businessRegistrationNumber', e.target.value)} />
                  </BoiFormField>
                  <BoiFormField label="Registration Licensing Authority">
                    <input className={boiInputClass} value={formState.registrationAuthority} onChange={(e) => updateField('registrationAuthority', e.target.value)} />
                  </BoiFormField>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'pan') {
      return (
        <div className="grid gap-5 sm:grid-cols-2 text-left">
          <BoiFormField label="PAN Number (as on Portal)" required>
            <input className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7e22ce] uppercase tracking-wider font-mono" placeholder="ABCDE1234F" value={formState.panPortalNumber} onChange={(e) => updateField('panPortalNumber', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Portal Validation Status" required>
            <input className={boiInputClass} placeholder="e.g. Active / Valid" value={formState.panPortalStatus} onChange={(e) => updateField('panPortalStatus', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Name Match Tally" required>
            <BoiYesNoRadio name="panPortalTally" value={formState.panPortalTally} onChange={(v) => updateField('panPortalTally', v)} />
          </BoiFormField>
          <BoiFormField label="Name on Portal" required>
            <input className={boiInputClass} value={formState.panPortalName} onChange={(e) => updateField('panPortalName', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Tally / Match Remarks" className="sm:col-span-2">
            <input className={boiInputClass} value={formState.panPortalMatchRemarks} onChange={(e) => updateField('panPortalMatchRemarks', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Verification Final Outcome Status" required>
            <BoiSelectField value={formState.panFinalStatus} onChange={(v) => updateField('panFinalStatus', v)} options={[{ value: 'confirmed', label: 'Confirmed Authentic' }, { value: 'not_confirmed', label: 'Not Confirmed / Suspicious' }]} placeholder="Select status" />
          </BoiFormField>
        </div>
      );
    }

    if (activeSection === 'salary') {
      return (
        <div className="space-y-6 text-left">
          {!isSalaryApplicable ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for self-employed/business or non-employed applicants.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <BoiFormField label="Employer / Company Name" required>
                <input className={boiInputClass} value={formState.salaryCompanyName} onChange={(e) => updateField('salaryCompanyName', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Designation" required>
                <input className={boiInputClass} value={formState.salaryDesignation} onChange={(e) => updateField('salaryDesignation', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Service Tenure" required>
                <input className={boiInputClass} placeholder="e.g. 4 years" value={formState.salaryYearsOfService} onChange={(e) => updateField('salaryYearsOfService', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Service Status Confirmed" required>
                <BoiYesNoRadio name="salaryServiceConfirmed" value={formState.salaryServiceConfirmed} onChange={(v) => updateField('salaryServiceConfirmed', v)} />
              </BoiFormField>
              <BoiFormField label="Service Verification / Tally Remarks" className="sm:col-span-2">
                <input className={boiInputClass} placeholder="e.g. Confirmed with salary slips and HR database" value={formState.salaryServiceTallyRemarks} onChange={(e) => updateField('salaryServiceTallyRemarks', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Gross Monthly Income (INR)" required>
                <input className={boiInputClass} type="number" value={formState.salaryGrossMonthlyIncome} onChange={(e) => updateField('salaryGrossMonthlyIncome', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Monthly Allowances (INR)">
                <input className={boiInputClass} type="number" value={formState.salaryMonthlyAllowances} onChange={(e) => updateField('salaryMonthlyAllowances', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Monthly Deductions (PF/Tax) (INR)">
                <input className={boiInputClass} type="number" value={formState.salaryDeductions} onChange={(e) => updateField('salaryDeductions', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Net Monthly Take-Home (INR)" required>
                <input className={boiInputClass} type="number" value={formState.salaryNetMonthlyTakeHome} onChange={(e) => updateField('salaryNetMonthlyTakeHome', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Form-16 Issued?" required>
                <BoiYesNoRadio name="salaryForm16Issued" value={formState.salaryForm16Issued} onChange={(v) => updateField('salaryForm16Issued', v)} />
              </BoiFormField>
              <BoiFormField label="Payslips Verified?" required>
                <BoiYesNoRadio name="salaryPayslipsAvailable" value={formState.salaryPayslipsAvailable} onChange={(v) => updateField('salaryPayslipsAvailable', v)} />
              </BoiFormField>
              <BoiFormField label="Bank Statement Match?" required>
                <BoiYesNoRadio name="salaryBankStatementsAvailable" value={formState.salaryBankStatementsAvailable} onChange={(v) => updateField('salaryBankStatementsAvailable', v)} />
              </BoiFormField>
              <BoiFormField label="Total Annual Income (INR)">
                <input className={boiInputClass} type="number" value={formState.salaryTotalIncome} onChange={(e) => updateField('salaryTotalIncome', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Net Tax Payable (INR)">
                <input className={boiInputClass} type="number" value={formState.salaryNetTaxPayable} onChange={(e) => updateField('salaryNetTaxPayable', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Tax Payment / Remarks" className="sm:col-span-2">
                <input className={boiInputClass} value={formState.salaryTaxPaidRemarks} onChange={(e) => updateField('salaryTaxPaidRemarks', e.target.value)} />
              </BoiFormField>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'documents') {
      return (
        <div className="space-y-6 text-left">
          {!isEmployed ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for non-employed applicants.
            </div>
          ) : (
            <div className="space-y-4">
              <BoiFormField label="Seal of Organization Sighted/Tallied" required>
                <BoiTalliedRadio name="docSealOfOrganization" value={formState.docSealOfOrganization} onChange={(v) => updateField('docSealOfOrganization', v)} />
              </BoiFormField>
              <BoiFormField label="Signature of Issuing Authority Sighted/Tallied" required>
                <BoiTalliedRadio name="docSignatureOfAuthority" value={formState.docSignatureOfAuthority} onChange={(v) => updateField('docSignatureOfAuthority', v)} />
              </BoiFormField>
              <BoiFormField label="Dates & Amounts on Payslips Match Records" required>
                <BoiTalliedRadio name="docSalarySlipDateAmount" value={formState.docSalarySlipDateAmount} onChange={(v) => updateField('docSalarySlipDateAmount', v)} />
              </BoiFormField>
              <BoiFormField label="Office Address Confirmed Correct" required>
                <BoiTalliedRadio name="docOfficeAddressCorrect" value={formState.docOfficeAddressCorrect} onChange={(v) => updateField('docOfficeAddressCorrect', v)} />
              </BoiFormField>

              <div className="pt-4 border-t border-gray-100 grid gap-4 sm:grid-cols-2">
                <BoiFormField label="Other Document 1 Name">
                  <input className={boiInputClass} placeholder="e.g. Appointment Letter" value={formState.docOtherDocName1} onChange={(e) => updateField('docOtherDocName1', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="Other Document 1 Tally Status">
                  <BoiTalliedRadio name="docOtherDocTally1" value={formState.docOtherDocTally1} onChange={(v) => updateField('docOtherDocTally1', v)} />
                </BoiFormField>
                <BoiFormField label="Other Document 2 Name">
                  <input className={boiInputClass} placeholder="e.g. Degree Certificate" value={formState.docOtherDocName2} onChange={(e) => updateField('docOtherDocName2', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="Other Document 2 Tally Status">
                  <BoiTalliedRadio name="docOtherDocTally2" value={formState.docOtherDocTally2} onChange={(v) => updateField('docOtherDocTally2', v)} />
                </BoiFormField>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'business') {
      return (
        <div className="space-y-6 text-left">
          {!isBusinessCategory ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for salaried or non-employed applicants.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <BoiFormField label="Business Activity Observed" required>
                <BoiYesNoRadio name="bizActivitySeen" value={formState.bizActivitySeen} onChange={(v) => updateField('bizActivitySeen', v)} />
              </BoiFormField>
              <BoiFormField label="Raw Materials Sighted" required>
                <BoiTriRadio name="bizRawMaterialsSeen" value={formState.bizRawMaterialsSeen} onChange={(v) => updateField('bizRawMaterialsSeen', v)} />
              </BoiFormField>
              <BoiFormField label="Machinery / Office Assets Seen" required>
                <BoiTriRadio name="bizMachinerySeen" value={formState.bizMachinerySeen} onChange={(v) => updateField('bizMachinerySeen', v)} />
              </BoiFormField>
              <BoiFormField label="Name Board Sighted" required>
                <BoiYesNoRadio name="bizNameBoardSighted" value={formState.bizNameBoardSighted} onChange={(v) => updateField('bizNameBoardSighted', v)} />
              </BoiFormField>
              <BoiFormField label="Employees Sighted on Site" required>
                <BoiYesNoRadio name="bizEmployeesSeen" value={formState.bizEmployeesSeen} onChange={(v) => updateField('bizEmployeesSeen', v)} />
              </BoiFormField>
              {formState.bizEmployeesSeen === 'yes' && (
                <BoiFormField label="Total Number of Employees">
                  <input className={boiInputClass} type="number" value={formState.bizTotalEmployees} onChange={(e) => updateField('bizTotalEmployees', e.target.value)} />
                </BoiFormField>
              )}
              <BoiFormField label="Customer Feedback Obtained" required>
                <BoiTriRadio name="bizFeedbackFromCustomers" value={formState.bizFeedbackFromCustomers} onChange={(v) => updateField('bizFeedbackFromCustomers', v)} />
              </BoiFormField>
              <BoiFormField label="Customer Feedback Details" className="sm:col-span-2">
                <input className={boiInputClass} value={formState.bizFeedbackDetails} onChange={(e) => updateField('bizFeedbackDetails', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Business Premises Verification Remarks" className="sm:col-span-2" required>
                <textarea rows={2} className={boiTextareaClass} value={formState.bizRemarks} onChange={(e) => updateField('bizRemarks', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Business Final Remarks / Note" className="sm:col-span-2" required>
                <textarea rows={2} className={boiTextareaClass} value={formState.bizNote} onChange={(e) => updateField('bizNote', e.target.value)} />
              </BoiFormField>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'property') {
      return (
        <div className="space-y-6 text-left">
          {!isPropertyApplicable ? (
            <div className="p-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
              Not applicable for selected Loan Type. Required only for Home Loan and Mortgage Loan.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <BoiFormField label="Address of Property" required className="sm:col-span-2">
                <textarea rows={2} className={boiTextareaClass} value={formState.propAddressOfProperty} onChange={(e) => updateField('propAddressOfProperty', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Address Matches Application" required>
                <BoiYesNoRadio name="propAddressMatchesApplication" value={formState.propAddressMatchesApplication} onChange={(v) => updateField('propAddressMatchesApplication', v)} />
              </BoiFormField>
              <BoiFormField label="Land Area (Sqft)" required>
                <input className={boiInputClass} type="number" value={formState.propLandAreaSqft} onChange={(e) => updateField('propLandAreaSqft', e.target.value)} />
              </BoiFormField>
              <div className="sm:col-span-2 border-t border-gray-100 pt-4 grid gap-4 sm:grid-cols-2">
                <BoiFormField label="Boundary East">
                  <input className={boiInputClass} value={formState.propBoundEast} onChange={(e) => updateField('propBoundEast', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="Boundary West">
                  <input className={boiInputClass} value={formState.propBoundWest} onChange={(e) => updateField('propBoundWest', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="Boundary North">
                  <input className={boiInputClass} value={formState.propBoundNorth} onChange={(e) => updateField('propBoundNorth', e.target.value)} />
                </BoiFormField>
                <BoiFormField label="Boundary South">
                  <input className={boiInputClass} value={formState.propBoundSouth} onChange={(e) => updateField('propBoundSouth', e.target.value)} />
                </BoiFormField>
              </div>
              <BoiFormField label="Boundaries Match Records" required>
                <BoiYesNoRadio name="propBoundaryMatch" value={formState.propBoundaryMatch} onChange={(v) => updateField('propBoundaryMatch', v)} />
              </BoiFormField>
              <BoiFormField label="Measurement Area Matches" required>
                <BoiYesNoRadio name="propAreaMatch" value={formState.propAreaMatch} onChange={(v) => updateField('propAreaMatch', v)} />
              </BoiFormField>
              <BoiFormField label="Construction Status" required>
                <input className={boiInputClass} placeholder="e.g. Under Construction / Completed" value={formState.propConstructionStatus} onChange={(e) => updateField('propConstructionStatus', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Layout Approved?" required>
                <BoiYesNoRadio name="propLayoutApproved" value={formState.propLayoutApproved} onChange={(v) => updateField('propLayoutApproved', v)} />
              </BoiFormField>
              <BoiFormField label="Property Landmark">
                <input className={boiInputClass} value={formState.propPropertyLandmark} onChange={(e) => updateField('propPropertyLandmark', e.target.value)} />
              </BoiFormField>
              <BoiFormField label="Location Accessibility" required>
                <BoiSelectField value={formState.propLocationAccessibility} onChange={(v) => updateField('propLocationAccessibility', v)} options={['good', 'satisfactory', 'difficult']} placeholder="Select access" />
              </BoiFormField>
              <BoiFormField label="Vehicle Access Type" required>
                <BoiSelectField value={formState.propVehicleAccessType} onChange={(v) => updateField('propVehicleAccessType', v)} options={['Four Wheeler', 'Two Wheeler', 'No Access']} placeholder="Select vehicle access" />
              </BoiFormField>
              <BoiFormField label="Neighbor Property / Locality Feedback" className="sm:col-span-2" required>
                <textarea rows={2} className={boiTextareaClass} value={formState.propNeighborPropertyFeedback} onChange={(e) => updateField('propNeighborPropertyFeedback', e.target.value)} />
              </BoiFormField>
            </div>
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

      {/* Applicant tabs switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex flex-wrap gap-1">
          {labeled.map((app) => (
            <button
              key={app.id}
              onClick={() => handleSwitchApplicant(app.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeApplicantId === app.id
                  ? 'bg-purple-100 text-[#7e22ce] border-b-2 border-[#7e22ce]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {app.label}
            </button>
          ))}
          <button
            onClick={handleAddCoApplicant}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-dashed border-purple-300 bg-purple-50/50 text-[#7e22ce] text-xs font-semibold hover:bg-purple-50 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Co-Applicant
          </button>
        </div>

        {activeApplicantId !== 'primary' && (
          <button
            onClick={() => handleRemoveApplicant(activeApplicantId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Co-Applicant
          </button>
        )}
      </div>

      {/* Stepper Progress Indicator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
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

      {/* Horizontal Scrollable Tabs bar */}
      <div className="overflow-x-auto custom-scrollbar pb-2">
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
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm min-h-[300px]">
        {sections[currentStep] && (
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
            {React.createElement(sections[currentStep].icon, { className: "w-5 h-5 text-purple-600" })}
            <h2 className="text-base font-bold text-gray-900">
              {sections[currentStep].title}
            </h2>
          </div>
        )}
        {renderCurrentStep()}
      </div>

      {/* Bottom Action Buttons */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

      {/* Hidden container for background PDF generation (rendering completely loaded elements below screen boundary) */}
      {caseData && (
        <div style={{ position: 'fixed', left: 0, top: '100vh', width: '794px', zIndex: -100, overflow: 'visible' }}>
          <div ref={viewportRef} className="report-shell">
            <div ref={pdfRef} className="report-pdf-viewport">
              <BoiReportDocument caseData={caseData} />
            </div>
          </div>
        </div>
      )}

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
