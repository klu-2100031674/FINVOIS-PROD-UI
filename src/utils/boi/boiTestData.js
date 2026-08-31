/**
 * Consolidated BOI test data — ported from Loan-Verifier-Pro module testData objects.
 */
import { DEFAULT_BANK_NAME, REPORT_DEFAULTS, emptyBoiCase, emptyModules } from './boiVerificationSchema';

const todayISO = () => new Date().toISOString().slice(0, 10);
const nowLocal = () => new Date().toISOString().slice(0, 16);

export const BOI_CASE_TEST = {
  loanType: 'Home Loan',
  bankName: DEFAULT_BANK_NAME,
  branchName: 'Mumbai - Andheri East',
  loanAmount: '2500000',
};

export const BOI_GENERAL_TEST = {
  borrowerName: 'Ravi Kumar',
  fatherHusbandName: 'Suresh Kumar',
  gender: 'male',
  residentStatus: 'resident',
  panNumber: 'ABCPD1234F',
  aadhaarNumber: '234567890123',
  dateOfBirth: '1995-08-15',
  qualification: 'Graduate',
  maritalStatus: 'married',
  employmentType: 'Salaried',
  udinNumber: '26222863ABCDEF0001',
  dateOfVerification: todayISO(),
  dateOfReportSubmission: todayISO(),
  caName: REPORT_DEFAULTS.caName,
  caSignatureDataUrl: '',
  caSignaturePath: '',
};

export const BOI_RESIDENCE_TEST = {
  addressTallied: 'yes',
  residenceLandmark: "Opposite St. Mary's School",
  stayConfirmed: 'yes',
  stayingSinceYears: '6',
  namePlateSeen: 'yes',
  namePlateMatch: 'yes',
  natureOfResidence: 'Owned',
  typeOfResidence: 'Flat',
  contactPersonName: 'Anita Kumar',
  contactPersonAddress: 'Flat 402, Sunrise Apartments, Andheri East, Mumbai',
  contactPersonRelation: 'Family Member',
  city: 'Mumbai',
  pincode: '400069',
  residencePhone: '02226712345',
  mobileNumber: '9876543210',
  typeOfLocality: 'Residential',
  localityLandmark: 'Near Metro Station, Andheri East',
  livingStandard: 'Middle Class',
  numberOfDependents: '3',
  accessibility: 'Easy',
  givenAddress: 'Flat 402, Sunrise Apartments, MG Road, Andheri East, Mumbai - 400069',
  presentAddress: 'Flat 402, Sunrise Apartments, MG Road, Andheri East, Mumbai - 400069',
  houseLocked: 'no',
  visitDateTime: nowLocal(),
  verifierRemarks: 'Applicant present at the address. Documents verified successfully.',
  supervisorRemarks: 'Verification looks clean. Approved.',
  notes: '',
};

export const BOI_EMPLOYMENT_TEST = {
  employmentCategory: 'salaried',
  businessName: 'Infotech Solutions Pvt Ltd',
  businessAddress: 'Tower B, 7th Floor, Hiranandani Business Park, Powai, Mumbai - 400076',
  addressConfirmedBy: 'HR',
  landmark: 'Opposite Powai Lake',
  officeOwnership: 'Leased',
  nameBoardSighted: 'yes',
  proofsReceived: ['Salary Slip', 'ID Card', 'Appointment Letter'],
  designation: 'Senior Software Engineer',
  typeOfFirm: 'Private Limited',
  natureOfBusiness: 'Servicing',
  websiteEmail: 'hr@infotechsolutions.com',
  sinceWhen: 'Mar 2019',
  changeLikelihood: 'Stable',
  telephoneNumber: '02240501234',
  termsOfEmployment: 'Permanent, Full Time',
  supervisorDetails: 'Mr. Anil Mehta / Engineering Manager / 9820012345',
  visitingCardObtained: 'yes',
  verifierRemarks: 'Employee verified at workplace. HR confirmed tenure and designation.',
  supervisorRemarks: 'Clean verification. No discrepancies observed.',
};

export const BOI_PAN_TEST = {
  panNumber: 'ABCPD1234F',
  nameMatching: 'yes',
  genderMatching: 'yes',
  panVerifiedOfficial: 'yes',
  finalStatus: 'confirmed',
  verifierRemarks: "Applicant's PAN details fully match the official records.",
  supervisorRemarks: 'Verification reviewed and approved.',
};

export const BOI_SALARY_TEST = {
  companyName: 'Commissioner of Health & Family Welfare',
  designation: 'Community Health Officer',
  yearsOfService: '4',
  serviceConfirmed: 'yes',
  grossMonthlyIncome: '24800',
  totalIncome: '297600',
  incomeUnderSalaryHeadVerified: 'yes',
  taxCalculationVerified: 'yes',
  form16TaxPayableCorrect: 'yes',
  remarks: 'Income documents verified successfully.',
};

export const BOI_DOCUMENTS_TEST = {
  sealOfOrganization: 'tallied',
  signatureOfAuthority: 'tallied',
  salarySlipDateAmount: 'tallied',
  officeAddressCorrect: 'tallied',
};

export const BOI_BUSINESS_TEST = {
  businessActivitySeen: 'yes',
  numberOfEmployees: '8',
  equipmentStockSeen: 'Computers, Furniture, Printers',
  businessPremisesCondition: 'good',
  levelOfBusinessActivity: 'good',
  verifierRemarks: 'Business operations active and functioning normally.',
  supervisorRemarks: 'No adverse observations found.',
};

export const BOI_PROPERTY_TEST = {
  addressOfProperty: 'Plot 17, Green Valley Township, Sarjapur Road, Bengaluru - 560035',
  addressMatchesApplication: 'yes',
  ownerName: 'Rajesh Sharma',
  typeOfProperty: 'Residential',
  locality: 'Upper Middle',
  ownership: 'Jointly Owned',
  typeOfConstruction: 'Flat Under Construction',
  stageOfConstruction: 'Lintel',
  independentAccess: 'yes',
  accessType: 'Four Wheeler',
  buildingUsageType: 'Residential',
  builderName: 'Prestige Constructions',
  builderReputation: 'Reputed',
  builderSource: 'RERA Website',
  builderStage: 'Structure Complete',
  workInProgress: 'Interior finishing in progress',
  likelyCompletionDate: '2026-12-31',
  dateOfSiteVisit: todayISO(),
  verifierRemarks: 'Site visit completed. Construction progressing as per schedule.',
};

export const BOI_FEEDBACK_TEST = {
  items: {
    personalDetails: 'positive',
    residenceVerification: 'positive',
    telephoneVerification: 'positive',
    incomeProof: 'positive',
    itReturn: 'positive',
    employerOffice: 'positive',
    placeOfBusiness: 'na',
    bankDetails: 'positive',
    otherDetails: 'positive',
  },
  guarantorPresent: 'yes',
  guarantorName: 'Suresh Kumar',
  guarantorOpinion: 'positive',
};

function completedModule(key, data) {
  return { status: 'completed', [key]: data };
}

/**
 * Build a full test case with all applicable modules marked completed.
 */
export function getBoiTestCase(user, existingCases = {}) {
  const primaryId = 'primary';
  const caseObj = emptyBoiCase(existingCases, {
    ...BOI_CASE_TEST,
    status: 'in_progress',
    modules: {
      [primaryId]: {
        ...emptyModules(),
        general: completedModule('general', {
          ...BOI_GENERAL_TEST,
          caName: user?.verified_by || BOI_GENERAL_TEST.caName,
        }),
        residence: completedModule('residence', BOI_RESIDENCE_TEST),
        employment: completedModule('employment', BOI_EMPLOYMENT_TEST),
        pan: completedModule('pan', BOI_PAN_TEST),
        salary: completedModule('salary', BOI_SALARY_TEST),
        documents: completedModule('documents', BOI_DOCUMENTS_TEST),
        business: completedModule('business', {}),
        property: completedModule('property', BOI_PROPERTY_TEST),
        evidence: completedModule('evidence', {
          applicantPhotos: [],
          coApplicantPhotos: [],
          residencePhotos: [],
          employmentPhotos: [],
          identityDocs: [],
          incomeDocs: [],
          additionalDocs: [],
        }),
        feedback: completedModule('feedback', BOI_FEEDBACK_TEST),
      },
    },
  });
  return caseObj;
}
