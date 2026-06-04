import { EXECUTIVE_TEMPLATES } from './executiveTemplates';

/** FormDraft.templateId values for executive verification templates. */
export const EXECUTIVE_DRAFT_PREFIX = 'executive_';

const DRAFT_TYPE_BY_TEMPLATE_ID = {
  'sbi-house': 'executive_sbi_house',
  'sbi-office': 'executive_sbi_office',
  'sbi-bussiness': 'executive_sbi_bussiness',
  'income-tax': 'executive_income_tax'
};

const TEMPLATE_ID_BY_DRAFT_TYPE = Object.fromEntries(
  Object.entries(DRAFT_TYPE_BY_TEMPLATE_ID).map(([k, v]) => [v, k])
);

const LABEL_BY_DRAFT_TYPE = {
  executive_sbi_house: 'SBI House',
  executive_sbi_office: 'SBI Office',
  executive_sbi_bussiness: 'SBI Business',
  executive_income_tax: 'Income Tax (ITR)'
};

export function getExecutiveDraftFormType(templateId) {
  return DRAFT_TYPE_BY_TEMPLATE_ID[templateId] || `executive_${String(templateId || 'unknown').replace(/-/g, '_')}`;
}

export function getTemplateIdFromDraftFormType(formType) {
  return TEMPLATE_ID_BY_DRAFT_TYPE[formType] || null;
}

export function getExecutiveDraftLabel(formType) {
  if (LABEL_BY_DRAFT_TYPE[formType]) return LABEL_BY_DRAFT_TYPE[formType];
  const templateId = getTemplateIdFromDraftFormType(formType);
  const t = EXECUTIVE_TEMPLATES.find((x) => x.id === templateId);
  return t?.name || formType?.replace(/^executive_/, '').replace(/_/g, ' ') || 'Draft';
}

export function getExecutiveTemplatePath(templateId) {
  const t = EXECUTIVE_TEMPLATES.find((x) => x.id === templateId);
  return t?.path || '/executive/dashboard';
}

export function isExecutiveDraftFormType(formType) {
  return String(formType || '').startsWith(EXECUTIVE_DRAFT_PREFIX);
}

export function getDraftDisplayTitle(draft) {
  const fd = draft?.formData || draft?.form_data || {};
  const form = fd.form || fd;
  return (
    form.applicant_name ||
    form.name ||
    form.rlms_number ||
    form.rlms ||
    getExecutiveDraftLabel(draft.formType || draft.templateId)
  );
}
