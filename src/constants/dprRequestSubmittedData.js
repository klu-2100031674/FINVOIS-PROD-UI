/** Field ids must match API `msmeDprDepartmentForm.js` / builtin fields. */
export const DPR_REQUEST_CUSTOM_ROUTE = 'dpr-request';

export const BUILTIN_FIELD_IDS = {
  name: 'govt_builtin_name',
  email: 'govt_builtin_email',
  phone: 'govt_builtin_phone',
};

export const DPR_REQUEST_FIELD_IDS = {
  gender: 'dpr_request_gender',
  sector: 'dpr_request_sector',
  natureOfBusiness: 'dpr_request_nature_of_business',
  enterpriseType: 'dpr_request_enterprise_type',
  yearOfRegistration: 'dpr_request_year_of_registration',
  schemeAppliedUnder: 'dpr_request_scheme_applied_under',
  loanType: 'dpr_request_loan_type',
  ruralUrbanCategory: 'dpr_request_rural_urban_category',
  villageCity: 'dpr_request_village_city',
  mandal: 'dpr_request_mandal',
  district: 'dpr_request_district',
  needCaStamp: 'dpr_request_need_ca_stamp',
  description: 'dpr_request_description',
};

export function mapDprRequestFormToSubmittedData(form = {}) {
  return {
    [BUILTIN_FIELD_IDS.name]: String(form.applicantName || '').trim(),
    [BUILTIN_FIELD_IDS.email]: '',
    [BUILTIN_FIELD_IDS.phone]: String(form.mobileNumber || '').trim(),
    aadharNumber: String(form.aadharNumber || '').trim(),
    panNumber: String(form.panNumber || '').trim(),
    [DPR_REQUEST_FIELD_IDS.gender]: form.gender || '',
    [DPR_REQUEST_FIELD_IDS.sector]: form.sector || '',
    [DPR_REQUEST_FIELD_IDS.natureOfBusiness]: form.natureOfBusiness || '',
    [DPR_REQUEST_FIELD_IDS.enterpriseType]: form.enterpriseType || '',
    [DPR_REQUEST_FIELD_IDS.yearOfRegistration]: form.yearOfRegistration || '',
    [DPR_REQUEST_FIELD_IDS.schemeAppliedUnder]: form.schemeAppliedUnder || '',
    [DPR_REQUEST_FIELD_IDS.loanType]: form.loanType || '',
    [DPR_REQUEST_FIELD_IDS.ruralUrbanCategory]: form.ruralUrbanCategory || '',
    [DPR_REQUEST_FIELD_IDS.villageCity]: form.villageCity || '',
    [DPR_REQUEST_FIELD_IDS.mandal]: form.mandal || '',
    [DPR_REQUEST_FIELD_IDS.district]: form.district || '',
    [DPR_REQUEST_FIELD_IDS.needCaStamp]: form.needCaStamp || 'No',
    [DPR_REQUEST_FIELD_IDS.description]: form.description || '',
    hasOtherDprInfo: Boolean(form.hasOtherDprInfo),
    workingCapital: form.workingCapital || '',
    workingCapitalMargin: form.workingCapitalMargin || '',
    workingCapitalRateOfInterest: form.workingCapitalRateOfInterest || '',
    dprAssets: Array.isArray(form.dprAssets) ? form.dprAssets : [],
    loanTermPeriod: form.loanTermPeriod || '',
    rateOfInterest: form.rateOfInterest || '',
    processingFee: form.processingFee || '',
    moratoriumPeriod: form.moratoriumPeriod || '',
    loanAmount: form.loanAmount || '',
  };
}

/** Inverse of mapDprRequestFormToSubmittedData — used to auto-fill reports from a DepartmentRequest. */
export function mapSubmittedDataToDprRequestLead(submittedData = {}) {
  return {
    applicantName: String(submittedData[BUILTIN_FIELD_IDS.name] || '').trim(),
    gender: submittedData[DPR_REQUEST_FIELD_IDS.gender] || '',
    mobileNumber: String(submittedData[BUILTIN_FIELD_IDS.phone] || '').trim(),
    aadharNumber: String(submittedData.aadharNumber || '').trim(),
    panNumber: String(submittedData.panNumber || '').trim(),
    sector: submittedData[DPR_REQUEST_FIELD_IDS.sector] || submittedData.sector || '',
    natureOfBusiness: String(submittedData[DPR_REQUEST_FIELD_IDS.natureOfBusiness] || '').trim(),
    enterpriseType: submittedData[DPR_REQUEST_FIELD_IDS.enterpriseType] || '',
    yearOfRegistration: String(submittedData[DPR_REQUEST_FIELD_IDS.yearOfRegistration] || '').trim(),
    schemeAppliedUnder: submittedData[DPR_REQUEST_FIELD_IDS.schemeAppliedUnder] || '',
    loanType: submittedData[DPR_REQUEST_FIELD_IDS.loanType] || submittedData.loanType || '',
    ruralUrbanCategory: submittedData[DPR_REQUEST_FIELD_IDS.ruralUrbanCategory] || '',
    villageCity: String(submittedData[DPR_REQUEST_FIELD_IDS.villageCity] || '').trim(),
    mandal: String(submittedData[DPR_REQUEST_FIELD_IDS.mandal] || '').trim(),
    district: String(submittedData[DPR_REQUEST_FIELD_IDS.district] || '').trim(),
    workingCapital: String(submittedData.workingCapital || '').trim(),
    workingCapitalMargin: String(submittedData.workingCapitalMargin || '').trim(),
    workingCapitalRateOfInterest: String(submittedData.workingCapitalRateOfInterest || '').trim(),
    loanTermPeriod: String(submittedData.loanTermPeriod || '').trim(),
    rateOfInterest: String(submittedData.rateOfInterest || '').trim(),
    processingFee: String(submittedData.processingFee || '').trim(),
    moratoriumPeriod: String(submittedData.moratoriumPeriod || '').trim(),
    loanAmount: String(submittedData.loanAmount || '').trim(),
    description: String(submittedData[DPR_REQUEST_FIELD_IDS.description] || '').trim(),
    hasOtherDprInfo: Boolean(submittedData.hasOtherDprInfo),
    dprAssets: Array.isArray(submittedData.dprAssets) ? submittedData.dprAssets : [],
  };
}
