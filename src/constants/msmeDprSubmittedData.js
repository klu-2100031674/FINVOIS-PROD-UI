/** Field ids must match API `msmeDprDepartmentForm.js` / builtin fields. */
export const MSME_DPR_CUSTOM_ROUTE = 'msme-dpr';

export const BUILTIN_FIELD_IDS = {
  name: 'govt_builtin_name',
  email: 'govt_builtin_email',
  phone: 'govt_builtin_phone',
};

export const MSME_FIELD_IDS = {
  gender: 'msme_gender',
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
    [MSME_FIELD_IDS.gender]: form.gender || '',
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
  };
}
