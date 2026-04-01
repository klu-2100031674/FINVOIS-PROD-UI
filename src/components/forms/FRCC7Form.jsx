import React, { useState, useCallback, useEffect } from 'react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const generateFinancialYearOptions = () => {
  const options = [];
  for (let start = 2024; start <= 2036; start++) {
    options.push(`${start}-${(start + 1).toString().slice(-2)}`);
  }
  return options;
};

// CC7 New Asset rows: D158-D167, D168-D177, etc.
const newAssetMapping = {
  "Plant and Machinery":                         { dataStartRow: 158, maxItems: 10, loanPct: 'j59' },
  "Service Equipment":                           { dataStartRow: 168, maxItems: 10, loanPct: 'j60' },
  "Shed, Construction and Civil Works":          { dataStartRow: 178, maxItems: 10, loanPct: 'j61' },
  "Land":                                        { dataStartRow: 188, maxItems: 3,  loanPct: 'j62' },
  "Electrical and Plumbing Items":               { dataStartRow: 191, maxItems: 10, loanPct: 'j63' },
  "Electronic Items":                            { dataStartRow: 201, maxItems: 10, loanPct: 'j64' },
  "Furniture and Fittings":                      { dataStartRow: 211, maxItems: 10, loanPct: 'j65' },
  "Vehicles":                                    { dataStartRow: 221, maxItems: 9,  loanPct: 'j66' },
  "Live Stock":                                  { dataStartRow: 230, maxItems: 10, loanPct: 'j67' },
  "Other Assets (Including Amortisable Assets)": { dataStartRow: 240, maxItems: 10, loanPct: 'j68' },
  "Other Assets (Nil Depreciation)":             { dataStartRow: 250, maxItems: 10, loanPct: 'j69' },
};

// CC7 Gross Asset rows: D266-D275, D276-D285, etc.
const grossAssetMapping = {
  "Plant and Machinery":                         { dataStartRow: 266, maxItems: 10 },
  "Service Equipment":                           { dataStartRow: 276, maxItems: 10 },
  "Shed, Construction and Civil Works":          { dataStartRow: 286, maxItems: 10 },
  "Land":                                        { dataStartRow: 296, maxItems: 3  },
  "Electrical and Plumbing Items":               { dataStartRow: 299, maxItems: 10 },
  "Electronic Items":                            { dataStartRow: 309, maxItems: 10 },
  "Furniture and Fittings":                      { dataStartRow: 319, maxItems: 10 },
  "Vehicles":                                    { dataStartRow: 329, maxItems: 9  },
  "Live Stock":                                  { dataStartRow: 338, maxItems: 10 },
  "Other Assets (Including Amortisable Assets)": { dataStartRow: 348, maxItems: 10 },
  "Other Assets (Nil Depreciation)":             { dataStartRow: 358, maxItems: 10 },
};

const FRCC7Form = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null
}) => {
  const buildEmptyState = () => ({
    'General Information': {},
    'Means of Finance': { i11: 'Yes', i12: 'Yes', i18: 'Yes' },
    'Financial Years': {},
    'Financial Statements': {},
    'New Asset Schedule': Object.fromEntries(
      Object.keys(newAssetMapping).map(k => [k, { items: [], total: 0, loanPct: 0 }])
    ),
    'Gross Assets Opening Balance': Object.fromEntries(
      Object.keys(grossAssetMapping).map(k => [k, { items: [], total: 0 }])
    ),
    'Term Loan Finance Details': {},
    'Prepared By': {
      i159: 'PARVEZ AND NARAYANA',
      i160: 'Chartered Accountants',
      i161: 'vijayawada',
      i162: '9014221011',
      bank_name: '',
      branch_name: ''
    }
  });

  const [formData, setFormData] = useState(() => {
    if (initialData && Object.keys(initialData).length > 0) return initialData;
    return buildEmptyState();
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [activeNewAssetTab, setActiveNewAssetTab] = useState(0);
  const [activeGrossAssetTab, setActiveGrossAssetTab] = useState(0);
  const [loanAmounts, setLoanAmounts] = useState(() =>
    Object.fromEntries(Object.keys(newAssetMapping).map(k => [k, '']))
  );

  const sections = [
    {
      key: 'general',
      title: 'General Information',
      icon: DocumentTextIcon,
      fields: [
        { id: 'i3',          label: 'Name of Firm',                   type: 'text',     required: true },
        { id: 'i4',          label: 'Status of Concern',              type: 'select',   options: ['Soleproprietorship', 'Partnership', 'LLP', 'Company'], required: true },
        { id: 'i5',          label: 'Name of Authorised Person',      type: 'text',     required: true },
        { id: 'i6',          label: 'Firm Address',                   type: 'textarea', required: true },
        { id: 'i7',          label: 'Contact No. of Authorised Person', type: 'text',   required: true },
        { id: 'i8',          label: 'Sector',                         type: 'select',   options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true },
        { id: 'i9',          label: 'Nature of Business',             type: 'text',     required: true },
        { id: 'bank_name',   label: 'Bank Name / Department Name',    type: 'text',     required: true },
        { id: 'branch_name', label: 'Branch Name',                    type: 'text',     required: true },
      ]
    },
    {
      key: 'finance',
      title: 'Means of Finance',
      icon: CurrencyDollarIcon,
      fields: [
        { id: 'i11', label: 'Do you have working capital limit at present?',              type: 'select', options: ['Yes', 'No'],              required: true, disabled: true },
        { id: 'i12', label: 'Are you going for Working Capital limit Top-up from present limit?', type: 'select', options: ['Yes', 'No'],      required: true, disabled: true },
        { id: 'i13', label: 'Present Working Capital Loan Limit (Lakhs)',                 type: 'number', min: 0,                              required: true },
        { id: 'i14', label: 'Working Capital Loan Requirement (Lakhs)',                   type: 'number', min: 0,                              required: true },
        { id: 'h15', label: 'Working Capital Loan Interest (% per annum)',                type: 'number', min: 0, max: 100, step: 0.01,        required: true },
        { id: 'h16', label: 'Processing Fees (Including GST) (%)',                        type: 'number', min: 0,          step: 0.01,         required: true },
        { id: 'h17', label: 'Working Capital (% on Turnover)',                            type: 'number', min: 15, max: 100, step: 0.01,       required: true },
        { id: 'i18', label: 'Are you going for Fresh Term Loan in the Present Financial Year?', type: 'select', options: ['Yes', 'No'],        required: true, disabled: true },
      ]
    },
    {
      key: 'years',
      title: 'Financial Years',
      icon: CalendarIcon,
      fields: [
        { id: 'i20', label: '1st Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i21', label: '2nd Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i22', label: '3rd Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i23', label: '4th Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i24', label: '5th Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i25', label: '6th Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i26', label: '7th Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i27', label: '8th Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i28', label: '9th Financial Year',  type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i29', label: '10th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i30', label: '11th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true },
        { id: 'i31', label: '12th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true },
      ]
    },
    {
      key: 'statements',
      title: 'Financial Statements',
      icon: ChartBarIcon,
      fields: [
        { id: 'i33', label: 'Gross Turnover',                                              type: 'number', min: 0,  required: true },
        { id: 'i34', label: 'Opening Stock',                                               type: 'number', min: 0,  required: true },
        { id: 'i35', label: 'Direct Material & Expenses',                                  type: 'number', min: 0,  required: true },
        { id: 'i36', label: 'Closing Stock',                                               type: 'number', min: 0,  required: true },
        { id: 'i37', label: 'Non Operating Income',                                        type: 'number', min: 0,  required: true },
        { id: 'i38', label: 'Electricity',                                                 type: 'number', min: 0,  required: true },
        { id: 'i39', label: 'Depreciation',                                                type: 'number', min: 0,  required: true },
        { id: 'i40', label: 'Rent',                                                        type: 'number', min: 0,  required: true },
        { id: 'i41', label: 'Salaries & Wages',                                            type: 'number', min: 0,  required: true },
        { id: 'i42', label: 'Processing Fees (Including GST)',                             type: 'number', min: 0,  required: true },
        { id: 'i43', label: 'Interest on CC / OD Loan',                                   type: 'number', min: 0,  required: true },
        { id: 'i44', label: 'Interest on Other Loans',                                    type: 'number', min: 0,  required: true },
        { id: 'i45', label: 'Net Profit Before Tax',                                      type: 'number',          required: true },
        { id: 'i47', label: 'Net Capital (Opening Capital + Net Profit - Drawings / Remuneration)', type: 'number', min: 0, required: true },
        { id: 'i48', label: 'Term Loans (Secured and Unsecured Loans)',                   type: 'number', min: 0,  required: true },
        { id: 'i49', label: 'Working Capital Loan Outstanding',                           type: 'number', min: 0,  required: true },
        { id: 'i50', label: 'Other Current Liabilities',                                  type: 'number', min: 0,  required: true },
        { id: 'i54', label: 'Non Current Assets',                                         type: 'number', min: 0,  required: true },
        { id: 'i55', label: 'Debtors / Receivables',                                      type: 'number', min: 0,  required: true },
        { id: 'i56', label: 'Cash and Cash Equivalents',                                  type: 'number', min: 0,  required: true },
        { id: 'i57', label: 'Other Current Assets if any',                                type: 'number', min: 0,  required: true },
      ]
    },
    {
      key: 'new_assets',
      title: 'New Asset Schedule',
      icon: BuildingOfficeIcon,
      categories: Object.keys(newAssetMapping).map(title => ({ title, ...newAssetMapping[title] }))
    },
    {
      key: 'gross_assets',
      title: 'Gross Assets Opening Balance',
      icon: BuildingLibraryIcon,
      categories: Object.keys(grossAssetMapping).map(title => ({ title, ...grossAssetMapping[title] }))
    },
    {
      key: 'term',
      title: 'Term Loan Finance Details',
      icon: CreditCardIcon,
      fields: [
        { id: 'h74', label: 'Term Loan Rate of Interest (% per annum)',          type: 'number', min: 0, step: 0.01, required: true },
        { id: 'i75', label: 'Term Loan Tenure (Years)',                           type: 'number', min: 0,             required: true },
        { id: 'i76', label: 'Repayment Type',                                    type: 'select', options: ['Fixed EMI', 'Fixed Principal'], required: true },
        { id: 'i77', label: 'Moratorium Period, if any (Months)',                type: 'number', min: 0,             required: true },
        { id: 'h78', label: 'Processing Fees Rate (Including GST) (%)',          type: 'number', min: 0, step: 0.01, required: true },
        { id: 'i79', label: 'Interest Period',                                   type: 'select', options: ['Monthly ', 'Quarterly', 'Half yearly'], required: true },
        { id: 'i80', label: 'Loan Start Month (Month immediately after sanction)', type: 'month',                   required: true, note: 'Select month and year (displays as Apr-27)' },
      ]
    },
    {
      key: 'prepared_by',
      title: 'Prepared By',
      icon: UserIcon,
      fields: [
        { id: 'i159',        label: 'Name 1 (Prepared By)',        type: 'text', required: true  },
        { id: 'i160',        label: 'Name 2 (Prepared By)',        type: 'text', required: false },
        { id: 'i161',        label: 'Address (Prepared By)',       type: 'text', required: true  },
        { id: 'i162',        label: 'Mobile Number (Prepared By)', type: 'text', required: true  },
        { id: 'bank_name',   label: 'Bank Name / Department Name', type: 'text', required: true  },
        { id: 'branch_name', label: 'Branch Name',                 type: 'text', required: true  },
      ]
    },
  ];

  useEffect(() => {
    if (initialData && isEditMode && Object.keys(initialData).length > 0) {
      setFormData(prev => {
        const merged = { ...prev };
        for (const sectionKey in initialData) {
          if (!Object.prototype.hasOwnProperty.call(initialData, sectionKey)) continue;
          const incoming = initialData[sectionKey];
          if (sectionKey === 'New Asset Schedule' || sectionKey === 'Gross Assets Opening Balance') {
            merged[sectionKey] = { ...(merged[sectionKey] || {}) };
            for (const cat in incoming) {
              if (!Object.prototype.hasOwnProperty.call(incoming, cat)) continue;
              merged[sectionKey][cat] = {
                ...(merged[sectionKey][cat] || {}),
                ...incoming[cat],
                items: Array.isArray(incoming[cat]?.items) ? [...incoming[cat].items] : []
              };
            }
          } else if (typeof incoming === 'object' && incoming !== null && !Array.isArray(incoming)) {
            merged[sectionKey] = { ...(merged[sectionKey] || {}), ...incoming };
          } else {
            merged[sectionKey] = incoming;
          }
        }
        return merged;
      });
    }
  }, [initialData, isEditMode]);

  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const handleFieldChange = useCallback((sectionTitle, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionTitle]: {
        ...prev[sectionTitle],
        [fieldId]: value
      }
    }));
  }, []);

  const updateAssetItem = useCallback((sectionTitle, categoryName, index, field, value) => {
    setFormData(prev => {
      const currentItems = [...(prev[sectionTitle]?.[categoryName]?.items || [])];
      currentItems[index] = { ...currentItems[index], [field]: value };
      const total = currentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        [sectionTitle]: {
          ...prev[sectionTitle],
          [categoryName]: { ...prev[sectionTitle]?.[categoryName], items: currentItems, total }
        }
      };
    });
  }, []);

  const addAssetItem = useCallback((sectionTitle, categoryName, maxItems) => {
    setFormData(prev => {
      const currentItems = prev[sectionTitle]?.[categoryName]?.items || [];
      if (currentItems.length >= maxItems) return prev;
      const newItems = [...currentItems, { description: '', amount: 0 }];
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        [sectionTitle]: {
          ...prev[sectionTitle],
          [categoryName]: { ...prev[sectionTitle]?.[categoryName], items: newItems, total }
        }
      };
    });
  }, []);

  const removeAssetItem = useCallback((sectionTitle, categoryName, index) => {
    setFormData(prev => {
      const currentItems = prev[sectionTitle]?.[categoryName]?.items || [];
      const newItems = currentItems.filter((_, i) => i !== index);
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        [sectionTitle]: {
          ...prev[sectionTitle],
          [categoryName]: { ...prev[sectionTitle]?.[categoryName], items: newItems, total }
        }
      };
    });
  }, []);

  const updateAssetLoanPct = useCallback((categoryName, pct, total) => {
    const computed = total > 0 ? parseFloat((total * pct / 100).toFixed(2)) : '';
    setFormData(prev => ({
      ...prev,
      'New Asset Schedule': {
        ...prev['New Asset Schedule'],
        [categoryName]: { ...prev['New Asset Schedule']?.[categoryName], loanPct: pct }
      }
    }));
    setLoanAmounts(prev => ({ ...prev, [categoryName]: computed }));
  }, []);

  const handleNewAssetLoanAmountChange = useCallback((categoryName, value, total) => {
    setLoanAmounts(prev => ({ ...prev, [categoryName]: value }));
    if (total > 0) {
      const pct = parseFloat(((parseFloat(value) || 0) / total * 100).toFixed(4));
      setFormData(prev => ({
        ...prev,
        'New Asset Schedule': {
          ...prev['New Asset Schedule'],
          [categoryName]: { ...prev['New Asset Schedule']?.[categoryName], loanPct: pct }
        }
      }));
    }
  }, []);

  const fillTestData = useCallback(() => {
    setFormData({
      'General Information': {
        i3: 'Elite Manufacturing Corp', i4: 'Company', i5: 'Robert Wilson',
        i6: 'Tech Park, Hyderabad - 500001', i7: '9876543210',
        i8: 'Manufacturing sector', i9: 'Manufacturing of Electronics',
        bank_name: 'ICICI Bank', branch_name: 'Industrial Branch'
      },
      'Means of Finance': {
        i11: 'Yes', i12: 'No', i13: 10000000, i14: 25000000,
        h15: 9.5, h16: 0.3, h17: 22, i18: 'Yes'
      },
      'Financial Years': {
        i20: '2024-25', i21: '2025-26', i22: '2026-27', i23: '2027-28',
        i24: '2028-29', i25: '2029-30', i26: '2030-31', i27: '2031-32',
        i28: '2032-33', i29: '2033-34', i30: '2034-35', i31: '2035-36'
      },
      'Financial Statements': {
        i33: 50000000, i34: 2500000, i35: 35000000, i36: 1200000,
        i37: 1500000, i38: 800000, i39: 1200000, i40: 600000,
        i41: 4000000, i42: 150000, i43: 2250000, i44: 1500000,
        i45: 9500000, i47: 22000000, i48: 38000000, i49: 6000000,
        i50: 8000000, i54: 20000000, i55: 5000000, i56: 2000000, i57: 500000
      },
      'New Asset Schedule': Object.fromEntries(
        Object.keys(newAssetMapping).map(k => [k, { items: [], total: 0, loanPct: 0 }])
      ),
      'Gross Assets Opening Balance': Object.fromEntries(
        Object.keys(grossAssetMapping).map(k => [k, { items: [], total: 0 }])
      ),
      'Term Loan Finance Details': {
        h74: 9.5, i75: 5, i76: 'Fixed Principal',
        i77: 3, h78: 1.0, i79: 'Monthly ', i80: '2027-04'
      },
      'Prepared By': {
        i159: 'PARVEZ AND NARAYANA', i160: 'Chartered Accountants',
        i161: 'Hyderabad', i162: '9014221011',
        bank_name: 'ICICI Bank', branch_name: 'Industrial Branch'
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    const excelData = {};
    const skipKeys = new Set(['bank_name', 'branch_name']);

    // Flat sections — copy all cell-ref keys, skip meta keys
    ['General Information', 'Means of Finance', 'Financial Years',
     'Financial Statements', 'Term Loan Finance Details'].forEach(sectionTitle => {
      const section = data[sectionTitle] || {};
      Object.keys(section).forEach(key => {
        if (!skipKeys.has(key)) excelData[key] = section[key];
      });
    });

    // i80: convert YYYY-MM → 01-MM-YYYY so Excel interprets as a date
    if (excelData['i80'] && /^\d{4}-\d{2}$/.test(String(excelData['i80']))) {
      const [year, month] = String(excelData['i80']).split('-');
      excelData['i80'] = `01-${month}-${year}`;
    }

    // Prepared By cell refs (i159-i162)
    const pb = data['Prepared By'] || {};
    ['i159', 'i160', 'i161', 'i162'].forEach(k => { excelData[k] = pb[k] || ''; });

    // New Asset Schedule: items (D/E cols) + loanPct (j59-j69)
    Object.keys(newAssetMapping).forEach(categoryTitle => {
      const mapping = newAssetMapping[categoryTitle];
      const categoryData = data['New Asset Schedule']?.[categoryTitle];
      if (!categoryData) return;
      (categoryData.items || []).forEach((item, index) => {
        if (index >= mapping.maxItems) return;
        const row = mapping.dataStartRow + index;
        excelData[`d${row}`] = item.description || '';
        excelData[`e${row}`] = parseFloat(item.amount) || 0;
      });
      if (mapping.loanPct) excelData[mapping.loanPct] = parseFloat(categoryData.loanPct) || 0;
    });

    // Gross Assets Opening Balance: items (D/E cols) only
    Object.keys(grossAssetMapping).forEach(categoryTitle => {
      const mapping = grossAssetMapping[categoryTitle];
      const categoryData = data['Gross Assets Opening Balance']?.[categoryTitle];
      if (!categoryData) return;
      (categoryData.items || []).forEach((item, index) => {
        if (index >= mapping.maxItems) return;
        const row = mapping.dataStartRow + index;
        excelData[`d${row}`] = item.description || '';
        excelData[`e${row}`] = parseFloat(item.amount) || 0;
      });
    });

    return excelData;
  };

  const handleSubmit = useCallback(async () => {
    try {
      const excelData = convertToExcelData(formData);
      const payload = {
        formData: {
          excelData,
          formData,
          bank_name: formData['General Information']?.['bank_name'] || '',
          branch_name: formData['General Information']?.['branch_name'] || '',
          additionalData: {
            'New Asset Schedule': formData['New Asset Schedule'],
            'Gross Assets Opening Balance': formData['Gross Assets Opening Balance']
          }
        }
      };
      await onSubmit(payload);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to submit form. Please try again.');
    }
  }, [formData, onSubmit]);

  const validateCurrentSection = useCallback(() => {
    const section = sections[currentStep];
    if (!section) return true;
    const { key } = section;
    if (key === 'new_assets') {
      const scheduleData = formData['New Asset Schedule'] || {};
      const hasAnyAssets = Object.keys(newAssetMapping).some(
        cat => (scheduleData[cat]?.total || 0) > 0
      );
      if (!hasAnyAssets) return true;
      for (const categoryName of Object.keys(newAssetMapping)) {
        const cat = scheduleData[categoryName];
        if (cat && cat.total > 0) {
          const hasPct = parseFloat(cat.loanPct) > 0;
          const hasAmt = loanAmounts[categoryName] && parseFloat(loanAmounts[categoryName]) > 0;
          if (!hasPct && !hasAmt) return false;
        }
      }
      return true;
    }
    if (key === 'gross_assets') return true;
    const fields = section.fields || [];
    const sectionData = formData[section.title] || {};
    for (const field of fields) {
      if (field.required) {
        const value = sectionData[field.id];
        if (value === '' || value === null || value === undefined) return false;
      }
    }
    return true;
  }, [currentStep, formData, loanAmounts]);

  const goToNextStep = () => {
    if (!validateCurrentSection()) {
      const section = sections[currentStep];
      if (section?.key === 'new_assets') {
        alert('Please fill Loan Percentage or Loan Amount for all asset categories that have items entered.');
      } else {
        alert('Please fill all required fields before proceeding to the next step.');
      }
      return;
    }
    if (currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderField = (field, sectionTitle) => {
    const value = formData[sectionTitle]?.[field.id] ?? '';

    return (
      <div key={field.id} className="space-y-1.5">
        <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => !field.disabled && handleFieldChange(sectionTitle, field.id, e.target.value)}
            disabled={!!field.disabled}
            required={field.required}
            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 ${field.disabled ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
          >
            <option value="">Select...</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(sectionTitle, field.id, e.target.value)}
            required={field.required}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white resize-none"
          />
        ) : field.type === 'month' ? (
          <input
            type="month"
            value={value || ''}
            onChange={(e) => handleFieldChange(sectionTitle, field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          />
        ) : (
          <input
            type={field.type}
            value={(field.type === 'number') && value === '' ? '' : value}
            onChange={(e) => handleFieldChange(sectionTitle, field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            onWheel={field.type === 'number' ? (e) => e.target.blur() : undefined}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          />
        )}
        {field.note && (
          <p className="text-xs text-gray-500 mt-1">{field.note}</p>
        )}
      </div>
    );
  };

  const renderAssetSection = (section, activeTab, setActiveTab) => {
    const sectionTitle = section.title;
    const isNewAsset = sectionTitle === 'New Asset Schedule';
    const categories = section.categories || [];
    const currentCategory = categories[activeTab];
    if (!currentCategory) return null;
    const categoryData = formData[sectionTitle]?.[currentCategory.title] || { items: [], total: 0, loanPct: 0 };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              type="button"
              className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${
                activeTab === idx
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-bold text-gray-800">
              {currentCategory.title}
            </h3>
            <div className="px-4 py-1.5 bg-gray-900 text-white rounded-lg">
              <span style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-bold">
                Total: {categoryData.total?.toLocaleString('en-IN') || 0} Lakhs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 mb-3">
            <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-6 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
              Asset Description
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-5 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
              Amount (Lakhs)
            </div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {categoryData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder={`Asset ${idx + 1} description`}
                  value={item.description || ''}
                  onChange={(e) => updateAssetItem(sectionTitle, currentCategory.title, idx, 'description', e.target.value)}
                  className="col-span-6 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                />
                <input
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                  value={item.amount || ''}
                  onChange={(e) => updateAssetItem(sectionTitle, currentCategory.title, idx, 'amount', parseFloat(e.target.value) || 0)}
                  className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeAssetItem(sectionTitle, currentCategory.title, idx)}
                  className="col-span-1 px-2 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addAssetItem(sectionTitle, currentCategory.title, currentCategory.maxItems)}
            disabled={categoryData.items?.length >= currentCategory.maxItems}
            className={`mt-3 px-4 py-2 text-xs rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 ${
              categoryData.items?.length >= currentCategory.maxItems
                ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
                : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <PlusIcon className="w-4 h-4" />
            Add Asset ({categoryData.items?.length || 0}/{currentCategory.maxItems})
          </button>

          {isNewAsset && categoryData.total > 0 && (
            <div className="mt-6 pt-4 border-t-2 border-purple-200">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <CreditCardIcon className="w-4 h-4" />
                  Loan Requirement for {currentCategory.title}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">Loan Percentage (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        onWheel={(e) => e.target.blur()}
                        min="0"
                        max="100"
                        step="0.01"
                        value={categoryData.loanPct || ''}
                        onChange={(e) => updateAssetLoanPct(currentCategory.title, parseFloat(e.target.value) || 0, categoryData.total)}
                        placeholder="Enter loan %"
                        className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 font-medium">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">Loan Amount (Lakhs)</label>
                    <div className="relative">
                      <input
                        type="number"
                        onWheel={(e) => e.target.blur()}
                        min="0"
                        value={loanAmounts[currentCategory.title] || ''}
                        onChange={(e) => handleNewAssetLoanAmountChange(currentCategory.title, e.target.value, categoryData.total)}
                        placeholder="Enter loan amount"
                        className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 font-medium">₹</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Category Total:</span>
                    <span className="font-semibold text-gray-900">{categoryData.total.toLocaleString('en-IN')} Lakhs</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Loan Required ({(parseFloat(categoryData.loanPct) || 0).toFixed(1)}%):</span>
                    <span className="font-bold text-purple-700">
                      {(
                        loanAmounts[currentCategory.title] && loanAmounts[currentCategory.title] !== ''
                          ? parseFloat(loanAmounts[currentCategory.title])
                          : (categoryData.total * (parseFloat(categoryData.loanPct) || 0) / 100)
                      ).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakhs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const currentSection = sections[currentStep];
  const progress = ((currentStep + 1) / sections.length) * 100;
  const isLastStep = currentStep === sections.length - 1;
  const canProceed = validateCurrentSection();

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', sans-serif; }
        body, input, select, textarea, button { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #111827; }
      `}</style>

      <div className="bg-white rounded-xl shadow-soft p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900 mb-2">
            Format CC7 - Credit Assessment Report
          </h1>
          <p className="text-gray-600 text-sm">Complete each section to generate your financial report</p>
        </div>

        <div className="mb-4 flex justify-center">
          <button
            className="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 text-xs font-medium"
            onClick={fillTestData}
            type="button"
          >
            Fill Test Data
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xs font-semibold text-gray-700">
              Step {currentStep + 1} of {sections.length}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-6 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex gap-2 min-w-max">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                    index === currentStep
                      ? 'bg-white-900 text-black border border-gray-900'
                      : index < currentStep
                        ? 'bg-gray-100 text-gray-700 border border-gray-300'
                        : 'bg-white text-gray-500 border border-gray-200 cursor-not-allowed'
                  }`}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                  {index < currentStep && <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            {React.createElement(currentSection.icon, { className: "w-6 h-6 text-gray-900" })}
            <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xl font-bold text-gray-900">
              {currentSection.title}
            </h2>
          </div>

          <div className="bg-ghostwhite rounded-lg p-4" style={{ backgroundColor: '#F8F8FF' }}>
            {currentSection.key === 'new_assets' ? (
              renderAssetSection(currentSection, activeNewAssetTab, setActiveNewAssetTab)
            ) : currentSection.key === 'gross_assets' ? (
              renderAssetSection(currentSection, activeGrossAssetTab, setActiveGrossAssetTab)
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentSection.fields?.map(field => renderField(field, currentSection.title))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-5 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent font-medium text-sm flex items-center gap-1"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>

          {isLastStep ? (
            <button
              type="button"
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 8l3-2.709z"></path>
                  </svg>
                  {isEditMode ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  {isEditMode ? 'Save & Update' : 'Submit Form'}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="px-5 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-300 font-medium text-sm flex items-center gap-1"
              onClick={goToNextStep}
              disabled={!canProceed}
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {!canProceed && !isLastStep && (
          <div className="mt-3 text-xs text-red-600 text-center">
            {currentSection.key === 'new_assets'
              ? 'Please fill Loan Percentage or Loan Amount for all asset categories with items entered'
              : 'Please fill all required fields to proceed'}
          </div>
        )}
      </div>
    </div>
  );
};

export default FRCC7Form;
