/** Display title for audited / financial statements sections (UI only). */
export const AUDITED_FINANCIAL_SECTION_DISPLAY = 'Audited Financial Statements (Rs)';

export function getAuditedSectionDisplayTitle(title) {
  if (title === 'Financial Statements' || title === 'Audited Financial Statements') {
    return AUDITED_FINANCIAL_SECTION_DISPLAY;
  }
  return title;
}

/** Opening stock field ids that may legitimately be zero. */
export const OPENING_STOCK_FIELD_IDS = new Set([
  'i24',
  'i25',
  'i33',
  'i34',
  'i48',
]);

export function isOpeningStockField(fieldId) {
  return OPENING_STOCK_FIELD_IDS.has(fieldId);
}

/** Last field in Prepared By — Yes/No CA stamp preference (stored in form JSON, not Excel). */
export const FRCC_REQUIRED_STAMP_FIELD = {
  id: 'required_stamp',
  label: 'Required Stamp',
  type: 'select',
  required: true,
  options: ['Yes', 'No'],
  note: 'Select whether CA stamp is required on the report',
};

export const FRCC_REQUIRED_STAMP_DEFAULT = 'No';

export const PREPARED_BY_BANKER_MAIL_FIELD = {
  id: 'banker_mail_id',
  label: 'Banker Mail ID',
  type: 'text',
  required: false,
};

export const PREPARED_BY_CIBIL_FIELD = {
  id: 'cibil_score',
  label: 'CIBIL Score',
  type: 'text',
  required: false,
};

export function isFrccTemplateId(templateId) {
  const match = String(templateId || '').toUpperCase().match(/CC(\d+)/);
  if (match) {
    const ccNumber = parseInt(match[1], 10);
    return ccNumber >= 1 && ccNumber <= 7;
  }
  return [
    'TERM_LOAN_CC',
    'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK',
    'TERM_LOAN_SERVICE_WITHOUT_STOCK',
    'TERM_LOAN_EV_VEHICLE',
    'TERM_LOAN_OTHER_THAN_EV_VEHICLE',
    'TERM_LOAN_JCB_VEHICLE',
    'TERM_LOAN_DRONE_VEHICLE'
  ].includes(String(templateId).trim().toUpperCase());
}

export function hasPreparedByValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

/** Term loan templates store bank/branch under General Information. */
export function isTermLoanPreparedByValid(formData) {
  const preparedBy = formData?.['Prepared By'] || {};
  const generalInfo = formData?.['General Information'] || {};
  return (
    hasPreparedByValue(preparedBy.j138) &&
    hasPreparedByValue(preparedBy.j139) &&
    hasPreparedByValue(generalInfo.bank_name) &&
    hasPreparedByValue(generalInfo.branch_name) &&
    hasPreparedByValue(preparedBy.required_stamp)
  );
}

export function getTermLoanPreparedByErrors(formData) {
  const preparedBy = formData?.['Prepared By'] || {};
  const generalInfo = formData?.['General Information'] || {};
  const errors = {};
  if (!hasPreparedByValue(preparedBy.j138)) {
    errors.j138 = 'Address (Prepared By) is required';
  }
  if (!hasPreparedByValue(preparedBy.j139)) {
    errors.j139 = 'Mobile Number (Prepared By) is required';
  }
  if (!hasPreparedByValue(generalInfo.bank_name)) {
    errors.bank_name = 'Bank Name / Department Name is required';
  }
  if (!hasPreparedByValue(generalInfo.branch_name)) {
    errors.branch_name = 'Branch Name is required';
  }
  if (!hasPreparedByValue(preparedBy.required_stamp)) {
    errors.required_stamp = 'Required Stamp is required';
  }
  return errors;
}

/** FRCC templates store bank/branch under Prepared By. */
export function getFrccPreparedByErrors(sectionFields, sectionData = {}) {
  const errors = {};
  (sectionFields || []).forEach((field) => {
    if (!field.required) return;
    if (!hasPreparedByValue(sectionData[field.id])) {
      errors[field.id] = `${field.label} is required`;
    }
  });
  return errors;
}

export function isFrccPreparedByValid(sectionFields, sectionData = {}) {
  return Object.keys(getFrccPreparedByErrors(sectionFields, sectionData)).length === 0;
}

/** True when Prepared By → Required Stamp is Yes (FRCC reports only). */
export function reportRequiresCaStamp(report) {
  if (report?.required_ca_stamp === true) return true;
  if (report?.report_metadata?.requiredCaStamp === true) return true;
  if (!isFrccTemplateId(report?.templateId)) return false;

  const formData = report?.form_data;
  if (!formData || typeof formData !== 'object') return false;

  const preparedBy =
    formData['Prepared By'] ||
    formData['Prepared by'] ||
    formData.formData?.['Prepared By'] ||
    formData.formData?.['Prepared by'];

  return String(preparedBy?.required_stamp || '').trim().toLowerCase() === 'yes';
}
