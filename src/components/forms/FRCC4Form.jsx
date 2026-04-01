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
  TrashIcon
} from '@heroicons/react/24/outline';

const generateFinancialYearOptions = () => {
  const options = [];
  const currentYear = new Date().getFullYear();
  for (let start = currentYear; start <= currentYear + 20; start++) {
    options.push(`${start}-${String(start + 1).slice(-2)}`);
  }
  return options;
};

const fixedAssetsMapping = {
  "Plant and Machinery":                         { dataStartRow: 101, maxItems: 10 }, // D101-D110
  "Service Equipment":                           { dataStartRow: 111, maxItems: 10 }, // D111-D120
  "Shed, Construction and Civil works":          { dataStartRow: 121, maxItems: 10 }, // D121-D130
  "Land":                                        { dataStartRow: 131, maxItems: 3  }, // D131-D133
  "Electrical and Plumbing Items":               { dataStartRow: 134, maxItems: 9  }, // D134-D142
  "Electronic Items":                            { dataStartRow: 143, maxItems: 10 }, // D143-D152
  "Furniture and Fittings":                      { dataStartRow: 153, maxItems: 10 }, // D153-D162
  "Vehicles":                                    { dataStartRow: 163, maxItems: 10 }, // D163-D172
  "Live stock":                                  { dataStartRow: 173, maxItems: 9  }, // D173-D181
  "Other Assets (Including Amortisable Assets)": { dataStartRow: 182, maxItems: 10 }, // D182-D191
  "Other Assets (Nil Depreciation)":             { dataStartRow: 192, maxItems: 10 }  // D192-D201
};


const FRCC4Form = ({
  onSubmit,
  initialData: initialDataProp = null,
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null
}) => {
  const initialData = initialDataProp || {};

  const [formData, setFormData] = useState({
    'General Information': initialData['General Information'] || {
      i3: '', i4: '', i5: '', i6: '', i7: '', i8: '', i9: ''
    },
    'Means of Finance': initialData['Means of Finance'] || {
      i11: 'Yes', i12: 'No', i13: 0, h14: 0, h15: 0, h16: 0
    },
    'Financial Years': initialData['Financial Years'] || {
      i18: '', i19: '', i20: '', i21: ''
    },
    'Financial Statements': initialData['Financial Statements'] || {
      i23: 0, i24: 0, i25: 0, i26: 0, i27: 0, i28: 0, i29: 0, i30: 0,
      i31: 0, i32: 0, i33: 0, i34: 0, i35: 0, i37: 0, i38: 0, i39: 0,
      i40: 0, i41: 0, i44: 0, i45: 0, i46: 0, i47: 0
    },
    'Fixed Assets Schedule': initialData['Fixed Assets Schedule'] || {
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
      'Other Assets (Nil Depreciation)':             { items: [], total: 0 }
    },
    'Prepared By': {
      bank_name: '', branch_name: '',
      j100: '', j101: '', j102: '', j103: '',
      ...(initialData['Prepared By'] || {})
    }
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [activeAssetTab, setActiveAssetTab] = useState(0);

  const sections = [
    {
      key: 'general',
      title: 'General Information',
      icon: DocumentTextIcon,
      fields: [
        { id: 'i3',          label: 'Name of Firm',                       type: 'text',     required: true,  note: 'Enter your company/firm name' },
        { id: 'i4',          label: 'Status of Concern',                  type: 'select',   required: true,  options: ['Sole Proprietorship', 'Partnership Firm', 'Private Limited Company', 'LLP', 'Society', 'Trust'], note: 'Select business structure' },
        { id: 'i5',          label: 'Name of Authorised Person',          type: 'text',     required: true,  note: 'Enter authorised person name' },
        { id: 'i6',          label: 'Firm Address',                        type: 'textarea', required: true,  note: 'Enter complete business address' },
        { id: 'i7',          label: 'Contact No. of Authorised Person',   type: 'text',     required: true,  note: 'Enter 10-digit contact number' },
        { id: 'i8',          label: 'Sector',                             type: 'select',   required: true,  options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], note: 'Select primary business sector' },
        { id: 'i9',          label: 'Nature of Business',                 type: 'text',     required: true,  note: 'Describe business activity' }
      ]
    },
    {
      key: 'finance',
      title: 'Means of Finance',
      icon: CurrencyDollarIcon,
      fields: [
        { id: 'i11', label: 'Do you have working capital limit at present?',              type: 'select', required: true,  options: ['Yes', 'No'],  note: 'Select if you have existing limit', disabled: true },
        { id: 'i12', label: 'Are you going for Working capital limit Topup from present limit?', type: 'select', required: true, options: ['Yes', 'No'], note: 'Select if you need top-up', disabled: true },
        { id: 'i13', label: 'Working Capital Limit (₹)',                                  type: 'number', required: true,  min: 0,                  note: 'Enter working capital limit in rupees' },
        { id: 'h14', label: 'Working Capital Loan Interest (%)',                          type: 'number', required: true,  min: 0, max: 100, step: 0.01, note: 'Annual interest rate' },
        { id: 'h15', label: 'Processing Fees (Including GST) (%)',                        type: 'number', required: true,  min: 0,                  note: 'Processing fee percentage' },
        { id: 'h16', label: 'Working Capital (% on Turnover)',                           type: 'number', required: true,  min: 0, max: 100, step: 0.01, note: 'Working capital as % of turnover' }
      ]
    },
    {
      key: 'years',
      title: 'Financial Years',
      icon: CalendarIcon,
      fields: [
        { id: 'i18', label: '1st Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Format: yyyy-yy (e.g. 2025-26)' },
        { id: 'i19', label: '2nd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Format: yyyy-yy' },
        { id: 'i20', label: '3rd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Format: yyyy-yy' },
        { id: 'i21', label: '4th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Format: yyyy-yy' }
      ]
    },
    {
      key: 'statements',
      title: 'Financial Statements',
      icon: ChartBarIcon,
      fields: [
        { id: 'i23', label: 'Turnover (₹)',                                                          type: 'number', min: 0,  required: true,  note: 'Annual turnover' },
        { id: 'i24', label: 'Opening Stock (₹)',                                                     type: 'number', min: 0,  required: true,  note: 'Stock at beginning of year' },
        { id: 'i25', label: 'Direct Material & Expenses (₹)',                                       type: 'number', min: 0,  required: true,  note: 'Cost of direct materials' },
        { id: 'i26', label: 'Closing Stock (₹)',                                                     type: 'number', min: 0,  required: true,  note: 'Stock at end of year' },
        { id: 'i27', label: 'Non Operating Income (₹)',                                             type: 'number', min: 0,  required: false, note: 'Other income (if any)' },
        { id: 'i28', label: 'Electricity (If not included in Direct Expenses) (₹)',                type: 'number', min: 0,  required: false, note: 'Power charges if separate' },
        { id: 'i29', label: 'Depreciation (₹)',                                                     type: 'number', min: 0,  required: true,  note: 'Depreciation expense' },
        { id: 'i30', label: 'Rent (₹)',                                                             type: 'number', min: 0,  required: true,  note: 'Annual rent paid' },
        { id: 'i31', label: 'Salaries & Wages (₹)',                                                 type: 'number', min: 0,  required: true,  note: 'Total salaries and wages' },
        { id: 'i32', label: 'Processing Fees (Including GST) (%)',                                  type: 'number', min: 0,  required: true,  note: 'Processing fees paid' },
        { id: 'i33', label: 'Interest on CC / OD Loan (₹)',                                        type: 'number', min: 0,  required: true,  note: 'Interest on cash credit / overdraft' },
        { id: 'i34', label: 'Interest on Other Loans (₹)',                                         type: 'number', min: 0,  required: true,  note: 'Interest on term / other loans' },
        { id: 'i35', label: 'Net Profit Before Tax (₹)',                                            type: 'number',          required: true,  note: 'Net profit before tax (can be negative)' },
        { id: 'i37', label: 'Net Capital (Opening Capital + Net Profit - Drawings/Remuneration) (₹)', type: 'number', min: 0, required: true, note: 'Net capital at year end' },
        { id: 'i38', label: 'Term Loans (Secured and Unsecured Loans Total) (₹)',                   type: 'number', min: 0,  required: true,  note: 'Outstanding term loans total' },
        { id: 'i39', label: 'CC Loan Outstanding (₹)',                                              type: 'number', min: 0,  required: true,  note: 'Cash credit outstanding' },
        { id: 'i40', label: 'Other Current Liabilities (₹)',                                        type: 'number', min: 0,  required: true,  note: 'Other current liabilities' },
        { id: 'i41', label: 'Net Total Fixed Assets (₹)',                                           type: 'number', min: 0,  required: true,  note: 'Net fixed assets value' },
        { id: 'i44', label: 'Investments (₹)',                                                      type: 'number', min: 0,  required: false, note: 'Investments held' },
        { id: 'i45', label: 'Debtors (₹)',                                                          type: 'number', min: 0,  required: true,  note: 'Accounts receivable' },
        { id: 'i46', label: 'Cash and Cash Equivalents (₹)',                                        type: 'number', min: 0,  required: true,  note: 'Cash and bank balances' },
        { id: 'i47', label: 'Other Current Assets if any (₹)',                                     type: 'number', min: 0,  required: false, note: 'Other current assets' }
      ]
    },
    {
      key: 'fixed',
      title: 'Fixed Assets Schedule',
      icon: BuildingOfficeIcon,
      categories: Object.keys(fixedAssetsMapping).map(title => ({
        title,
        ...fixedAssetsMapping[title]
      }))
    },
    {
      key: 'prepared_by',
      title: 'Prepared By',
      icon: BuildingOfficeIcon,
      fields: [
        { id: 'bank_name',   label: 'Bank Name / Department Name', type: 'text',     required: true,  note: 'Enter bank or department name' },
        { id: 'branch_name', label: 'Branch Name',                 type: 'text',     required: true,  note: 'Enter branch name' },
        { id: 'j100', label: 'Name 1',    type: 'text',     required: true,  note: 'Prepared by — Name 1' },
        { id: 'j101', label: 'Name 2',    type: 'text',     required: false, note: 'Prepared by — Name 2 (optional)' },
        { id: 'j102', label: 'Address',   type: 'textarea', required: false, note: 'Prepared by — Address' },
        { id: 'j103', label: 'Contact',   type: 'text',     required: false, note: 'Prepared by — Contact number' }
      ]
    }
  ];

  useEffect(() => {
    if (initialData && isEditMode) {
      console.log('📝 [FRCC4Form] Loading initial data for edit mode:', initialData);
      setFormData(prev => ({
        ...prev,
        ...initialData,
        'Financial Statements': initialData['Financial Statements'] || initialData['Audited Statements'] || prev['Financial Statements']
      }));
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

  const updateFixedAssetItem = useCallback((categoryName, index, field, value) => {
    setFormData(prev => {
      const currentItems = [...(prev['Fixed Assets Schedule'][categoryName]?.items || [])];
      currentItems[index] = { ...currentItems[index], [field]: value };
      const total = currentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        'Fixed Assets Schedule': {
          ...prev['Fixed Assets Schedule'],
          [categoryName]: { items: currentItems, total }
        }
      };
    });
  }, []);

  const addFixedAssetItem = useCallback((categoryName) => {
    setFormData(prev => {
      const currentItems = prev['Fixed Assets Schedule'][categoryName]?.items || [];
      const newItems = [...currentItems, { description: '', amount: 0 }];
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        'Fixed Assets Schedule': {
          ...prev['Fixed Assets Schedule'],
          [categoryName]: { items: newItems, total }
        }
      };
    });
  }, []);

  const removeFixedAssetItem = useCallback((categoryName, index) => {
    setFormData(prev => {
      const currentItems = prev['Fixed Assets Schedule'][categoryName]?.items || [];
      const newItems = currentItems.filter((_, i) => i !== index);
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        'Fixed Assets Schedule': {
          ...prev['Fixed Assets Schedule'],
          [categoryName]: { items: newItems, total }
        }
      };
    });
  }, []);

  const fillTestData = useCallback(() => {
    setFormData({
      'General Information': {
        i3: 'ACME Industries LLP',
        i4: 'LLP',
        i5: 'John Doe',
        i6: 'Industrial Area, City - 500001',
        i7: '9876543210',
        i8: 'Manufacturing sector',
        i9: 'Manufacturing of Industrial Equipment'
      },
      'Means of Finance': {
        i11: 'No', i12: 'No', i13: 15000000, h14: 11, h15: 1.0, h16: 18
      },
      'Financial Years': {
        i18: '2024-25', i19: '2025-26', i20: '2026-27', i21: '2027-28'
      },
      'Financial Statements': {
        i23: 15000000, i24: 500000, i25: 8000000, i26: 750000,
        i27: 200000,  i28: 350000, i29: 350000,  i30: 900000,
        i31: 650000,  i32: 1.0,    i33: 250000,  i34: 120000,
        i35: 600000,  i37: 220000, i38: 500000,  i39: 4000000,
        i40: 1800000, i41: 2800000, i44: 80000,  i45: 175000,
        i46: 900000,  i47: 120000
      },
      'Fixed Assets Schedule': {
        'Plant and Machinery':                         { items: [{ description: 'CNC Machine', amount: 2000000 }], total: 2000000 },
        'Service Equipment':                           { items: [], total: 0 },
        'Shed, Construction and Civil works':          { items: [{ description: 'Factory Building', amount: 5000000 }], total: 5000000 },
        'Land':                                        { items: [], total: 0 },
        'Electrical and Plumbing Items':               { items: [], total: 0 },
        'Electronic Items':                            { items: [], total: 0 },
        'Furniture and Fittings':                      { items: [{ description: 'Office Furniture', amount: 150000 }], total: 150000 },
        'Vehicles':                                    { items: [], total: 0 },
        'Live stock':                                  { items: [], total: 0 },
        'Other Assets (Including Amortisable Assets)': { items: [], total: 0 },
        'Other Assets (Nil Depreciation)':             { items: [], total: 0 }
      },
      'Prepared By': {
        bank_name: 'SBI', branch_name: 'Main Branch',
        j100: 'PARVEZ AND NARAYANA', j101: 'Chartered Accountants',
        j102: 'Hyderabad, Telangana', j103: '9014221011'
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    const gi = data['General Information'] || {};
    const mf = data['Means of Finance'] || {};
    const fy = data['Financial Years'] || {};
    const fs = data['Financial Statements'] || {};
    const pb = data['Prepared By'] || {};

    const excelData = {
      // General Information
      i3: gi['i3'] || '',
      i4: gi['i4'] || '',
      i5: gi['i5'] || '',
      i6: gi['i6'] || '',
      i7: gi['i7'] || '',
      i8: gi['i8'] || '',
      i9: gi['i9'] || '',
      bank_name:   pb['bank_name']   || '',
      branch_name: pb['branch_name'] || '',

      // Means of Finance
      i11: mf['i11'] || '',
      i12: mf['i12'] || '',
      i13: mf['i13'] || 0,
      h14: mf['h14'] || 0,
      h15: mf['h15'] || 0,
      h16: mf['h16'] || 0,

      // Financial Years
      i18: fy['i18'] || '',
      i19: fy['i19'] || '',
      i20: fy['i20'] || '',
      i21: fy['i21'] || '',

      // Financial Statements
      i23: fs['i23'] || 0,
      i24: fs['i24'] || 0,
      i25: fs['i25'] || 0,
      i26: fs['i26'] || 0,
      i27: fs['i27'] || 0,
      i28: fs['i28'] || 0,
      i29: fs['i29'] || 0,
      i30: fs['i30'] || 0,
      i31: fs['i31'] || 0,
      i32: fs['i32'] || 0,
      i33: fs['i33'] || 0,
      i34: fs['i34'] || 0,
      i35: fs['i35'] || 0,
      i37: fs['i37'] || 0,
      i38: fs['i38'] || 0,
      i39: fs['i39'] || 0,
      i40: fs['i40'] || 0,
      i41: fs['i41'] || 0,
      i44: fs['i44'] || 0,
      i45: fs['i45'] || 0,
      i46: fs['i46'] || 0,
      i47: fs['i47'] || 0,

      // Prepared By
      j100: pb['j100'] || '',
      j101: pb['j101'] || '',
      j102: pb['j102'] || '',
      j103: pb['j103'] || ''
    };

    // Fixed Assets Schedule — D{row} = description, E{row} = amount (lacs)
    const fixedAssetsData = data['Fixed Assets Schedule'];
    if (fixedAssetsData) {
      Object.keys(fixedAssetsMapping).forEach(categoryTitle => {
        const mapping = fixedAssetsMapping[categoryTitle];
        const categoryData = fixedAssetsData[categoryTitle];
        if (categoryData && categoryData.items) {
          categoryData.items.forEach((item, index) => {
            if (index < mapping.maxItems) {
              const row = mapping.dataStartRow + index;
              excelData[`d${row}`] = item.description || '';
              excelData[`e${row}`] = item.amount || 0;
            }
          });
        }
      });
    }

    return excelData;
  };

  const handleSubmit = useCallback(async () => {
    try {
      const excelData = convertToExcelData(formData);

      const payload = {
        formData: {
          excelData,
          formData,
          bank_name:   formData['Prepared By']['bank_name'],
          branch_name: formData['Prepared By']['branch_name'],
          additionalData: {
            'Fixed Assets Schedule': formData['Fixed Assets Schedule']
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
    const value = formData[sectionTitle]?.[field.id] || '';

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
      return (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
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
          {field.note && (
            <p className="text-xs text-gray-500 mt-1">{field.note}</p>
          )}
        </div>
      );
    }

    if (field.type === 'textarea') {
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white resize-none"
          />
          {field.note && (
            <p className="text-xs text-gray-500 mt-1">{field.note}</p>
          )}
        </div>
      );
    }

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
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
        />
        {field.note && (
          <p className="text-xs text-gray-500 mt-1">{field.note}</p>
        )}
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
            disabled={categoryData.items?.length >= currentCategory.maxItems}
            className={`mt-3 px-4 py-2 text-xs rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 ${categoryData.items?.length >= currentCategory.maxItems
              ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
              : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <PlusIcon className="w-4 h-4" />
            Add Item ({categoryData.items?.length || 0}/{currentCategory.maxItems})
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
            Format CC4 - Credit Assessment Report
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

export default FRCC4Form;

