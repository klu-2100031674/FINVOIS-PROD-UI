/** Field ids must match API `msmeDprDepartmentForm.js` / builtin fields. */
export const MSME_DPR_CUSTOM_ROUTE = 'msme-dpr';

export const BUILTIN_FIELD_IDS = {
  name: 'govt_builtin_name',
  email: 'govt_builtin_email',
  phone: 'govt_builtin_phone',
};

export const MSME_FIELD_IDS = {
  gender: 'msme_gender',
  sector: 'msme_sector',
  natureOfBusiness: 'msme_nature_of_business',
  enterpriseType: 'msme_enterprise_type',
  yearOfRegistration: 'msme_year_of_registration',
  schemeAppliedUnder: 'msme_scheme_applied_under',
  loanType: 'msme_loan_type',
  ruralUrbanCategory: 'msme_rural_urban_category',
  villageCity: 'msme_village_city',
  mandal: 'msme_mandal',
  district: 'msme_district',
  needCaStamp: 'msme_need_ca_stamp',
  description: 'msme_description',
};

export function mapMsmeFormToSubmittedData(form = {}) {
  return {
    [BUILTIN_FIELD_IDS.name]: String(form.applicantName || '').trim(),
    [BUILTIN_FIELD_IDS.email]: '',
    [BUILTIN_FIELD_IDS.phone]: String(form.mobileNumber || '').trim(),
    aadharNumber: String(form.aadharNumber || '').trim(),
    panNumber: String(form.panNumber || '').trim(),
    [MSME_FIELD_IDS.gender]: form.gender || '',
    [MSME_FIELD_IDS.sector]: form.sector || '',
    [MSME_FIELD_IDS.natureOfBusiness]: form.natureOfBusiness || '',
    [MSME_FIELD_IDS.enterpriseType]: form.enterpriseType || '',
    [MSME_FIELD_IDS.yearOfRegistration]: form.yearOfRegistration || '',
    [MSME_FIELD_IDS.schemeAppliedUnder]: form.schemeAppliedUnder || '',
    [MSME_FIELD_IDS.loanType]: form.loanType || '',
    [MSME_FIELD_IDS.ruralUrbanCategory]: form.ruralUrbanCategory || '',
    [MSME_FIELD_IDS.villageCity]: form.villageCity || '',
    [MSME_FIELD_IDS.mandal]: form.mandal || '',
    [MSME_FIELD_IDS.district]: form.district || '',
    [MSME_FIELD_IDS.needCaStamp]: form.needCaStamp || 'No',
    [MSME_FIELD_IDS.description]: form.description || '',
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

/** Inverse of mapMsmeFormToSubmittedData — used to auto-fill reports from a DepartmentRequest. */
export function mapSubmittedDataToMsmeLead(submittedData = {}) {
  return {
    applicantName: String(submittedData[BUILTIN_FIELD_IDS.name] || '').trim(),
    gender: submittedData[MSME_FIELD_IDS.gender] || '',
    mobileNumber: String(submittedData[BUILTIN_FIELD_IDS.phone] || '').trim(),
    aadharNumber: String(submittedData.aadharNumber || '').trim(),
    panNumber: String(submittedData.panNumber || '').trim(),
    sector: submittedData[MSME_FIELD_IDS.sector] || submittedData.sector || '',
    natureOfBusiness: String(submittedData[MSME_FIELD_IDS.natureOfBusiness] || '').trim(),
    enterpriseType: submittedData[MSME_FIELD_IDS.enterpriseType] || '',
    yearOfRegistration: String(submittedData[MSME_FIELD_IDS.yearOfRegistration] || '').trim(),
    schemeAppliedUnder: submittedData[MSME_FIELD_IDS.schemeAppliedUnder] || '',
    loanType: submittedData[MSME_FIELD_IDS.loanType] || submittedData.loanType || '',
    ruralUrbanCategory: submittedData[MSME_FIELD_IDS.ruralUrbanCategory] || '',
    villageCity: String(submittedData[MSME_FIELD_IDS.villageCity] || '').trim(),
    mandal: String(submittedData[MSME_FIELD_IDS.mandal] || '').trim(),
    district: String(submittedData[MSME_FIELD_IDS.district] || '').trim(),
    workingCapital: String(submittedData.workingCapital || '').trim(),
    workingCapitalMargin: String(submittedData.workingCapitalMargin || '').trim(),
    workingCapitalRateOfInterest: String(submittedData.workingCapitalRateOfInterest || '').trim(),
    loanTermPeriod: String(submittedData.loanTermPeriod || '').trim(),
    rateOfInterest: String(submittedData.rateOfInterest || '').trim(),
    processingFee: String(submittedData.processingFee || '').trim(),
    moratoriumPeriod: String(submittedData.moratoriumPeriod || '').trim(),
    loanAmount: String(submittedData.loanAmount || '').trim(),
    description: String(submittedData[MSME_FIELD_IDS.description] || '').trim(),
    hasOtherDprInfo: Boolean(submittedData.hasOtherDprInfo),
    dprAssets: Array.isArray(submittedData.dprAssets) ? submittedData.dprAssets : [],
  };
}
