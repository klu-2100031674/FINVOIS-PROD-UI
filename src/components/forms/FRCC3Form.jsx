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
  for (let start = 2024; start <= 2033; start++) {
    options.push(`${start}-${(start + 1).toString().slice(-2)}`);
  }

  return options;
};

const FRCC3Form = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null
}) => {
  const [formData, setFormData] = useState({
    'General Information': initialData['General Information'] || {},
    'Means of Finance': initialData['Means of Finance'] || {},
    'Financial Years': initialData['Financial Years'] || {},
    'Audited Statements': initialData['Audited Statements'] || {},
    'Fixed Assets Schedule': initialData['Fixed Assets Schedule'] || {
      'Plant and Machinery': { items: [], total: 0 },
      'Service Equipment': { items: [], total: 0 },
      'Shed and Civil Works': { items: [], total: 0 },
      'Land': { items: [], total: 0 },
      'Electrical Items': { items: [], total: 0 },
      'Electronic Items': { items: [], total: 0 },
      'Furniture and Fittings': { items: [], total: 0 },
      'Vehicles': { items: [], total: 0 },
      'Live Stock': { items: [], total: 0 },
      'Other Assets': { items: [], total: 0 },
      'Other Assets (Including Amortisable Assets)': { items: [], total: 0 }
    },
    'Prepared By': initialData['Prepared By'] || {}
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [activeAssetTab, setActiveAssetTab] = useState(0);

  const fixedAssetsMapping = {
    "Plant and Machinery": { headerRow: 96, dataStartRow: 96, maxItems: 10 },
    "Service Equipment": { headerRow: 106, dataStartRow: 106, maxItems: 10 },
    "Shed and Civil Works": { headerRow: 116, dataStartRow: 116, maxItems: 10 },
    "Land": { headerRow: 126, dataStartRow: 126, maxItems: 3 },
    "Electrical Items": { headerRow: 129, dataStartRow: 129, maxItems: 9 },
    "Electronic Items": { headerRow: 138, dataStartRow: 138, maxItems: 9 },
    "Furniture and Fittings": { headerRow: 148, dataStartRow: 148, maxItems: 10 },
    "Vehicles": { headerRow: 158, dataStartRow: 158, maxItems: 10 },
    "Live Stock": { headerRow: 168, dataStartRow: 168, maxItems: 9 },
    "Other Assets": { headerRow: 177, dataStartRow: 177, maxItems: 10 },
    "Other Assets (Including Amortisable Assets)": { headerRow: 187, dataStartRow: 187, maxItems: 9 }
  };

  const sections = [
    {
      key: 'general',
      title: 'General Information',
      icon: DocumentTextIcon,
      fields: [
        { id: 'R2C2', label: 'Name of Firm', type: 'text', required: true, note: 'Enter your company/firm name' },
        { id: 'R4C2', label: 'Status of Concern', type: 'select', options: ['Soleproprietorship', 'Partnership', 'LLP', 'Company'], required: true, note: 'Select business structure' },
        { id: 'R5C2', label: 'Proprietor / MP / MD Name', type: 'text', required: true, note: 'Enter owner/managing partner name' },
        { id: 'bank_name', label: 'Bank Name / Department Name', type: 'text', required: true, note: 'Enter bank or department name' },
        { id: 'branch_name', label: 'Branch Name', type: 'text', required: true, note: 'Enter branch name' },
        { id: 'R6C2', label: 'Firm Address', type: 'textarea', required: true, note: 'Enter complete business address' },
        { id: 'R7C2', label: 'Sector', type: 'select', options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true, note: 'Select your primary business sector' },
        { id: 'R8C2', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' }
      ]
    },
    {
      key: 'finance',
      title: 'Means of Finance',
      icon: CurrencyDollarIcon,
      fields: [
        { id: 'R9C2', label: 'Do you have working capital limit at present?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you have existing loan' },
        { id: 'R11C2', label: 'WC Loan Requirement (₹)', type: 'number', min: 0, required: true, note: 'Enter loan amount in rupees' },
        { id: 'R13C2', label: 'WC Interest Rate (%)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Annual interest rate' },
        { id: 'R14C2', label: 'Processing Fee (%)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Processing fee percentage' },
        { id: 'R15C2', label: 'WC % of Turnover', type: 'number', min: 15, max: 100, step: 0.01, required: true, note: 'Working capital as % of turnover' }
      ]
    },
    {
      key: 'years',
      title: 'Financial Years',
      icon: CalendarIcon,
      fields: [
        { id: 'R17C2', label: '1st Year (Audited)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select audited year' },
        { id: 'R18C2', label: '2nd Year (Provisional)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select provisional year' },
        { id: 'R19C2', label: '3rd Year (Estimated)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select estimated year' },
        { id: 'R20C2', label: '4th Year (Projected)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select projected year' }
      ]
    },
    {
      key: 'audited',
      title: 'Audited Statements',
      icon: ChartBarIcon,
      fields: [
        { id: 'R23C2', label: 'Turnover (₹)', type: 'number', min: 0, required: true, note: 'Annual turnover' },
        { id: 'R25C2', label: 'Opening Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at beginning' },
        { id: 'R26C2', label: 'Direct Material (₹)', type: 'number', min: 0, required: true, note: 'Cost of materials' },
        { id: 'R27C2', label: 'Closing Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at end' },
        { id: 'R28C2', label: 'Non Op Income (₹)', type: 'number', min: 0, required: true, note: 'Other income' },
        { id: 'R29C2', label: 'Rent (₹)', type: 'number', min: 0, required: true, note: 'Annual rent paid' },
        { id: 'R30C2', label: 'Depreciation (₹)', type: 'number', min: 0, required: true, note: 'Depreciation expense' },
        { id: 'R31C2', label: 'Electricity (₹)', type: 'number', min: 0, required: true, note: 'Power charges' },
        { id: 'R32C2', label: 'Other Expenses (₹)', type: 'number', min: 0, required: true, note: 'Other operating expenses' },
        { id: 'R34C2', label: 'Salaries (₹)', type: 'number', min: 0, required: true, note: 'Total salaries and wages' },
        { id: 'R35C2', label: 'Interest on Loans (₹)', type: 'number', min: 0, required: true, note: 'Interest on term loans' },
        { id: 'R36C2', label: 'Current Liabilities (₹)', type: 'number', min: 0, required: true, note: 'Total current liabilities' },
        { id: 'R40C2', label: 'Net Profit (₹)', type: 'number', required: true, note: 'Net profit before tax' },
        { id: 'R41C2', label: 'Net Capital (₹)', type: 'number', min: 0, required: true, note: 'Net capital at year end' },
        { id: 'R42C2', label: 'Cash and Cash Equivalents (₹)', type: 'number', min: 0, required: true, note: 'Cash and bank balances' },
        { id: 'R43C2', label: 'Term Loans (₹)', type: 'number', min: 0, required: true, note: 'Outstanding term loans' },
        { id: 'R123C2', label: 'Opening Stock (Additional) (₹)', type: 'number', min: 0, required: true, note: 'Additional opening stock' }
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
        { id: 'j136', label: 'Partner Name 1 (Prepared By)', type: 'text', required: true, note: 'Enter partner name 1' },
        { id: 'j137', label: 'Partner Name 2 (Prepared By)', type: 'text', required: true, note: 'Enter partner name 2' },
        { id: 'j138', label: 'Mobile Number (Prepared By)', type: 'text', required: true, note: 'Enter mobile number' }
      ]
    }
  ];

  useEffect(() => {
    if (initialData && isEditMode) {
      console.log('📝 [FRCC3Form] Loading initial data for edit mode:', initialData);
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
        'R2C2': 'Tech Solutions Ltd',
        'R4C2': 'Company',
        'R5C2': 'Sarah Johnson',
        'bank_name': 'SBI',
        'branch_name': 'Main Branch',
        'R6C2': 'Innovation Hub, Tech City - 560001',
        'R7C2': 'Service sector (with stock)',
        'R8C2': 'IT Services and Consulting'
      },
      'Means of Finance': {
        'R9C2': 'Yes',
        'R11C2': 18000000,
        'R13C2': 10.5,
        'R14C2': 0.5,
        'R15C2': 20
      },
      'Financial Years': {
        'R17C2': '2024-25',
        'R18C2': '2025-26',
        'R19C2': '2026-27',
        'R20C2': '2027-28'
      },
      'Audited Statements': {
        'R23C2': 18000000, 'R25C2': 15000000, 'R26C2': 50000000,
        'R27C2': 18000000, 'R28C2': 80000, 'R29C2': 360000,
        'R30C2': 250000, 'R31C2': 400000, 'R32C2': 450000,
        'R34C2': 4000000, 'R35C2': 1000000, 'R36C2': 5000000,
        'R40C2': 6500000, 'R41C2': 12000000, 'R42C2': 2800000,
        'R43C2': 800000, 'R123C2': 2000000
      },
      'Fixed Assets Schedule': {
        'Plant and Machinery': { items: [{ description: 'Server Equipment', amount: 8000000 }], total: 8000000 },
        'Service Equipment': { items: [], total: 0 },
        'Shed and Civil Works': { items: [{ description: 'Office Complex', amount: 12000000 }], total: 12000000 },
        'Land': { items: [{ description: 'Commercial Land', amount: 4000000 }], total: 4000000 },
        'Electrical Items': { items: [], total: 0 },
        'Electronic Items': { items: [], total: 0 },
        'Furniture and Fittings': { items: [{ description: 'Office Furniture', amount: 250000 }], total: 250000 },
        'Vehicles': { items: [{ description: 'Company Car', amount: 800000 }], total: 800000 },
        'Live Stock': { items: [], total: 0 },
        'Other Assets': { items: [], total: 0 },
        'Other Assets (Including Amortisable Assets)': { items: [], total: 0 }
      },
      'Prepared By': {
        'j136': 'Partner 1',
        'j137': 'Partner 2',
        'j138': '9876543210'
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    console.log('🔄 Converting form data to Excel format...');
    const excelData = {};

    try {
      excelData['i4'] = data['General Information']?.['R2C2'] || '';
      excelData['i5'] = data['General Information']?.['R4C2'] || '';
      excelData['i6'] = data['General Information']?.['R5C2'] || '';
      excelData['i7'] = data['General Information']?.['R6C2'] || '';
      excelData['i8'] = data['General Information']?.['R7C2'] || '';
      excelData['i9'] = data['General Information']?.['R8C2'] || '';

      excelData['i11'] = data['Means of Finance']?.['R9C2'] || '';
      excelData['i12'] = data['Means of Finance']?.['R11C2'] || '';
      excelData['h13'] = data['Means of Finance']?.['R13C2'] || '';
      excelData['h14'] = data['Means of Finance']?.['R14C2'] || '';
      excelData['h15'] = data['Means of Finance']?.['R15C2'] || '';

      excelData['i17'] = data['Financial Years']?.['R17C2'] || '';
      excelData['i18'] = data['Financial Years']?.['R18C2'] || '';
      excelData['i19'] = data['Financial Years']?.['R19C2'] || '';
      excelData['i20'] = data['Financial Years']?.['R20C2'] || '';

      excelData['j136'] = data['Prepared By']?.['j136'] || '';
      excelData['j137'] = data['Prepared By']?.['j137'] || '';
      excelData['j138'] = data['Prepared By']?.['j138'] || '';

      excelData['i22'] = data['Audited Statements']?.['R23C2'] || '';
      excelData['i23'] = data['Audited Statements']?.['R123C2'] || '';
      const auditedInputRows = [25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 40, 41, 42, 43];
      auditedInputRows.forEach(rowNum => {
        const key = `R${rowNum}C2`;
        if (data['Audited Statements']?.[key] !== undefined) {
          excelData[`i${rowNum}`] = data['Audited Statements'][key];
        }
      });

      Object.entries(fixedAssetsMapping).forEach(([category, config]) => {
        const categoryData = data['Fixed Assets Schedule']?.[category];
        if (categoryData && categoryData.items && categoryData.items.length > 0) {
          excelData[`b${config.headerRow}`] = category;

          categoryData.items.forEach((item, index) => {
            if (index < config.maxItems) {
              const rowNum = config.dataStartRow + index;
              excelData[`d${rowNum}`] = item.description || '';
              excelData[`e${rowNum}`] = item.amount || '';
            }
          });
        }
      });

      console.log('✅ Excel data conversion completed:', Object.keys(excelData).length, 'cells');
      return excelData;
    } catch (error) {
      console.error('❌ Error in convertToExcelData:', error);
      throw new Error(`Failed to convert form data to Excel format: ${error.message}`);
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      console.log('🚀 Starting form submission...');
      console.log('📊 Current formData:', formData);

      const excelData = convertToExcelData(formData);
      console.log('📊 Generated excelData:', excelData);

      const payload = {
        formData: {
          excelData,
          formData,
          bank_name: formData['General Information']['bank_name'],
          branch_name: formData['General Information']['branch_name'],
          additionalData: {
            'Fixed Assets Schedule': formData['Fixed Assets Schedule']
          }
        }
      };

      console.log('📦 Final payload:', payload);
      console.log('🔗 Calling onSubmit...');

      await onSubmit(payload);
      console.log('✅ onSubmit completed successfully');
    } catch (error) {
      console.error('❌ Form submission error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
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
            onChange={(e) => handleFieldChange(sectionTitle, field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
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
            Format CC3 - Credit Assessment Report
          </h1>
          <p className="text-gray-600 text-sm">Complete each section to generate your financial report</p>
        </div>

        <div className="mb-4 flex justify-center">
          {/* <button 
            className="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 text-xs font-medium" 
            onClick={fillTestData}
            type="button"
          >
            Fill Test Data
          </button> */}
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
