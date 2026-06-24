const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Normalize stored values to YYYY-MM for <input type="month">. */
export function toMonthInputValue(value) {
  if (value === undefined || value === null) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD-MM-YYYY e.g. 04-01-2025 (term loan loan-start excel format)
  const ddMmYyyy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddMmYyyy) {
    return `${ddMmYyyy[3]}-${ddMmYyyy[2]}`;
  }

  // 01-MM-YYYY e.g. 01-04-2027 (FRCC loan-start excel format)
  const excelDate = trimmed.match(/^01-(\d{2})-(\d{4})$/);
  if (excelDate) {
    return `${excelDate[2]}-${excelDate[1]}`;
  }

  // YYYY-MM-DD
  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}`;
  }

  // Apr-27 / Apr-2027 (first sale bill excel format)
  const monYear = trimmed.match(/^([A-Za-z]{3})-(\d{2,4})$/);
  if (monYear) {
    const monthIdx = MONTH_ABBR.findIndex(
      (m) => m.toLowerCase() === monYear[1].toLowerCase()
    );
    if (monthIdx >= 0) {
      let year = monYear[2];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    }
  }

  return '';
}

export function normalizeMonthFieldsInSection(sectionData = {}, fieldIds = []) {
  if (!sectionData || typeof sectionData !== 'object') return sectionData;
  const next = { ...sectionData };
  fieldIds.forEach((fieldId) => {
    if (next[fieldId] !== undefined && next[fieldId] !== null && String(next[fieldId]).trim() !== '') {
      next[fieldId] = toMonthInputValue(next[fieldId]);
    }
  });
  return next;
}

const SECTION_MONTH_FIELDS = {
  'Term Loan Details': ['i52', 'i53'],
  'Means of Finance details': ['i59', 'i60'],
  'Term Loan Finance Details': ['i79', 'i80'],
};

/** Restore month picker values after draft resume / excel round-trip. */
export function normalizeMonthFieldsInFormData(formData) {
  if (!formData || typeof formData !== 'object') return formData ?? {};
  const next = { ...formData };
  Object.entries(SECTION_MONTH_FIELDS).forEach(([sectionTitle, fieldIds]) => {
    if (!next[sectionTitle] || typeof next[sectionTitle] !== 'object') return;
    next[sectionTitle] = normalizeMonthFieldsInSection(next[sectionTitle], fieldIds);
  });
  return next;
}

/** Term loan loan-start month → DD-MM-YYYY for excel. */
export function toExcelLoanStartMonth(value) {
  const input = toMonthInputValue(value);
  if (!input) return '';
  const [year, month] = input.split('-');
  return `${month}-01-${year}`;
}

/** Term loan first sale bill month → Mon-YY for excel. */
export function toExcelFirstSaleBillMonth(value) {
  const input = toMonthInputValue(value);
  if (!input) return '';
  const [year, month] = input.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const monthName = date.toLocaleString('en-US', { month: 'short' });
  return `${monthName}-${year.slice(-2)}`;
}

/** FRCC loan-start month → 01-MM-YYYY for excel. */
export function toFrccExcelMonthDate(value) {
  const input = toMonthInputValue(value);
  if (!input) return '';
  const [year, month] = input.split('-');
  return `01-${month}-${year}`;
}
