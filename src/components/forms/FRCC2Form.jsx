import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

// Generate financial year options in 2024-25 format, current year to +20 years
const generateFinancialYearOptions = () => {
  const options = [];
  const currentYear = new Date().getFullYear();
  for (let start = currentYear; start <= currentYear + 20; start++) {
    options.push(`${start}-${String(start + 1).slice(-2)}`);
  }
  return options;
};

// Audited fields config
const AUDITED_FIELDS = [
  { id: 'i23', label: 'Turnover (₹)',                                      type: 'number', min: 0, required: true },
  { id: 'i24', label: 'Opening Stock (₹)',                                  type: 'number', min: 0, required: true },
  { id: 'i25', label: 'Direct Material & Expenses (₹)',                     type: 'number', min: 0, required: true },
  { id: 'i26', label: 'Closing Stock (₹)',                                  type: 'number', min: 0, required: true },
  { id: 'i27', label: 'Non Operating Income (₹)',                           type: 'number', min: 0, required: true },
  { id: 'i28', label: 'Depreciation (₹)',                                   type: 'number', min: 0, required: true },
  { id: 'i29', label: 'Electricity (₹)',                                    type: 'number', min: 0, required: true },
  { id: 'i30', label: 'Rent (₹)',                                           type: 'number', min: 0, required: true },
  { id: 'i31', label: 'Salaries & Wages (₹)',                               type: 'number', min: 0, required: true },
  { id: 'i32', label: 'Interest on Other Loans (₹)',                        type: 'number', min: 0, required: true },
  { id: 'i33', label: 'Net Profit Before Tax (₹)',                          type: 'number', min: 0, required: true },
  { id: 'i35', label: 'Net Capital (Opening + Profit - Drawings) (₹)',      type: 'number', min: 0, required: true },
  { id: 'i36', label: 'Term Loans (Secured + Unsecured Total) (₹)',         type: 'number', min: 0, required: true },
  { id: 'i37', label: 'Current Liabilities (₹)',                            type: 'number', min: 0, required: true },
  { id: 'i38', label: 'Net Total Fixed Assets (₹)',                         type: 'number', min: 0, required: true },
  { id: 'i41', label: 'Investments (₹)',                                    type: 'number', min: 0, required: true },
  { id: 'i42', label: 'Debtors (₹)',                                        type: 'number', min: 0, required: true },
  { id: 'i43', label: 'Cash and Cash Equivalents (₹)',                      type: 'number', min: 0, required: true },
  { id: 'i44', label: 'Other Current Assets (₹)',                           type: 'number', min: 0, required: true },
];

// Provisional fields config
// k18-display: shows months from Financial Years — display-only, not sent to backend
// i48 (Opening Stock): auto-filled from audited i26 — display-only, not sent to backend
const PROVISIONAL_FIELDS = [
  { id: 'months_display', label: 'No of Months Completed in This Financial Year', type: 'months-display', note: 'Auto-filled from Financial Years' },
  { id: 'i47', label: 'Turnover (₹)',                                       type: 'number', min: 0, required: true },
  { id: 'i48', label: 'Opening Stock (₹)',                                  type: 'autofill', sourceId: 'i26', note: 'Auto-filled from Audited Closing Stock' },
  { id: 'i49', label: 'Direct Material & Expenses (₹)',                     type: 'number', min: 0, required: true },
  { id: 'i50', label: 'Closing Stock (₹)',                                  type: 'number', min: 0, required: true },
  { id: 'i51', label: 'Non Operating Income (₹)',                           type: 'number', min: 0, required: true },
  { id: 'i52', label: 'Depreciation (₹)',                                   type: 'number', min: 0, required: true },
  { id: 'i53', label: 'Electricity (₹)',                                    type: 'number', min: 0, required: true },
  { id: 'i54', label: 'Rent (₹)',                                           type: 'number', min: 0, required: true },
  { id: 'i55', label: 'Salaries & Wages (₹)',                               type: 'number', min: 0, required: true },
  { id: 'i56', label: 'Interest on Other Loans (Secured & Unsecured) (₹)', type: 'number', min: 0, required: true },
  { id: 'i57', label: 'Net Profit Before Tax (₹)',                          type: 'number', min: 0, required: true },
  { id: 'i59', label: 'Net Capital (Opening + Profit - Drawings) (₹)',      type: 'number', min: 0, required: true },
  { id: 'i60', label: 'Term Loans (Secured + Unsecured Total) (₹)',         type: 'number', min: 0, required: true },
  { id: 'i61', label: 'Current Liabilities (₹)',                            type: 'number', min: 0, required: true },
  { id: 'i65', label: 'Investments (₹)',                                    type: 'number', min: 0, required: true },
  { id: 'i66', label: 'Debtors (₹)',                                        type: 'number', min: 0, required: true },
  { id: 'i67', label: 'Cash and Cash Equivalents (₹)',                      type: 'number', min: 0, required: true },
  { id: 'i68', label: 'Other Current Assets (₹)',                           type: 'number', min: 0, required: true },
];

// Form sections
const sections = [
  {
    key: 'general',
    title: 'General Information',
    icon: DocumentTextIcon,
    fields: [
      { id: 'i3', label: 'Name of Firm',                      type: 'text',     required: true, note: 'Enter your company/firm name' },
      { id: 'i4', label: 'Status of Concern',                 type: 'select',   options: ['Sole Proprietorship', 'Partnership Firm', 'Private limited Company', 'LLP', 'Society', 'Trust', 'Federation', 'SHG'], required: true, note: 'Select business structure' },
      { id: 'i5', label: 'Name of Authorised Person',         type: 'text',     required: true, note: 'Enter the authorised person name' },
      { id: 'i6', label: 'Firm Address',                      type: 'textarea', required: true, note: 'Enter complete business address' },
      { id: 'i7', label: 'Contact No. of Authorised Person',  type: 'text',     required: true, note: 'Enter contact number' },
      { id: 'i8', label: 'Sector',                            type: 'select',   options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true, note: 'Select your primary business sector' },
      { id: 'i9', label: 'Nature of Business',                type: 'text',     required: true, note: 'Describe your business activity' },
    ]
  },
  {
    key: 'finance',
    title: 'Means of Finance',
    icon: CurrencyDollarIcon,
    fields: [
      { id: 'i11',  label: 'Do you have working capital limit at present?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'i12',  label: 'Working Capital Loan Requirement (₹)',          type: 'number', min: 0, required: true },
      { id: 'h13',  label: 'Working Capital Loan Interest (Annual %)',      type: 'number', min: 0, max: 100, step: 0.01, required: true },
      { id: 'h14',  label: 'Processing Fees (Including GST) %',             type: 'number', min: 0, required: true },
      { id: 'h15',  label: 'Working Capital (% of Turnover)',               type: 'number', min: 0, step: 0.01, required: true, note: '15% or more' },
    ]
  },
  {
    key: 'years',
    title: 'Financial Years',
    icon: CalendarIcon,
    fields: [
      { id: 'i17', label: '1st Financial Year (Audited)',      type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i18', label: '2nd Financial Year (Provisional)',  type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'k18', label: 'Months Completed in Provisional Year', type: 'number', min: 1, max: 12, required: true, note: 'How many months of the provisional year are complete?' },
    ]
  },
  {
    key: 'financial-statements',
    title: 'Financial Statements',
    icon: ChartBarIcon,
  },
  {
    key: 'fixed',
    title: 'Fixed Assets Schedule',
    icon: BuildingOfficeIcon,
    categories: [
      { title: 'Plant and Machinery',                          startIndex: 122, itemCount: 10 },
      { title: 'Service Equipment',                            startIndex: 132, itemCount: 10 },
      { title: 'Shed Construction and Civil works',            startIndex: 142, itemCount: 10 },
      { title: 'Land',                                         startIndex: 152, itemCount: 3  },
      { title: 'Electrical and Plumbing Items',                startIndex: 155, itemCount: 9  },
      { title: 'Electronic items',                             startIndex: 164, itemCount: 10 },
      { title: 'Furniture and Fittings',                       startIndex: 174, itemCount: 10 },
      { title: 'Vehicles',                                     startIndex: 184, itemCount: 10 },
      { title: 'Live stock',                                   startIndex: 194, itemCount: 9  },
      { title: 'Other Assets (Including Amortisable Assets)',  startIndex: 203, itemCount: 10 },
      { title: 'Other Assets (Nil Depreciation)',              startIndex: 213, itemCount: 10 },
    ]
  },
  {
    key: 'prepared_by',
    title: 'Prepared By',
    icon: UsersIcon,
    fields: [
      { id: 'bank_name',   label: 'Bank Name / Department Name', type: 'text', required: true },
      { id: 'branch_name', label: 'Branch Name',                 type: 'text', required: true },
      { id: 'j123', label: 'Name 1',    type: 'text', required: true },
      { id: 'j124', label: 'Name 2',    type: 'text', required: true },
      { id: 'j125', label: 'Address',   type: 'text', required: true },
      { id: 'j126', label: 'Contact',   type: 'text', required: true },
    ]
  }
];

// Fixed assets row mapping
const fixedAssetsMapping = {
  "Plant and Machinery":                         { dataStartRow: 122, maxItems: 10 },
  "Service Equipment":                           { dataStartRow: 132, maxItems: 10 },
  "Shed Construction and Civil works":           { dataStartRow: 142, maxItems: 10 },
  "Land":                                        { dataStartRow: 152, maxItems: 3  },
  "Electrical and Plumbing Items":               { dataStartRow: 155, maxItems: 9  },
  "Electronic items":                            { dataStartRow: 164, maxItems: 10 },
  "Furniture and Fittings":                      { dataStartRow: 174, maxItems: 10 },
  "Vehicles":                                    { dataStartRow: 184, maxItems: 10 },
  "Live stock":                                  { dataStartRow: 194, maxItems: 9  },
  "Other Assets (Including Amortisable Assets)": { dataStartRow: 203, maxItems: 10 },
  "Other Assets (Nil Depreciation)":             { dataStartRow: 213, maxItems: 10 },
};

const FRCC2Form = ({
  onSubmit,
  templateId = 'frcc2',
  initialData = null,
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData || {
    "General Information": {
      "i3": "", "i4": "", "i5": "", "i6": "", "i7": "", "i8": "", "i9": ""
    },
    "Means of Finance": {
      "i11": "", "i12": "", "h13": "", "h14": "", "h15": ""
    },
    "Financial Years": {
      "i17": "", "i18": "", "k18": ""
    },
    "Audited Financial Statements": {
      "i23": "", "i24": "", "i25": "", "i26": "", "i27": "", "i28": "",
      "i29": "", "i30": "", "i31": "", "i32": "", "i33": "",
      "i35": "", "i36": "", "i37": "", "i38": "",
      "i41": "", "i42": "", "i43": "", "i44": ""
    },
    "Provisional Financial Statements": {
      "i47": "", "i49": "", "i50": "", "i51": "", "i52": "",
      "i53": "", "i54": "", "i55": "", "i56": "", "i57": "",
      "i59": "", "i60": "", "i61": "",
      "i65": "", "i66": "", "i67": "", "i68": ""
    },
    "Fixed Assets Schedule": {
      "Plant and Machinery":                         { items: [], total: 0 },
      "Service Equipment":                           { items: [], total: 0 },
      "Shed Construction and Civil works":           { items: [], total: 0 },
      "Land":                                        { items: [], total: 0 },
      "Electrical and Plumbing Items":               { items: [], total: 0 },
      "Electronic items":                            { items: [], total: 0 },
      "Furniture and Fittings":                      { items: [], total: 0 },
      "Vehicles":                                    { items: [], total: 0 },
      "Live stock":                                  { items: [], total: 0 },
      "Other Assets (Including Amortisable Assets)": { items: [], total: 0 },
      "Other Assets (Nil Depreciation)":             { items: [], total: 0 },
    },
    "Prepared By": {
      "bank_name": "", "branch_name": "",
      "j123": "PARVEZ AND NARAYANA",
      "j124": "Chartered Accountants",
      "j125": "",
      "j126": "9014221011"
    }
  });

  const [showResult, setShowResult] = useState(false);
  const [finalJson, setFinalJson] = useState(null);
  const [activeAssetTab, setActiveAssetTab] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData(initialData);
    }
  }, [initialData, isEditMode]);

  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const updateField = useCallback((sectionTitle, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionTitle]: {
        ...prev[sectionTitle],
        [fieldId]: value
      }
    }));
    setFieldErrors(prev => {
      const key = `${sectionTitle}.${fieldId}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Derived: audited closing stock auto-fills provisional opening stock
  const auditedClosingStock = formData["Audited Financial Statements"]["i26"] || 0;

  const addFixedAssetItem = useCallback((categoryName) => {
    setFormData(prev => {
      const currentItems = prev["Fixed Assets Schedule"][categoryName]?.items || [];
      const mapping = fixedAssetsMapping[categoryName];
      if (currentItems.length >= mapping.maxItems) return prev;
      const newItems = [...currentItems, { description: '', amount: 0 }];
      const total = newItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      return { ...prev, "Fixed Assets Schedule": { ...prev["Fixed Assets Schedule"], [categoryName]: { items: newItems, total } } };
    });
  }, []);

  const removeFixedAssetItem = useCallback((categoryName, index) => {
    setFormData(prev => {
      const newItems = prev["Fixed Assets Schedule"][categoryName].items.filter((_, i) => i !== index);
      const total = newItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      return { ...prev, "Fixed Assets Schedule": { ...prev["Fixed Assets Schedule"], [categoryName]: { items: newItems, total } } };
    });
  }, []);

  const updateFixedAssetItem = useCallback((categoryName, index, field, value) => {
    setFormData(prev => {
      const items = [...(prev["Fixed Assets Schedule"][categoryName]?.items || [])];
      items[index] = { ...items[index], [field]: value };
      const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      return { ...prev, "Fixed Assets Schedule": { ...prev["Fixed Assets Schedule"], [categoryName]: { items, total } } };
    });
  }, []);

  const fillTestData = useCallback(() => {
    setFormData({
      "General Information": {
        "i3": "MEDICAID LABS LLP", "i4": "LLP", "i5": "N Apuroop",
        "i6": "Autonagar, Vijayawada, Andhra Pradesh",
        "i7": "9876543210", "i8": "Trading sector",
        "i9": "Trading in Pharmaceutical Products"
      },
      "Means of Finance": { "i11": "No", "i12": 10000000, "h13": 12, "h14": 1, "h15": 15 },
      "Financial Years": { "i17": "2024-25", "i18": "2025-26", "k18": 6 },
      "Audited Financial Statements": {
        "i23": 67000000, "i24": 12000000, "i25": 43000000, "i26": 13000000,
        "i27": 50000, "i28": 150000, "i29": 300000, "i30": 600000,
        "i31": 3000000, "i32": 800000, "i33": 5800000,
        "i35": 8000000, "i36": 10000000, "i37": 5000000, "i38": 2000000,
        "i41": 1000000, "i42": 5500000, "i43": 500000, "i44": 2000000
      },
      "Provisional Financial Statements": {
        "i47": 35000000, "i49": 22000000, "i50": 13500000,
        "i51": 25000, "i52": 75000, "i53": 150000, "i54": 300000,
        "i55": 1500000, "i56": 400000, "i57": 3000000,
        "i59": 10000000, "i60": 9500000, "i61": 5500000,
        "i65": 1000000, "i66": 2900000, "i67": 1750000, "i68": 2500000
      },
      "Fixed Assets Schedule": {
        "Plant and Machinery": { items: [{ description: "Packaging Machine", amount: 800000 }, { description: "Conveyor System", amount: 300000 }], total: 1100000 },
        "Service Equipment":                           { items: [], total: 0 },
        "Shed Construction and Civil works":           { items: [], total: 0 },
        "Land":                                        { items: [], total: 0 },
        "Electrical and Plumbing Items":               { items: [], total: 0 },
        "Electronic items":                            { items: [], total: 0 },
        "Furniture and Fittings":                      { items: [{ description: "Office Furniture", amount: 350000 }], total: 350000 },
        "Vehicles":                                    { items: [], total: 0 },
        "Live stock":                                  { items: [], total: 0 },
        "Other Assets (Including Amortisable Assets)": { items: [], total: 0 },
        "Other Assets (Nil Depreciation)":             { items: [], total: 0 },
      },
      "Prepared By": {
        "bank_name": "SBI", "branch_name": "Main Branch",
        "j123": "PARVEZ AND NARAYANA", "j124": "Chartered Accountants",
        "j125": "Hyderabad, Telangana", "j126": "9014221011"
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    const excelData = {};

    // General Information
    ['i3','i4','i5','i6','i7','i8','i9'].forEach(k => { excelData[k] = data['General Information'][k]; });

    // Means of Finance
    ['i11','i12','h13','h14','h15'].forEach(k => { excelData[k] = data['Means of Finance'][k]; });

    // Financial Years
    ['i17','i18','k18'].forEach(k => { excelData[k] = data['Financial Years'][k]; });

    // Audited Financial Statements (i38 is computed — still send it)
    ['i23','i24','i25','i26','i27','i28','i29','i30','i31','i32','i33',
     'i35','i36','i37','i38','i41','i42','i43','i44'].forEach(k => {
      excelData[k] = data['Audited Financial Statements'][k];
    });

    // Provisional Financial Statements (i48 auto-filled from audited i26, months_display not sent)
    excelData['i48'] = data['Audited Financial Statements']['i26'];
    ['i47','i49','i50','i51','i52','i53','i54','i55','i56','i57',
     'i59','i60','i61','i65','i66','i67','i68'].forEach(k => {
      excelData[k] = data['Provisional Financial Statements'][k];
    });

    // Prepared By
    ['bank_name','branch_name','j123','j124','j125','j126'].forEach(k => {
      excelData[k] = data['Prepared By']?.[k];
    });

    // Fixed Assets Schedule
    if (data['Fixed Assets Schedule']) {
      Object.entries(data['Fixed Assets Schedule']).forEach(([categoryName, categoryData]) => {
        const mapping = fixedAssetsMapping[categoryName];
        if (mapping && categoryData.items && Array.isArray(categoryData.items)) {
          categoryData.items.slice(0, mapping.maxItems).forEach((item, index) => {
            const row = mapping.dataStartRow + index;
            if (item.description) excelData[`D${row}`] = item.description;
            if (item.amount !== undefined && item.amount !== null) excelData[`E${row}`] = parseFloat(item.amount) || 0;
          });
        }
      });
    }

    return excelData;
  };

  const validateCurrentSection = useCallback(() => {
    const currentSection = sections[currentStep];

    if (currentSection.key === 'fixed') return true;

    if (currentSection.key === 'financial-statements') {
      const auditedData = formData["Audited Financial Statements"];
      const provisionalData = formData["Provisional Financial Statements"];
      for (const field of AUDITED_FIELDS) {
        if (field.type === 'computed') continue;
        if (field.required && (auditedData[field.id] === '' || auditedData[field.id] === null || auditedData[field.id] === undefined)) return false;
      }
      for (const field of PROVISIONAL_FIELDS) {
        if (field.type === 'computed' || field.type === 'autofill' || field.type === 'months-display') continue;
        if (field.required && (provisionalData[field.id] === '' || provisionalData[field.id] === null || provisionalData[field.id] === undefined)) return false;
      }
      return true;
    }

    const sectionData = formData[currentSection.title];
    for (const field of currentSection.fields || []) {
      if (field.required) {
        const value = sectionData?.[field.id];
        if (value === '' || value === null || value === undefined) return false;
      }
    }
    return true;
  }, [currentStep, formData]);

  const validateAllSections = useCallback(() => {
    const errors = {};
    sections.forEach(section => {
      if (section.key === 'fixed') return;
      if (section.key === 'financial-statements') {
        const auditedData = formData["Audited Financial Statements"] || {};
        AUDITED_FIELDS.forEach(field => {
          if (!field.required || field.type === 'computed' || field.type === 'autofill' || field.type === 'months-display') return;
          const value = auditedData[field.id];
          const key = `Audited Financial Statements.${field.id}`;
          if (value === '' || value === null || value === undefined) {
            errors[key] = 'This field is required';
          }
        });
        const provisionalData = formData["Provisional Financial Statements"] || {};
        PROVISIONAL_FIELDS.forEach(field => {
          if (!field.required || field.type === 'computed' || field.type === 'autofill' || field.type === 'months-display') return;
          const value = provisionalData[field.id];
          const key = `Provisional Financial Statements.${field.id}`;
          if (value === '' || value === null || value === undefined) {
            errors[key] = 'This field is required';
          }
        });
        return;
      }
      const sectionData = formData[section.title] || {};
      (section.fields || []).forEach(field => {
        if (!field.required) return;
        const value = sectionData[field.id];
        const key = `${section.title}.${field.id}`;
        if (value === '' || value === null || value === undefined) {
          errors[key] = 'This field is required';
          return;
        }
        if (field.id === 'i7' && section.key === 'general') {
          if (!/^\d{10}$/.test(String(value).trim())) {
            errors[key] = 'Enter a valid 10-digit contact number';
          }
          return;
        }
        if (field.id === 'h13') {
          if (Number(value) <= 0) errors[key] = 'Interest rate must be greater than 0';
          return;
        }
        if (field.id === 'h15') {
          if (Number(value) < 15) errors[key] = 'Working capital must be 15% or more of turnover';
          return;
        }
        if (field.id === 'k18') {
          const months = Number(value);
          if (months < 1 || months > 12) errors[key] = 'Months must be between 1 and 12';
        }
      });
    });
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    const errors = validateAllSections();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      const errTitle = firstKey.split('.').slice(0, -1).join('.');
      let idx = sections.findIndex(s => s.title === errTitle);
      if (idx === -1 && (errTitle === 'Audited Financial Statements' || errTitle === 'Provisional Financial Statements')) {
        idx = sections.findIndex(s => s.key === 'financial-statements');
      }
      if (idx !== -1) setCurrentStep(idx);
      return;
    }
    setFieldErrors({});
    if (onSubmit) {
      const excelData = convertToExcelData(formData);
      onSubmit({
        formData: {
          excelData,
          formData,
          bank_name: formData["Prepared By"]["bank_name"],
          branch_name: formData["Prepared By"]["branch_name"]
        },
        templateId: templateId || 'frcc2',
        reportId
      });
    }
  }, [formData, validateAllSections, onSubmit, templateId, reportId]);

  const goToNextStep = () => {
    const cs = sections[currentStep];
    if (cs.key !== 'fixed') {
      const sectionErrors = {};
      if (cs.key === 'financial-statements') {
        const auditedData = formData["Audited Financial Statements"] || {};
        AUDITED_FIELDS.forEach(field => {
          if (!field.required || field.type === 'computed' || field.type === 'autofill' || field.type === 'months-display') return;
          const value = auditedData[field.id];
          if (value === '' || value === null || value === undefined)
            sectionErrors[`Audited Financial Statements.${field.id}`] = 'This field is required';
        });
        const provisionalData = formData["Provisional Financial Statements"] || {};
        PROVISIONAL_FIELDS.forEach(field => {
          if (!field.required || field.type === 'computed' || field.type === 'autofill' || field.type === 'months-display') return;
          const value = provisionalData[field.id];
          if (value === '' || value === null || value === undefined)
            sectionErrors[`Provisional Financial Statements.${field.id}`] = 'This field is required';
        });
      } else {
        const sectionData = formData[cs.title] || {};
        (cs.fields || []).forEach(field => {
          if (!field.required) return;
          const value = sectionData[field.id];
          const key = `${cs.title}.${field.id}`;
          if (value === '' || value === null || value === undefined) {
            sectionErrors[key] = 'This field is required'; return;
          }
          if (field.id === 'i7') {
            if (!/^\d{10}$/.test(String(value).trim())) sectionErrors[key] = 'Enter a valid 10-digit contact number';
            return;
          }
          if (field.id === 'h13') { if (Number(value) <= 0) sectionErrors[key] = 'Interest rate must be greater than 0'; return; }
          if (field.id === 'h15') { if (Number(value) < 15) sectionErrors[key] = 'Working capital must be 15% or more of turnover'; return; }
          if (field.id === 'k18') { const m = Number(value); if (m < 1 || m > 12) sectionErrors[key] = 'Months must be between 1 and 12'; }
        });
      }
      if (Object.keys(sectionErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...sectionErrors }));
        return;
      }
    }
    if (currentStep < sections.length - 1) setCurrentStep(currentStep + 1);
  };

  const nextStep = () => {
    goToNextStep();
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderField = (field, sectionTitle) => {
    const value = formData[sectionTitle]?.[field.id] ?? '';

    if (field.type === 'months-display') {
      return (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label}
            <span className="ml-1 text-xs font-normal text-purple-600">(auto-filled)</span>
          </label>
          <input
            type="text"
            value={formData["Financial Years"]["k18"] ? `${formData["Financial Years"]["k18"]} months` : '—'}
            disabled
            className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-purple-50 text-purple-700"
          />
          {field.note && <p className="text-xs text-gray-500 mt-1">{field.note}</p>}
        </div>
      );
    }

    if (field.type === 'autofill') {
      return (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label}
            <span className="ml-1 text-xs font-normal text-blue-600">(auto-filled)</span>
          </label>
          <input
            type="text"
            value={auditedClosingStock || 'From Audited Closing Stock'}
            disabled
            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-blue-50 text-blue-700"
          />
          {field.note && <p className="text-xs text-gray-500 mt-1">{field.note}</p>}
        </div>
      );
    }

    if (field.type === 'computed') {
      return (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label}
          </label>
          <input
            type="text"
            value={value || 'Auto-calculated'}
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
          {field.note && (
            <p className="text-xs text-gray-500 mt-1">{field.note}</p>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      const err = fieldErrors[`${sectionTitle}.${field.id}`];
      return (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => updateField(sectionTitle, field.id, e.target.value)}
            required={field.required}
            className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white`}
          >
            <option value="">Select...</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {err ? <p className="text-xs text-red-500 mt-1">{err}</p> : field.note && (
            <p className="text-xs text-gray-500 mt-1">{field.note}</p>
          )}
        </div>
      );
    }

    if (field.type === 'textarea') {
      const err = fieldErrors[`${sectionTitle}.${field.id}`];
      return (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => updateField(sectionTitle, field.id, e.target.value)}
            required={field.required}
            rows={2}
            className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white resize-none`}
          />
          {err ? <p className="text-xs text-red-500 mt-1">{err}</p> : field.note && (
            <p className="text-xs text-gray-500 mt-1">{field.note}</p>
          )}
        </div>
      );
    }

    const err = fieldErrors[`${sectionTitle}.${field.id}`];
    return (
      <div key={field.id} className="space-y-1.5">
        <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={field.type || 'text'}
          value={value}
          onChange={(e) => updateField(sectionTitle, field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step}
          className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white`}
        />
        {err ? <p className="text-xs text-red-500 mt-1">{err}</p> : field.note && (
          <p className="text-xs text-gray-500 mt-1">{field.note}</p>
        )}
      </div>
    );
  };

  const renderFixedAssetsSection = (section) => {
    const categories = section.categories || [];
    const currentCategory = categories[activeAssetTab];

    if (!currentCategory) return null;

    const categoryData = formData["Fixed Assets Schedule"][currentCategory.title] || { items: [], total: 0 };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveAssetTab(idx)}
              type="button"
              className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${activeAssetTab === idx
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
                Total: ₹{categoryData.total?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 mb-3">
            <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-6 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
              Item Description
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-5 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
              Amount (₹)
            </div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {categoryData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder={`Item ${idx + 1} description`}
                  value={item.description || ''}
                  onChange={(e) => updateFixedAssetItem(currentCategory.title, idx, 'description', e.target.value)}
                  className="col-span-6 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                />
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                  value={item.amount || ''}
                  onChange={(e) => updateFixedAssetItem(currentCategory.title, idx, 'amount', parseFloat(e.target.value) || 0)}
                  className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeFixedAssetItem(currentCategory.title, idx)}
                  className="col-span-1 px-2 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addFixedAssetItem(currentCategory.title)}
            className="mt-3 px-4 py-2 text-xs rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
          >
            <PlusIcon className="w-4 h-4" />
            Add Item ({categoryData.items?.length || 0}/{currentCategory.itemCount})
          </button>
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
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Manrope', sans-serif;
        }
        
        body, input, select, textarea, button {
          font-family: 'Inter', sans-serif;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f2937;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #111827;
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-soft p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900 mb-2">
            Format CC2 - Credit Card Form
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
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${index === currentStep
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
            {currentSection.key === 'financial-statements' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-bold text-gray-800 mb-1">
                    Audited Financial Statements
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Year: {formData["Financial Years"]["i17"] || '—'}</p>
                  <div className="space-y-3">
                    {AUDITED_FIELDS.map(field => renderField(field, "Audited Financial Statements"))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-bold text-gray-800 mb-1">
                    Provisional Financial Statements
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Year: {formData["Financial Years"]["i18"] || '—'}
                    {formData["Financial Years"]["k18"] ? ` · ${formData["Financial Years"]["k18"]} months` : ''}
                  </p>
                  <div className="space-y-3">
                    {PROVISIONAL_FIELDS.map(field => renderField(field, "Provisional Financial Statements"))}
                  </div>
                </div>
              </div>
            ) : currentSection.key === 'fixed' ? (
              renderFixedAssetsSection(currentSection)
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
            onClick={previousStep}
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
              className="px-5 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm flex items-center gap-1"
              onClick={nextStep}
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {!canProceed && !isLastStep && (
          <div className="mt-3 text-xs text-red-600 text-center">
            Please fill all required fields to proceed
          </div>
        )}
      </div>
    </div>
  );
};

export default FRCC2Form;


