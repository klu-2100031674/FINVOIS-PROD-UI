import React, { useState, useCallback, useEffect } from 'react';
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

const generateFinancialYearOptions = () => {
  const options = [];
  const currentYear = new Date().getFullYear();
  for (let start = currentYear; start <= currentYear + 20; start++) {
    options.push(`${start}-${String(start + 1).slice(-2)}`);
  }
  return options;
};

const sections = [
  {
    key: 'general',
    title: 'General Information',
    icon: DocumentTextIcon,
    fields: [
      { id: 'i4',  label: 'Name of Firm',                     type: 'text',     required: true },
      { id: 'i5',  label: 'Status of Concern',                type: 'select',   options: ['Sole Proprietorship', 'Partnership Firm', 'Private limited Company', 'LLP', 'Society', 'Trust', 'Federation', 'SHG'], required: true },
      { id: 'i6',  label: 'Name of Authorised Person',        type: 'text',     required: true },
      { id: 'i7',  label: 'Firm Address',                     type: 'textarea', required: true },
      { id: 'i8',  label: 'Contact No. of Authorised Person', type: 'text',     required: true },
      { id: 'i9',  label: 'Sector',                           type: 'select',   options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true },
      { id: 'i10', label: 'Nature of Business',               type: 'text',     required: true },
    ]
  },
  {
    key: 'finance',
    title: 'Means of Finance',
    icon: CurrencyDollarIcon,
    fields: [
      { id: 'i12', label: 'Do you have working capital limit at present?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'i13', label: 'Working Capital Loan Requirement (₹)',          type: 'number', min: 0, required: true },
      { id: 'h14', label: 'Working Capital Loan Interest (Annual %)',      type: 'number', min: 0, max: 100, step: 0.01, required: true },
      { id: 'h15', label: 'Processing Fees (Including GST) %',             type: 'number', min: 0, required: true },
      { id: 'h16', label: 'Working Capital (% of Turnover)',               type: 'number', min: 0, step: 0.01, required: true, note: '15% or more' },
    ]
  },
  {
    key: 'years',
    title: 'Financial Years',
    icon: CalendarIcon,
    fields: [
      { id: 'i18', label: '1st Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i19', label: '2nd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i20', label: '3rd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i21', label: '4th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true },
    ]
  },
  {
    key: 'statements',
    title: 'Financial Statements',
    icon: ChartBarIcon,
    fields: [
      { id: 'i23', label: 'Turnover (₹)',                                    type: 'number', min: 0, required: true },
      { id: 'i24', label: 'Opening Stock (₹)',                               type: 'number', min: 0, required: true },
      { id: 'i25', label: 'Direct Material & Expenses (₹)',                  type: 'number', min: 0, required: true },
      { id: 'i26', label: 'Closing Stock (₹)',                               type: 'number', min: 0, required: true },
      { id: 'i27', label: 'Non Operating Income (₹)',                        type: 'number', min: 0, required: true },
      { id: 'i28', label: 'Electricity (₹)',                                 type: 'number', min: 0, required: true },
      { id: 'i29', label: 'Depreciation (₹)',                                type: 'number', min: 0, required: true },
      { id: 'i30', label: 'Rent (₹)',                                        type: 'number', min: 0, required: true },
      { id: 'i31', label: 'Salaries & Wages (₹)',                            type: 'number', min: 0, required: true },
      { id: 'i32', label: 'Interest on Other Loans (₹)',                     type: 'number', min: 0, required: true },
      { id: 'i33', label: 'Net Profit Before Tax (₹)',                       type: 'number',         required: true },
      { id: 'i35', label: 'Net Capital (Opening + Profit - Drawings) (₹)',   type: 'number', min: 0, required: true },
      { id: 'i36', label: 'Term Loans (Secured + Unsecured Total) (₹)',      type: 'number', min: 0, required: true },
      { id: 'i37', label: 'Current Liabilities (₹)',                         type: 'number', min: 0, required: true },
      { id: 'i38', label: 'Net Total Fixed Assets (₹)',                      type: 'number', min: 0, required: true },
      { id: 'i41', label: 'Investments (₹)',                                 type: 'number', min: 0, required: true },
      { id: 'i42', label: 'Debtors (₹)',                                     type: 'number', min: 0, required: true },
      { id: 'i43', label: 'Cash and Cash Equivalents (₹)',                   type: 'number', min: 0, required: true },
      { id: 'i44', label: 'Other Current Assets (₹)',                        type: 'number', min: 0, required: true },
    ]
  },
  {
    key: 'fixed',
    title: 'Fixed Assets Schedule',
    icon: BuildingOfficeIcon,
    categories: [
      { title: 'Plant and Machinery',                         startIndex: 97,  itemCount: 10 },
      { title: 'Service Equipment',                           startIndex: 107, itemCount: 10 },
      { title: 'Shed, Construction and Civil works',          startIndex: 117, itemCount: 10 },
      { title: 'Land',                                        startIndex: 127, itemCount: 3  },
      { title: 'Electrical and Plumbing Items',               startIndex: 130, itemCount: 9  },
      { title: 'Electronic Items',                            startIndex: 139, itemCount: 10 },
      { title: 'Furniture and Fittings',                      startIndex: 149, itemCount: 10 },
      { title: 'Vehicles',                                    startIndex: 159, itemCount: 10 },
      { title: 'Live stock',                                  startIndex: 169, itemCount: 9  },
      { title: 'Other Assets (Including Amortisable Assets)', startIndex: 178, itemCount: 10 },
      { title: 'Other Assets (Nil Depreciation)',             startIndex: 187, itemCount: 11 },
    ]
  },
  {
    key: 'prepared_by',
    title: 'Prepared By',
    icon: UsersIcon,
    fields: [
      { id: 'j96',        label: 'Name 1',                    type: 'text', required: true },
      { id: 'j97',        label: 'Name 2',                    type: 'text', required: true },
      { id: 'j98',        label: 'Address',                   type: 'text', required: true },
      { id: 'j99',        label: 'Contact',                   type: 'text', required: true },
      { id: 'bank_name',  label: 'Bank Name / Department Name', type: 'text', required: true },
      { id: 'branch_name', label: 'Branch Name',              type: 'text', required: true },
    ]
  }
];

const fixedAssetsMapping = {
  'Plant and Machinery':                         { dataStartRow: 97,  maxItems: 10 },
  'Service Equipment':                           { dataStartRow: 107, maxItems: 10 },
  'Shed, Construction and Civil works':          { dataStartRow: 117, maxItems: 10 },
  'Land':                                        { dataStartRow: 127, maxItems: 3  },
  'Electrical and Plumbing Items':               { dataStartRow: 130, maxItems: 9  },
  'Electronic Items':                            { dataStartRow: 139, maxItems: 10 },
  'Furniture and Fittings':                      { dataStartRow: 149, maxItems: 10 },
  'Vehicles':                                    { dataStartRow: 159, maxItems: 10 },
  'Live stock':                                  { dataStartRow: 169, maxItems: 9  },
  'Other Assets (Including Amortisable Assets)': { dataStartRow: 178, maxItems: 10 },
  'Other Assets (Nil Depreciation)':             { dataStartRow: 187, maxItems: 11 },
};

const FRCC3Form = ({
  onSubmit,
  templateId = 'frcc3',
  initialData = null,
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData || {
    'General Information': {
      'i4': '', 'i5': '', 'i6': '', 'i7': '', 'i8': '', 'i9': '', 'i10': ''
    },
    'Means of Finance': {
      'i12': '', 'i13': '', 'h14': '', 'h15': '', 'h16': ''
    },
    'Financial Years': {
      'i18': '', 'i19': '', 'i20': '', 'i21': ''
    },
    'Financial Statements': {
      'i23': '', 'i24': '', 'i25': '', 'i26': '', 'i27': '',
      'i28': '', 'i29': '', 'i30': '', 'i31': '', 'i32': '', 'i33': '',
      'i35': '', 'i36': '', 'i37': '', 'i38': '',
      'i41': '', 'i42': '', 'i43': '', 'i44': ''
    },
    'Fixed Assets Schedule': {
      'Plant and Machinery':                         { items: [], total: 0 },
      'Service Equipment':                           { items: [], total: 0 },
      'Shed, Construction and Civil works':          { items: [], total: 0 },
      'Land':                                        { items: [], total: 0 },
      'Electrical and Plumbing Items':               { items: [], total: 0 },
      'Electronic Items':                            { items: [], total: 0 },
      'Furniture and Fittings':                      { items: [], total: 0 },
      'Vehicles':                                    { items: [], total: 0 },
      'Live stock':                                  { items: [], total: 0 },
      'Other Assets (Including Amortisable Assets)': { items: [], total: 0 },
      'Other Assets (Nil Depreciation)':             { items: [], total: 0 },
    },
    'Prepared By': {
      'j96': 'PARVEZ AND NARAYANA',
      'j97': 'Chartered Accountants',
      'j98': '',
      'j99': '9014221011',
      'bank_name': '',
      'branch_name': ''
    }
  });

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

  const handleFieldChange = useCallback((sectionTitle, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionTitle]: { ...prev[sectionTitle], [fieldId]: value }
    }));
    setFieldErrors(prev => {
      const key = `${sectionTitle}.${fieldId}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const addFixedAssetItem = useCallback((categoryName) => {
    setFormData(prev => {
      const currentItems = prev['Fixed Assets Schedule'][categoryName]?.items || [];
      const mapping = fixedAssetsMapping[categoryName];
      if (currentItems.length >= mapping.maxItems) return prev;
      const newItems = [...currentItems, { description: '', amount: 0 }];
      const total = newItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      return { ...prev, 'Fixed Assets Schedule': { ...prev['Fixed Assets Schedule'], [categoryName]: { items: newItems, total } } };
    });
  }, []);

  const removeFixedAssetItem = useCallback((categoryName, index) => {
    setFormData(prev => {
      const newItems = prev['Fixed Assets Schedule'][categoryName].items.filter((_, i) => i !== index);
      const total = newItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      return { ...prev, 'Fixed Assets Schedule': { ...prev['Fixed Assets Schedule'], [categoryName]: { items: newItems, total } } };
    });
  }, []);

  const updateFixedAssetItem = useCallback((categoryName, index, field, value) => {
    setFormData(prev => {
      const items = [...(prev['Fixed Assets Schedule'][categoryName]?.items || [])];
      items[index] = { ...items[index], [field]: value };
      const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      return { ...prev, 'Fixed Assets Schedule': { ...prev['Fixed Assets Schedule'], [categoryName]: { items, total } } };
    });
  }, []);

  const fillTestData = useCallback(() => {
    setFormData({
      'General Information': {
        'i4': 'Tech Solutions Ltd', 'i5': 'LLP', 'i6': 'Sarah Johnson',
        'i7': 'Innovation Hub, Tech City - 560001', 'i8': '9876543210',
        'i9': 'Service sector (with stock)', 'i10': 'IT Services and Consulting'
      },
      'Means of Finance': { 'i12': 'Yes', 'i13': 18000000, 'h14': 10.5, 'h15': 0.5, 'h16': 20 },
      'Financial Years': { 'i18': '2024-25', 'i19': '2025-26', 'i20': '2026-27', 'i21': '2027-28' },
      'Financial Statements': {
        'i23': 18000000, 'i24': 15000000, 'i25': 50000000, 'i26': 18000000,
        'i27': 80000, 'i28': 400000, 'i29': 250000, 'i30': 360000,
        'i31': 4000000, 'i32': 1000000, 'i33': 6500000,
        'i35': 12000000, 'i36': 800000, 'i37': 5000000, 'i38': 25000000,
        'i41': 1500000, 'i42': 2800000, 'i43': 700000, 'i44': 500000
      },
      'Fixed Assets Schedule': {
        'Plant and Machinery':                         { items: [{ description: 'Server Equipment', amount: 8000000 }], total: 8000000 },
        'Service Equipment':                           { items: [], total: 0 },
        'Shed, Construction and Civil works':          { items: [{ description: 'Office Complex', amount: 12000000 }], total: 12000000 },
        'Land':                                        { items: [{ description: 'Commercial Land', amount: 4000000 }], total: 4000000 },
        'Electrical and Plumbing Items':               { items: [], total: 0 },
        'Electronic Items':                            { items: [], total: 0 },
        'Furniture and Fittings':                      { items: [{ description: 'Office Furniture', amount: 250000 }], total: 250000 },
        'Vehicles':                                    { items: [{ description: 'Company Car', amount: 800000 }], total: 800000 },
        'Live stock':                                  { items: [], total: 0 },
        'Other Assets (Including Amortisable Assets)': { items: [], total: 0 },
        'Other Assets (Nil Depreciation)':             { items: [], total: 0 },
      },
      'Prepared By': {
        'j96': 'PARVEZ AND NARAYANA', 'j97': 'Chartered Accountants',
        'j98': 'Hyderabad, Telangana', 'j99': '9014221011',
        'bank_name': 'State Bank of India', 'branch_name': 'Main Branch'
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    const excelData = {};

    // General Information
    ['i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10'].forEach(k => {
      excelData[k] = data['General Information']?.[k] ?? '';
    });

    // Means of Finance
    ['i12', 'i13', 'h14', 'h15', 'h16'].forEach(k => {
      excelData[k] = data['Means of Finance']?.[k] ?? '';
    });

    // Financial Years
    ['i18', 'i19', 'i20', 'i21'].forEach(k => {
      excelData[k] = data['Financial Years']?.[k] ?? '';
    });

    // Financial Statements
    ['i23', 'i24', 'i25', 'i26', 'i27', 'i28', 'i29', 'i30', 'i31', 'i32', 'i33',
     'i35', 'i36', 'i37', 'i38', 'i41', 'i42', 'i43', 'i44'].forEach(k => {
      excelData[k] = data['Financial Statements']?.[k] ?? '';
    });

    // Prepared By
    ['j96', 'j97', 'j98', 'j99'].forEach(k => {
      excelData[k] = data['Prepared By']?.[k] ?? '';
    });

    // Fixed Assets Schedule
    if (data['Fixed Assets Schedule']) {
      Object.entries(data['Fixed Assets Schedule']).forEach(([categoryName, categoryData]) => {
        const mapping = fixedAssetsMapping[categoryName];
        if (mapping && categoryData.items?.length > 0) {
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
        }
      });
    });
    const fy = formData['Financial Years'];
    const fyKeys = ['i18', 'i19', 'i20', 'i21'];
    fyKeys.forEach((id, idx) => {
      if (idx === 0) return;
      const prevVal = fy[fyKeys[idx - 1]];
      const currVal = fy[id];
      if (prevVal && currVal) {
        const prevYear = parseInt(prevVal.split('-')[0], 10);
        const currYear = parseInt(currVal.split('-')[0], 10);
        if (currYear !== prevYear + 1) {
          errors[`Financial Years.${id}`] = 'Must be consecutive with previous year';
        }
      }
    });
    return errors;
  }, [formData]);

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
    if (onSubmit) {
      const excelData = convertToExcelData(formData);
      onSubmit({
        formData: { excelData, formData },
        templateId: templateId || 'frcc3',
        reportId
      });
    }
  }, [formData, validateAllSections, onSubmit, templateId, reportId]);

  const goToNextStep = () => {
    if (!validateCurrentSection()) {
      alert('Please fill all required fields before proceeding to the next step.');
      return;
    }
    if (currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderField = (field, sectionTitle) => {
    const value = formData[sectionTitle]?.[field.id] ?? '';

    if (field.type === 'select') {
      const err = fieldErrors[`${sectionTitle}.${field.id}`];
      return (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => handleFieldChange(sectionTitle, field.id, e.target.value)}
            required={field.required}
            className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white`}
          >
            <option value="">Select...</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {err ? <p className="text-xs text-red-500 mt-1">{err}</p> : field.note && <p className="text-xs text-gray-500 mt-1">{field.note}</p>}
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
            onChange={(e) => handleFieldChange(sectionTitle, field.id, e.target.value)}
            required={field.required}
            rows={2}
            className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white resize-none`}
          />
          {err ? <p className="text-xs text-red-500 mt-1">{err}</p> : field.note && <p className="text-xs text-gray-500 mt-1">{field.note}</p>}
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
          onChange={(e) => handleFieldChange(sectionTitle, field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step}
          onWheel={field.type === 'number' ? (e) => e.target.blur() : undefined}
          className={`w-full px-3 py-2 text-sm border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white`}
        />
        {err ? <p className="text-xs text-red-500 mt-1">{err}</p> : field.note && <p className="text-xs text-gray-500 mt-1">{field.note}</p>}
      </div>
    );
  };

  const renderFixedAssetsSection = (section) => {
    const categories = section.categories || [];
    const currentCategory = categories[activeAssetTab];
    if (!currentCategory) return null;
    const categoryData = formData['Fixed Assets Schedule'][currentCategory.title] || { items: [], total: 0 };

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
            <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-6 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">Item Description</div>
            <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-5 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">Amount (₹)</div>
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
                  type="number"
                  onWheel={(e) => e.target.blur()}
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
            Format CC3 - Credit Assessment Report
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
                    ? 'bg-white-900 text-black border border-gray-900 '
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
            {currentSection.key === 'fixed' ? (
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
            Please fill all required fields to proceed
          </div>
        )}
      </div>
    </div>
  );
};

export default FRCC3Form;
