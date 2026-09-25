/** Field ids must match API `mepmaDprDepartmentForm.js` / builtin fields. */
export const MEPMA_DPR_CUSTOM_ROUTE = 'mepma-dpr';

export const MEPMA_BUILTIN_FIELD_IDS = {
  name: 'govt_builtin_name',
  email: 'govt_builtin_email',
  phone: 'govt_builtin_phone',
};

export const MEPMA_FIELD_IDS = {
  gender: 'mepma_gender',
  sector: 'mepma_sector',
  natureOfBusiness: 'mepma_nature_of_business',
  enterpriseType: 'mepma_enterprise_type',
  yearOfRegistration: 'mepma_year_of_registration',
  schemeAppliedUnder: 'mepma_scheme_applied_under',
  loanType: 'mepma_loan_type',
  ruralUrbanCategory: 'mepma_rural_urban_category',
  villageCity: 'mepma_village_city',
  mandal: 'mepma_mandal',
  district: 'mepma_district',
  needCaStamp: 'mepma_need_ca_stamp',
  description: 'mepma_description',
};

export function mapMepmaFormToSubmittedData(form = {}) {
  return {
    [MEPMA_BUILTIN_FIELD_IDS.name]: String(form.applicantName || '').trim(),
    [MEPMA_BUILTIN_FIELD_IDS.email]: String(form.email || '').trim(),
    [MEPMA_BUILTIN_FIELD_IDS.phone]: String(form.mobileNumber || '').trim(),
    aadharNumber: String(form.aadharNumber || '').trim(),
    panNumber: String(form.panNumber || '').trim(),
    [MEPMA_FIELD_IDS.gender]: form.gender || '',
    [MEPMA_FIELD_IDS.sector]: form.sector || '',
    [MEPMA_FIELD_IDS.natureOfBusiness]: form.natureOfBusiness || '',
    [MEPMA_FIELD_IDS.enterpriseType]: form.enterpriseType || '',
    [MEPMA_FIELD_IDS.yearOfRegistration]: form.yearOfRegistration || '',
    [MEPMA_FIELD_IDS.schemeAppliedUnder]: form.schemeAppliedUnder || '',
    [MEPMA_FIELD_IDS.loanType]: form.loanType || '',
    [MEPMA_FIELD_IDS.ruralUrbanCategory]: form.ruralUrbanCategory || '',
    [MEPMA_FIELD_IDS.villageCity]: form.villageCity || '',
    [MEPMA_FIELD_IDS.mandal]: form.mandal || '',
    [MEPMA_FIELD_IDS.district]: form.district || '',
    [MEPMA_FIELD_IDS.needCaStamp]: form.needCaStamp || 'No',
    [MEPMA_FIELD_IDS.description]: form.description || '',
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

/** Inverse of mapMepmaFormToSubmittedData — used to auto-fill reports from a DepartmentRequest. */
export function mapSubmittedDataToMepmaLead(submittedData = {}) {
  return {
    applicantName: String(submittedData[MEPMA_BUILTIN_FIELD_IDS.name] || '').trim(),
    gender: submittedData[MEPMA_FIELD_IDS.gender] || '',
    mobileNumber: String(submittedData[MEPMA_BUILTIN_FIELD_IDS.phone] || '').trim(),
    aadharNumber: String(submittedData.aadharNumber || '').trim(),
    panNumber: String(submittedData.panNumber || '').trim(),
    sector: submittedData[MEPMA_FIELD_IDS.sector] || submittedData.sector || '',
    natureOfBusiness: String(submittedData[MEPMA_FIELD_IDS.natureOfBusiness] || '').trim(),
    enterpriseType: submittedData[MEPMA_FIELD_IDS.enterpriseType] || '',
    yearOfRegistration: String(submittedData[MEPMA_FIELD_IDS.yearOfRegistration] || '').trim(),
    schemeAppliedUnder: submittedData[MEPMA_FIELD_IDS.schemeAppliedUnder] || '',
    loanType: submittedData[MEPMA_FIELD_IDS.loanType] || submittedData.loanType || '',
    ruralUrbanCategory: submittedData[MEPMA_FIELD_IDS.ruralUrbanCategory] || '',
    villageCity: String(submittedData[MEPMA_FIELD_IDS.villageCity] || '').trim(),
    mandal: String(submittedData[MEPMA_FIELD_IDS.mandal] || '').trim(),
    district: String(submittedData[MEPMA_FIELD_IDS.district] || '').trim(),
    workingCapital: String(submittedData.workingCapital || '').trim(),
    workingCapitalMargin: String(submittedData.workingCapitalMargin || '').trim(),
    workingCapitalRateOfInterest: String(submittedData.workingCapitalRateOfInterest || '').trim(),
    loanTermPeriod: String(submittedData.loanTermPeriod || '').trim(),
    rateOfInterest: String(submittedData.rateOfInterest || '').trim(),
    processingFee: String(submittedData.processingFee || '').trim(),
    moratoriumPeriod: String(submittedData.moratoriumPeriod || '').trim(),
    loanAmount: String(submittedData.loanAmount || '').trim(),
    description: String(submittedData[MEPMA_FIELD_IDS.description] || '').trim(),
    hasOtherDprInfo: Boolean(submittedData.hasOtherDprInfo),
    dprAssets: Array.isArray(submittedData.dprAssets) ? submittedData.dprAssets : [],
  };
}
