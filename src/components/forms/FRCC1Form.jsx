import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Generate financial year options in 2024-25 format, current year to +20 years
const generateFinancialYearOptions = () => {
  const options = [];
  const currentYear = new Date().getFullYear();
  for (let start = currentYear; start <= currentYear + 20; start++) {
    const shortNext = String(start + 1).slice(-2);
    options.push(`${start}-${shortNext}`);
  }
  return options;
};

// Form configuration
const sections = [
  {
    key: 'general',
    title: 'General Information',
    icon: DocumentTextIcon,
    fields: [
      { id: 'i4', label: 'Name of Firm', type: 'text', required: true, note: 'Enter your company/firm name' },
      { id: 'i5', label: 'Status of Concern', type: 'select', options: ['Sole Proprietorship', 'Partnership Firm', 'Private limited Company', 'LLP', 'Society', 'Trust', 'Federation', 'SHG'], required: true, note: 'Select the legal status' },
      { id: 'i6', label: 'Name of Authorised Person', type: 'text', required: true, note: 'Enter the authorised person name' },
      { id: 'i7', label: 'Firm Address', type: 'textarea', required: true, note: 'Enter complete business address' },
      { id: 'i8', label: 'Contact No. of Authorised Person', type: 'text', required: true, note: 'Enter contact number' },
      { id: 'i9', label: 'Sector', type: 'select', options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true, note: 'Select your primary business sector' },
      { id: 'i10', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' }
    ]
  },
  {
    key: 'finance',
    title: 'Means of Finance',
    icon: CurrencyDollarIcon,
    fields: [
      { id: 'i12', label: 'Do you have working capital limit at present?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you have existing loan' },
      { id: 'i13', label: 'Working Capital Loan Requirement (₹)', type: 'number', min: 0, required: true, note: 'Enter loan amount in rupees' },
      { id: 'h14', label: 'Working Capital Loan Interest (Annual %)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Enter annual interest rate' },
      { id: 'h15', label: 'Processing Fees (Including GST) %', type: 'number', min: 0, required: true, note: 'Enter processing fee percentage' },
      { id: 'h16', label: 'Working Capital (% of Turnover)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Enter working capital % of turnover (15% or more)' }
    ]
  },
  {
    key: 'years',
    title: 'Financial Years',
    icon: CalendarIcon,
    fields: [
      { id: 'i18', label: '1st Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select first projection year' },
      { id: 'i19', label: '2nd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select second projection year' },
      { id: 'i20', label: '3rd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select third projection year' },
      { id: 'i21', label: '4th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select fourth projection year' },
      { id: 'i22', label: '5th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select fifth projection year' }
    ]
  },
  {
    key: 'indirect_expenses',
    title: 'Indirect Expenses',
    icon: ChartBarIcon,
    fields: [
      { id: 'i24', label: 'Rent / Lease per Month (₹)', type: 'number', min: 0, required: true, note: 'Enter monthly rent or lease amount' },
      { id: 'H25', label: 'Rental Increment (Annual %)', type: 'number', min: 0, step: 0.1, required: true, note: 'Enter annual rental increase percentage' },
      { id: 'i26', label: 'Power Charges per Month (₹)', type: 'number', min: 0, required: true, note: 'Enter monthly electricity cost' },
      { id: 'h27', label: 'Power Charges Increment (Annual %)', type: 'number', min: 0, step: 0.1, required: true, note: 'Enter annual power charges increase percentage' },
      { id: 'h28', label: 'Sales Growth (Annual %)', type: 'number', min: 0, step: 0.1, required: true, note: 'Enter annual sales growth percentage' },
      { id: 'i29', label: 'No of Months Interest paid in First Financial Year', type: 'number', min: 1, max: 12, required: true, note: 'Enter number of months' },
      { id: 'i30', label: 'No of Months Turnover done in First Financial Year', type: 'number', min: 1, max: 12, required: true, note: 'Enter operational months' }
    ]
  },
  {
    key: 'fixed',
    title: 'Fixed Assets Schedule',
    icon: BuildingOfficeIcon,
    categories: [
      { title: 'Plant and Machinery',                          startIndex: 95,  itemCount: 10 },
      { title: 'Service Equipment',                            startIndex: 105, itemCount: 10 },
      { title: 'Shed, Construction and Civil works',           startIndex: 115, itemCount: 10 },
      { title: 'Land',                                         startIndex: 125, itemCount: 3  },
      { title: 'Electrical and Plumbing Items',                startIndex: 128, itemCount: 9  },
      { title: 'Electronic Items',                             startIndex: 137, itemCount: 10 },
      { title: 'Furniture and Fittings',                       startIndex: 147, itemCount: 10 },
      { title: 'Vehicles',                                     startIndex: 157, itemCount: 10 },
      { title: 'Live stock',                                   startIndex: 167, itemCount: 9  },
      { title: 'Other Assets (Including Amortisable Assets)',  startIndex: 176, itemCount: 10 },
      { title: 'Other Assets (Nil Depreciation)',              startIndex: 186, itemCount: 10 }
    ]
  },
  {
    key: 'prepared_by',
    title: 'Prepared By',
    icon: UsersIcon,
    fields: [
      { id: 'bank_name',   label: 'Bank Name / Department Name', type: 'text', required: true, note: 'Enter bank or department name' },
      { id: 'branch_name', label: 'Branch Name',                 type: 'text', required: true, note: 'Enter branch name' },
      { id: 'j94', label: 'Name 1',    type: 'text', required: true, note: 'Enter name 1' },
      { id: 'j95', label: 'Name 2',    type: 'text', required: true, note: 'Enter name 2' },
      { id: 'j96', label: 'Address',   type: 'text', required: true, note: 'Enter address' },
      { id: 'j97', label: 'Contact',   type: 'text', required: true, note: 'Enter contact number' }
    ]
  }
];

// Fixed Assets mapping configuration
const fixedAssetsMapping = {
  "Plant and Machinery":                         { dataStartRow: 95,  maxItems: 10 },
  "Service Equipment":                           { dataStartRow: 105, maxItems: 10 },
  "Shed, Construction and Civil works":          { dataStartRow: 115, maxItems: 10 },
  "Land":                                        { dataStartRow: 125, maxItems: 3  },
  "Electrical and Plumbing Items":               { dataStartRow: 128, maxItems: 9  },
  "Electronic Items":                            { dataStartRow: 137, maxItems: 10 },
  "Furniture and Fittings":                      { dataStartRow: 147, maxItems: 10 },
  "Vehicles":                                    { dataStartRow: 157, maxItems: 10 },
  "Live stock":                                  { dataStartRow: 167, maxItems: 9  },
  "Other Assets (Including Amortisable Assets)": { dataStartRow: 176, maxItems: 10 },
  "Other Assets (Nil Depreciation)":             { dataStartRow: 186, maxItems: 10 }
};

const FRCC1Form = ({
  onSubmit,
  templateId = 'frcc1-financial-form',
  initialData = null,
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData || {
    "General Information": {
      "i4": "", "i5": "", "i6": "", "i7": "", "i8": "", "i9": "", "i10": ""
    },
    "Means of Finance": {
      "i12": "", "i13": "", "h14": "", "h15": "", "h16": ""
    },
    "Financial Years": {
      "i18": "", "i19": "", "i20": "", "i21": "", "i22": ""
    },
    "Indirect Expenses": {
      "i24": "", "H25": "", "i26": "", "h27": "", "h28": "", "i29": "", "i30": ""
    },
    "Fixed Assets Schedule": {
      "Plant and Machinery":                         { items: [], total: 0 },
      "Service Equipment":                           { items: [], total: 0 },
      "Shed, Construction and Civil works":          { items: [], total: 0 },
      "Land":                                        { items: [], total: 0 },
      "Electrical and Plumbing Items":               { items: [], total: 0 },
      "Electronic Items":                            { items: [], total: 0 },
      "Furniture and Fittings":                      { items: [], total: 0 },
      "Vehicles":                                    { items: [], total: 0 },
      "Live stock":                                  { items: [], total: 0 },
      "Other Assets (Including Amortisable Assets)": { items: [], total: 0 },
      "Other Assets (Nil Depreciation)":             { items: [], total: 0 }
    },
    "Prepared By": {
      "bank_name": "", "branch_name": "",
      "j94": "PARVEZ AND NARAYANA",
      "j95": "Chartered Accountants",
      "j96": "",
      "j97": "9014221011"
    }
  });

  const [finalJson, setFinalJson] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Initialize form with initialData if provided
  useEffect(() => {
    if (initialData && isEditMode) {
      console.log('📝 [FRCC1Form] Loading initial data for edit mode:', initialData);
      setFormData(prev => ({
        "General Information": initialData["General Information"] || {},
        "Means of Finance": initialData["Means of Finance"] || {},
        "Financial Years": initialData["Financial Years"] || {},
        "Indirect Expenses": initialData["Indirect Expenses"] || {
          "i24": "", "H25": "", "i26": "", "h27": "", "h28": "", "i29": "", "i30": ""
        },
        "Fixed Assets Schedule": initialData["Fixed Assets Schedule"] || {
          "Plant and Machinery":                         { items: [], total: 0 },
          "Service Equipment":                           { items: [], total: 0 },
          "Shed, Construction and Civil works":          { items: [], total: 0 },
          "Land":                                        { items: [], total: 0 },
          "Electrical and Plumbing Items":               { items: [], total: 0 },
          "Electronic Items":                            { items: [], total: 0 },
          "Furniture and Fittings":                      { items: [], total: 0 },
          "Vehicles":                                    { items: [], total: 0 },
          "Live stock":                                  { items: [], total: 0 },
          "Other Assets (Including Amortisable Assets)": { items: [], total: 0 },
          "Other Assets (Nil Depreciation)":             { items: [], total: 0 }
        },
        "Prepared By": initialData["Prepared By"] || {},
        ...initialData
      }));
    }
  }, [initialData, isEditMode]);

  // Validate current section
  const validateCurrentSection = useCallback(() => {
    const currentSection = sections[currentStep];

    if (currentSection.key === 'fixed') {
      return true;
    }

    const sectionData = formData[currentSection.title];

    for (const field of currentSection.fields) {
      if (field.required) {
        const value = sectionData[field.id];
        if (value === '' || value === null || value === undefined) {
          return false;
        }
        if (field.type === 'number' && (value === 0 || value === '')) {
          return false;
        }
      }
    }

    return true;
  }, [currentStep, formData]);

  const validateAllSections = useCallback(() => {
    const errors = {};
    sections.forEach(section => {
      if (section.key === 'fixed') return;
      const sectionData = formData[section.title] || {};
      (section.fields || []).forEach(field => {
        if (!field.required) return;
        const value = sectionData[field.id];
        const key = `${section.title}.${field.id}`;
        if (value === '' || value === null || value === undefined) {
          errors[key] = 'This field is required';
          return;
        }
        if (field.id === 'i8' && section.key === 'general') {
          if (!/^\d{10}$/.test(String(value).trim())) {
            errors[key] = 'Enter a valid 10-digit contact number';
          }
          return;
        }
        if (field.id === 'h14') {
          if (Number(value) <= 0) errors[key] = 'Interest rate must be greater than 0';
          return;
        }
        if (field.id === 'h16') {
          if (Number(value) < 15) errors[key] = 'Working capital must be 15% or more of turnover';
          return;
        }
        if (field.id === 'i29' || field.id === 'i30') {
          const months = Number(value);
          if (months < 1 || months > 12) errors[key] = 'Months must be between 1 and 12';
        }
      });
    });
    return errors;
  }, [formData]);

  // Update field value
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

  // Fill test data function
  const fillTestData = useCallback(() => {
    setFormData({
      "General Information": {
        "i4": "MEDICAID LABS LLP",
        "i5": "LLP",
        "i6": "N Apuroop",
        "i7": "Autonagar, Vijayawada, Andhra Pradesh",
        "i8": "9876543210",
        "i9": "Trading sector",
        "i10": "Trading in Pharmaceutical products"
      },
      "Means of Finance": {
        "i12": "No",
        "i13": 10000000,
        "h14": 12,
        "h15": 2,
        "h16": 20
      },
      "Financial Years": {
        "i18": "2025-26",
        "i19": "2026-27",
        "i20": "2027-28",
        "i21": "2028-29",
        "i22": "2029-30"
      },
      "Indirect Expenses": {
        "i24": 10000,
        "H25": 5,
        "i26": 7500,
        "h27": 5,
        "h28": 5,
        "i29": 7,
        "i30": 7
      },
      "Fixed Assets Schedule": {
        "Plant and Machinery": {
          items: [
            { description: "Machinery", amount: 500000 },
            { description: "Drilling Machine", amount: 120000 }
          ],
          total: 620000
        },
        "Service Equipment":                           { items: [], total: 0 },
        "Shed, Construction and Civil works":          { items: [], total: 0 },
        "Land":                                        { items: [], total: 0 },
        "Electrical and Plumbing Items":               { items: [], total: 0 },
        "Electronic Items":                            { items: [], total: 0 },
        "Furniture and Fittings":                      { items: [], total: 0 },
        "Vehicles":                                    { items: [], total: 0 },
        "Live stock":                                  { items: [], total: 0 },
        "Other Assets (Including Amortisable Assets)": { items: [], total: 0 },
        "Other Assets (Nil Depreciation)":             { items: [], total: 0 }
      },
      "Prepared By": {
        "bank_name": "SBI",
        "branch_name": "Main Branch",
        "j94": "PARVEZ AND NARAYANA",
        "j95": "Chartered Accountants",
        "j96": "Hyderabad, Telangana",
        "j97": "9014221011"
      }
    });
  }, []);

  // Update fixed asset item
  const updateFixedAsset = useCallback((categoryTitle, itemIndex, field, value, startIndex) => {
    setFormData(prev => {
      const newData = { ...prev };

      if (!newData["Fixed Assets Schedule"][categoryTitle]) {
        newData["Fixed Assets Schedule"][categoryTitle] = { items: [], total: 0 };
      }

      while (newData["Fixed Assets Schedule"][categoryTitle].items.length <= itemIndex) {
        newData["Fixed Assets Schedule"][categoryTitle].items.push({ description: '', amount: 0 });
      }

      const item = newData["Fixed Assets Schedule"][categoryTitle].items[itemIndex];
      item[field] = value;
      item.descriptionField = `D${startIndex + itemIndex}`;
      item.amountField = `E${startIndex + itemIndex}`;

      newData[`D${startIndex + itemIndex}`] = item.description || '';
      newData[`E${startIndex + itemIndex}`] = item.amount || 0;

      let categoryTotal = 0;
      newData["Fixed Assets Schedule"][categoryTitle].items.forEach(i => {
        categoryTotal += i.amount || 0;
      });
      newData["Fixed Assets Schedule"][categoryTitle].total = categoryTotal;

      return newData;
    });
  }, []);

  // Delete fixed asset item
  const deleteFixedAsset = useCallback((categoryTitle, itemIndex) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (newData["Fixed Assets Schedule"][categoryTitle]?.items) {
        newData["Fixed Assets Schedule"][categoryTitle].items.splice(itemIndex, 1);

        let categoryTotal = 0;
        newData["Fixed Assets Schedule"][categoryTitle].items.forEach(i => {
          categoryTotal += i.amount || 0;
        });
        newData["Fixed Assets Schedule"][categoryTitle].total = categoryTotal;
      }
      return newData;
    });
  }, []);

  // Convert form data to Excel cell format
  const convertToExcelData = useCallback(() => {
    const gi = formData["General Information"];
    const mf = formData["Means of Finance"];
    const fy = formData["Financial Years"];
    const ie = formData["Indirect Expenses"];
    const pb = formData["Prepared By"];

    const excelData = {
      i4:  { label: "Name of Firm",                        value: gi["i4"]  || "" },
      i5:  { label: "Status of Concern",                   value: gi["i5"]  || "" },
      i6:  { label: "Name of Authorised Person",            value: gi["i6"]  || "" },
      i7:  { label: "Firm Address",                         value: gi["i7"]  || "" },
      i8:  { label: "Contact No. of Authorised Person",     value: gi["i8"]  || "" },
      i9:  { label: "Sector",                               value: gi["i9"]  || "" },
      i10: { label: "Nature of Business",                   value: gi["i10"] || "" },

      i12:  { label: "Do you have working capital limit at present?", value: mf["i12"]  || "" },
      i13:  { label: "Working Capital Loan Requirement",              value: mf["i13"]  || 0  },
      h14:  { label: "Working Capital Loan Interest",                 value: mf["h14"]  || 0  },
      h15:  { label: "Processing Fees (Including GST) %",             value: mf["h15"]  || 0  },
      h16: { label: "Working Capital (% of Turnover)",               value: mf["h16"] || 0  },

      i18: { label: "1st Financial Year", value: fy["i18"] || "" },
      i19: { label: "2nd Financial Year", value: fy["i19"] || "" },
      i20: { label: "3rd Financial Year", value: fy["i20"] || "" },
      i21: { label: "4th Financial Year", value: fy["i21"] || "" },
      i22: { label: "5th Financial Year", value: fy["i22"] || "" },

      i24: { label: "Rent / Lease per Month",                           value: ie["i24"] || 0 },
      H25: { label: "Rental Increment (Annual %)",                      value: ie["H25"] || 0 },
      i26: { label: "Power Charges per Month",                          value: ie["i26"] || 0 },
      h27: { label: "Power Charges Increment (Annual %)",               value: ie["h27"] || 0 },
      h28: { label: "Sales Growth (Annual %)",                          value: ie["h28"] || 0 },
      i29: { label: "Months Interest paid in First Financial Year",     value: ie["i29"] || 0 },
      i30: { label: "Months Turnover done in First Financial Year",     value: ie["i30"] || 0 },

      bank_name:   { label: "Bank Name / Department Name", value: pb["bank_name"]   || "" },
      branch_name: { label: "Branch Name",                 value: pb["branch_name"] || "" },
      j94: { label: "Name 1",   value: pb["j94"] || "" },
      j95: { label: "Name 2",   value: pb["j95"] || "" },
      j96: { label: "Address",  value: pb["j96"] || "" },
      j97: { label: "Contact",  value: pb["j97"] || "" }
    };

    Object.keys(fixedAssetsMapping).forEach(categoryTitle => {
      const mapping = fixedAssetsMapping[categoryTitle];
      const categoryData = formData["Fixed Assets Schedule"][categoryTitle];

      if (categoryData?.items) {
        categoryData.items.forEach((item, index) => {
          if (index < mapping.maxItems) {
            const row = mapping.dataStartRow + index;
            excelData[`D${row}`] = { label: `${categoryTitle} - Item ${index + 1} Description`, value: item.description || '' };
            excelData[`E${row}`] = { label: `${categoryTitle} - Item ${index + 1} Amount`,      value: item.amount      || 0 };
          }
        });
      }
    });

    return excelData;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    const errors = validateAllSections();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      const errTitle = firstKey.split('.').slice(0, -1).join('.');
      const idx = sections.findIndex(s => s.title === errTitle);
      if (idx !== -1) setCurrentStep(idx);
      return;
    }
    setFieldErrors({});
    const excelData = convertToExcelData();

    const submissionData = {
      formData: {
        excelData: excelData,
        additionalData: {
          formType: 'FRCC1 Complete Financial Form',
          timestamp: new Date().toISOString(),
          bank_name: formData["Prepared By"]["bank_name"],
          branch_name: formData["Prepared By"]["branch_name"],
          "Fixed Assets Schedule": formData["Fixed Assets Schedule"]
        }
      }
    };

    if (onFormDataChange) {
      console.log('💾 [FRCC1Form] Saving raw formData for future editing:', formData);
      onFormDataChange(formData);
    }

    if (onSubmit) {
      onSubmit(submissionData);
    } else {
      setFinalJson(submissionData);
      setShowResult(true);
    }
  }, [formData, validateAllSections, convertToExcelData, onSubmit, onFormDataChange]);

  // Copy JSON to clipboard
  const copyToClipboard = useCallback(() => {
    if (finalJson) {
      navigator.clipboard.writeText(JSON.stringify(finalJson, null, 2))
        .then(() => alert('JSON copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  }, [finalJson]);

  // Navigation
  const goToStep = (index) => {
    if (index >= 0 && index < sections.length) {
      setCurrentStep(index);
    }
  };

  const goToNextStep = () => {
    const cs = sections[currentStep];
    if (cs.key !== 'fixed') {
      const sectionData = formData[cs.title] || {};
      const sectionErrors = {};
      (cs.fields || []).forEach(field => {
        if (!field.required) return;
        const value = sectionData[field.id];
        const key = `${cs.title}.${field.id}`;
        if (value === '' || value === null || value === undefined) {
          sectionErrors[key] = 'This field is required'; return;
        }
        if (field.id === 'i8') {
          if (!/^\d{10}$/.test(String(value).trim())) sectionErrors[key] = 'Enter a valid 10-digit contact number';
          return;
        }
        if (field.id === 'h14') { if (Number(value) <= 0) sectionErrors[key] = 'Interest rate must be greater than 0'; return; }
        if (field.id === 'h16') { if (Number(value) < 15) sectionErrors[key] = 'Working capital must be 15% or more of turnover'; return; }
        if (field.id === 'i29' || field.id === 'i30') { const m = Number(value); if (m < 1 || m > 12) sectionErrors[key] = 'Months must be between 1 and 12'; }
      });
      if (Object.keys(sectionErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...sectionErrors }));
        return;
      }
    }
    if (currentStep < sections.length - 1) setCurrentStep(currentStep + 1);
  };

  const currentSection = sections[currentStep];
  const progress = ((currentStep + 1) / sections.length) * 100;
  const isLastStep = currentStep === sections.length - 1;
  const canProceed = validateCurrentSection();

  if (showResult) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif' }} className="min-h-screen bg-ghostwhite">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
          .bg-ghostwhite { background-color: #F8F8FF; }
        `}</style>
        <div className="bg-white rounded-xl shadow-soft p-6 ">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
            <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900">
              Form Submitted Successfully
            </h1>
          </div>
          <p className="text-gray-600  text-sm">Your data has been collected in JSON format below:</p>
          <div className="bg-gray-900 rounded-lg  overflow-auto max-h-80 text-xs font-mono">
            <pre className="text-green-400">{JSON.stringify(finalJson, null, 2)}</pre>
          </div>
          <div className="flex justify-between mt-6 gap-3">
            <button
              className="px-5 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 font-medium text-sm"
              onClick={() => setShowResult(false)}
            >
              <ChevronLeftIcon className="w-4 h-4 inline mr-1" />
              Back to Form
            </button>
            <button
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm"
              onClick={copyToClipboard}
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4 inline mr-1" />
              Copy JSON
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="min-h-screen bg-ghostwhite">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .bg-ghostwhite { background-color: #F8F8FF; }
        
        .shadow-soft {
          box-shadow: 0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04);
        }
        
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        input, select, textarea {
          font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Manrope', sans-serif;
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
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900 mb-1">
            Financial Data Collection
          </h1>
          <p className="text-gray-600 text-sm">Complete each section to generate your financial report</p>
        </div>

        {/* Test Data Button */}
        <div className="mb-4 flex justify-center">
          <button
            className="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 text-xs font-medium"
            onClick={fillTestData}
          >
            Fill Test Data
          </button>
        </div>

        {/* Progress Bar */}
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

        {/* Section Navigation Tabs */}
        <div className="mb-6 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex gap-2 min-w-max">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.key}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${index === currentStep
                    ? ' text-black border border-gray-600'
                    : index < currentStep
                      ? 'bg-gray-100 text-gray-700 border border-gray-300'
                      : 'bg-white text-gray-500 border border-gray-200 cursor-not-allowed'
                    }`}
                  onClick={() => index <= currentStep && goToStep(index)}
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

        {/* Current Section Content */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            {React.createElement(currentSection.icon, { className: "w-6 h-6 text-gray-900" })}
            <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xl font-bold text-gray-900">
              {currentSection.title}
            </h2>
          </div>

          <div className="bg-ghostwhite rounded-lg p-4">
            {currentSection.key === 'fixed' ? (
              <FixedAssetsSection
                categories={currentSection.categories}
                data={formData["Fixed Assets Schedule"]}
                onUpdate={updateFixedAsset}
                onDelete={deleteFixedAsset}
              />
            ) : (
              <RegularFieldsSection
                section={currentSection}
                data={formData[currentSection.title]}
                onUpdate={updateField}
                fieldErrors={fieldErrors}
              />
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200">
          <button
            className="px-5 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent font-medium text-sm flex items-center gap-1"
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>

          {isLastStep ? (
            <button
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
              className="px-5 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm flex items-center gap-1"
              onClick={goToNextStep}
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

// Regular fields section component
const RegularFieldsSection = ({ section, data = {}, onUpdate, fieldErrors = {} }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {section.fields.map(field => {
        const err = fieldErrors[`${section.title}.${field.id}`];
        return (
          <div key={field.id} className="space-y-1.5">
            <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={data[field.id] || ''}
                onChange={(e) => onUpdate(section.title, field.id, e.target.value)}
                className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white`}
              >
                <option value="">Select...</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={data[field.id] || ''}
                onChange={(e) => onUpdate(section.title, field.id, e.target.value)}
                placeholder={field.label}
                rows={2}
                className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white resize-none`}
              />
            ) : field.type === 'computed' ? (
              <div className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-300 text-gray-800 font-semibold text-sm">
                ₹{data[field.id]?.toLocaleString('en-IN') || 0}
              </div>
            ) : (
              <input
                type={field.type}
                value={data[field.id] || ''}
                onChange={(e) => onUpdate(section.title, field.id, field.type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
                placeholder={field.label}
                min={field.min}
                max={field.max}
                step={field.step}
                className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white`}
              />
            )}
            {err ? (
              <p className="text-xs text-red-500 mt-1">{err}</p>
            ) : field.note && (
              <p className="text-xs text-gray-500 mt-1">
                {field.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Fixed assets section component
const FixedAssetsSection = ({ categories, data = {}, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState(0);

  const currentCategory = categories[activeTab];
  const categoryData = data[currentCategory.title] || { items: [], total: 0 };
  const maxAllowed = currentCategory.itemCount;

  const addItem = () => {
    const currentItems = categoryData.items?.length || 0;
    if (currentItems >= maxAllowed) {
      alert(`Maximum ${maxAllowed} items allowed for ${currentCategory.title}`);
      return;
    }
    onUpdate(currentCategory.title, currentItems, 'description', '', currentCategory.startIndex);
    onUpdate(currentCategory.title, currentItems, 'amount', 0, currentCategory.startIndex);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
        {categories.map((cat, index) => (
          <button
            key={cat.title}
            className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${index === activeTab
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab(index)}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Category Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center  mb-4 pb-3 border-b border-gray-200">
          <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-bold text-gray-800">
            {currentCategory.title}
          </h3>
          <div className="px-4 py-1.5 bg-white-900 text-black rounded-lg border border-gray-300">
            <span style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-bold">
              Total: ₹{categoryData.total?.toLocaleString('en-IN') || 0}
            </span>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 mb-3">
          <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-6 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
            Item Description
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-5 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
            Amount (₹)
          </div>
          <div className="col-span-1"></div>
        </div>

        {/* Table Rows */}
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {categoryData.items && categoryData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3">
              <input
                type="text"
                placeholder={`Item ${index + 1} description`}
                value={item.description || ''}
                onChange={(e) => onUpdate(currentCategory.title, index, 'description', e.target.value, currentCategory.startIndex)}
                className="col-span-6 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
              />
              <input
                type="number" onWheel={(e) => e.target.blur()}
                placeholder="Amount"
                min="0"
                step="0.01"
                value={item.amount || ''}
                onChange={(e) => onUpdate(currentCategory.title, index, 'amount', Number(e.target.value) || 0, currentCategory.startIndex)}
                className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
              />
              <button
                type="button"
                onClick={() => onDelete(currentCategory.title, index)}
                className="col-span-1 px-2 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <button
          type="button"
          onClick={addItem}
          className={`mt-3 px-4 py-2 text-xs rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 ${(categoryData.items?.length || 0) >= maxAllowed
            ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
            : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
            }`}
          disabled={(categoryData.items?.length || 0) >= maxAllowed}
        >
          <PlusIcon className="w-4 h-4" />
          Add Item ({categoryData.items?.length || 0}/{maxAllowed})
        </button>
      </div>
    </div>
  );
};

export default FRCC1Form;



