const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return '';
};

const findFirstByKeys = (node, keys) => {
  if (!node || typeof node !== 'object') return '';

  if (Array.isArray(node)) {
    for (const item of node) {
      const result = findFirstByKeys(item, keys);
      if (result) return result;
    }
    return '';
  }

  for (const [key, value] of Object.entries(node)) {
    if (keys.has(key)) {
      const normalized = normalizeText(value);
      if (normalized) return normalized;
    }
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') {
      const result = findFirstByKeys(value, keys);
      if (result) return result;
    }
  }

  return '';
};

const extractNameParts = (formData = {}) => {
  const nestedFormData = formData?.formData || {};

  const general =
    formData?.['General Information'] ||
    nestedFormData?.['General Information'] ||
    {};

  const firmConstitution =
    formData?.firm_constitution ||
    nestedFormData?.firm_constitution ||
    {};

  const proprietorKeys = new Set([
    'proprietor_name',
    'managing_partner_name',
    'managing_director_name',
    'member_name',
    'trustee_name',
    'owner_name'
  ]);

  const firmKeys = new Set([
    'firm_name',
    'company_name',
    'name_of_firm',
    'name_of_company',
    'business_name'
  ]);

  const proprietorName = firstNonEmpty(
    general?.i8,
    firmConstitution?.proprietor_name,
    formData?.proprietor_name,
    nestedFormData?.proprietor_name,
    findFirstByKeys(formData, proprietorKeys),
    findFirstByKeys(nestedFormData, proprietorKeys)
  );

  const firmOrCompanyName = firstNonEmpty(
    general?.i17,
    firmConstitution?.firm_name,
    formData?.firm_name,
    nestedFormData?.firm_name,
    findFirstByKeys(formData, firmKeys),
    findFirstByKeys(nestedFormData, firmKeys)
  );

  return { proprietorName, firmOrCompanyName };
};

export const resolveReportTitle = ({ formData, reportTitle, templateId } = {}) => {
  const { proprietorName, firmOrCompanyName } = extractNameParts(formData || {});

  if (proprietorName && firmOrCompanyName) {
    return `${proprietorName}(${firmOrCompanyName})`;
  }

  if (proprietorName) return proprietorName;
  if (firmOrCompanyName) return firmOrCompanyName;

  const providedTitle = normalizeText(reportTitle);
  if (providedTitle) return providedTitle;

  const template = normalizeText(templateId);
  if (template) return `Report - ${template}`;

  return 'Report';
};
