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

const fixedAssetsMapping = {
  "Plant and Machinery": { dataStartRow: 100, maxItems: 10 },        // 100-109
  "Service Equipment": { dataStartRow: 110, maxItems: 10 },          // 110-119
  "Shed and Civil Works": { dataStartRow: 120, maxItems: 10 },       // 120-129
  "Land": { dataStartRow: 130, maxItems: 3 },                        // 130-132
  "Electrical Items": { dataStartRow: 133, maxItems: 9 },            // 133-141
  "Electronic Items": { dataStartRow: 142, maxItems: 10 },           // 142-151
  "Furniture and Fittings": { dataStartRow: 152, maxItems: 10 },     // 152-161
  "Vehicles": { dataStartRow: 162, maxItems: 10 },                   // 162-171
  "Computers": { dataStartRow: 172, maxItems: 9 },                   // 172-180
  "Other Assets": { dataStartRow: 181, maxItems: 10 },               // 181-190
  "Other Assets (Including Amortisable Assets)": { dataStartRow: 191, maxItems: 10 } // 191-200
};


const FRCC4Form = ({
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
      'Computers': { items: [], total: 0 },
      'Other Assets': { items: [], total: 0 },
      'Other Assets (Including Amortisable Assets)': { items: [], total: 0 }
    },
    'Prepared By': initialData['Prepared By'] || {}
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [activeAssetTab, setActiveAssetTab] = useState(0);

  const sections = [
    {
      key: 'general',
      title: 'General Information',
      icon: DocumentTextIcon,
      fields: [
        { id: 'R3C2', label: 'Name of Firm', type: 'text', required: true, note: 'Enter your company/firm name' },
        { id: 'R4C2', label: 'Status of Concern', type: 'select', options: ['Soleproprietorship', 'Partnership', 'LLP', 'Company'], required: true, note: 'Select business structure' },
        { id: 'R5C2', label: 'Proprietor / MP / MD Name', type: 'text', required: true, note: 'Enter owner/managing partner name' },
        { id: 'bank_name', label: 'Bank Name / Department Name', type: 'text', required: true, note: 'Enter bank or department name' },
        { id: 'branch_name', label: 'Branch Name', type: 'text', required: true, note: 'Enter branch name' },
        { id: 'R6C2', label: 'Firm Address', type: 'textarea', required: true, note: 'Enter complete business address' },
        { id: 'R7C2', label: 'Sector', type: 'select', options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true, note: 'Select your primary business sector' },
        { id: 'R8C2', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' },
        { id: 'R8C2', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' }
      ]
    },
    {
      key: 'finance',
      title: 'Means of Finance',
      icon: CurrencyDollarIcon,
      fields: [
        { id: 'i10', label: 'Do you have working capital limit at present?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you have existing loan' },
        { id: 'i11', label: 'Are you going for Working capital limit Topup from present limit?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you need top-up' },
        { id: 'i12', label: 'Working Capital Loan Requirement (₹)', type: 'number', min: 0, required: true, note: 'Enter loan amount in rupees' },
        { id: 'h13', label: 'Working Capital Loan Interest (Annual %)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Annual interest rate' },
        { id: 'h14', label: 'Processing Fees (Including GST) (%)', type: 'number', min: 0, required: true, note: 'Processing fee percentage' },
        { id: 'h15', label: 'Working Capital (% of Turnover)', type: 'number', min: 15, max: 100, step: 0.01, required: true, note: 'Working capital as % of turnover' }
      ]
    },
    {
      key: 'years',
      title: 'Financial Years',
      icon: CalendarIcon,
      fields: [
        { id: 'i17', label: '1st Financial Year (Audited)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select audited year' },
        { id: 'i18', label: '2nd Financial Year (Provisional)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select provisional year' },
        { id: 'i19', label: '3rd Financial Year (Estimated)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select estimated year' },
        { id: 'i20', label: '4th Financial Year (Projected)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select projected year' },
        { id: 'i21', label: '5th Financial Year (Projected)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select projected year' }
      ]
    },
    {
      key: 'audited',
      title: 'Audited Statements',
      icon: ChartBarIcon,
      fields: [
        { id: 'i22', label: 'Turnover (₹)', type: 'number', min: 0, required: true, note: 'Annual turnover' },
        { id: 'i23', label: 'Opening Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at beginning' },
        { id: 'i24', label: 'Direct Material & Expenses (₹)', type: 'number', min: 0, required: true, note: 'Cost of materials' },
        { id: 'i25', label: 'Closing Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at end' },
        { id: 'i26', label: 'Non Operating Income (₹)', type: 'number', min: 0, required: true, note: 'Other income' },
        { id: 'i27', label: 'Electricity (₹)', type: 'number', min: 0, required: true, note: 'Power charges' },
        { id: 'i28', label: 'Depreciation (₹)', type: 'number', min: 0, required: true, note: 'Depreciation expense' },
        { id: 'i29', label: 'Rent (₹)', type: 'number', min: 0, required: true, note: 'Annual rent paid' },
        { id: 'i30', label: 'Salaries & Wages (₹)', type: 'number', min: 0, required: true, note: 'Total salaries and wages' },
        { id: 'i31', label: 'Processing Fees (Including GST) (%)', type: 'number', min: 0, required: true, note: 'Processing fees paid' },
        { id: 'i32', label: 'Interest on CC / OD Loan (₹)', type: 'number', min: 0, required: true, note: 'Interest on cash credit/overdraft' },
        { id: 'i33', label: 'Interest on Other Loans (₹)', type: 'number', min: 0, required: true, note: 'Interest on term loans' },
        { id: 'i34', label: 'Net Profit Before Tax (₹)', type: 'number', required: true, note: 'Net profit before tax' },
        { id: 'i36', label: 'Net Capital (Opening + Profit - Drawings) (₹)', type: 'number', min: 0, required: true, note: 'Net capital at year end' },
        { id: 'i37', label: 'Term Loans (Secured + Unsecured Total) (₹)', type: 'number', min: 0, required: true, note: 'Outstanding term loans' },
        { id: 'i38', label: 'CC Loan Outstanding (₹)', type: 'number', min: 0, required: true, note: 'Cash credit outstanding' },
        { id: 'i39', label: 'Other Current Liabilities (₹)', type: 'number', min: 0, required: true, note: 'Other current liabilities' },
        { id: 'i40', label: 'Net Total Fixed Assets (₹)', type: 'number', min: 0, required: true, note: 'Net fixed assets value' },
        { id: 'i43', label: 'Investments (₹)', type: 'number', min: 0, required: true, note: 'Investments held' },
        { id: 'i44', label: 'Debtors (₹)', type: 'number', min: 0, required: true, note: 'Accounts receivable' },
        { id: 'i45', label: 'Cash and Cash Equivalents (₹)', type: 'number', min: 0, required: true, note: 'Cash and bank balances' },
        { id: 'i46', label: 'Other Current Assets (₹)', type: 'number', min: 0, required: true, note: 'Other current assets' }
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
      console.log('📝 [FRCC4Form] Loading initial data for edit mode:', initialData);
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
        'R3C2': 'ACME Industries LLP',
        'R4C2': 'LLP',
        'R5C2': 'John Doe',
        'bank_name': 'SBI',
        'branch_name': 'Main Branch',
        'R6C2': 'Industrial Area, City - 500001',
        'R7C2': 'Manufacturing sector',
        'R8C2': 'Manufacturing of Industrial Equipment'
      },
      'Means of Finance': {
        'i10': 'No',
        'i11': 'No',
        'i12': 15000000,
        'h13': 11,
        'h14': 1.0,
        'h15': 18
      },
      'Financial Years': {
        'i17': '2024-25',
        'i18': '2025-26',
        'i19': '2025-26',
        'i20': '2026-27',
        'i21': '2027-28'
      },
      'Audited Statements': {
        'i22': 150000000, 'i23': 50000000, 'i24': 16000000,
        'i25': 75000,
        'i26': 200000, 'i27': 350000,
        'i28': 3500000, 'i29': 900000, 'i30': 6500000,
        'i31': 10000000, 'i32': 2500000, 'i33': 1200000,
        'i34': 6000000, 'i36': 2200000, 'i37': 500000,
        'i38': 40000000, 'i39': 18000000, 'i40': 28000,
        'i43': 80000, 'i44': 175000, 'i45': 900000,
        'i46': 12000000
      },
      'Fixed Assets Schedule': {
        'Plant and Machinery': { items: [{ description: 'CNC Machine', amount: 2000000 }], total: 2000000 },
        'Service Equipment': { items: [], total: 0 },
        'Shed and Civil Works': { items: [{ description: 'Factory Building', amount: 5000000 }], total: 5000000 },
        'Land': { items: [], total: 0 },
        'Electrical Items': { items: [], total: 0 },
        'Electronic Items': { items: [], total: 0 },
        'Furniture and Fittings': { items: [{ description: 'Office Furniture', amount: 150000 }], total: 150000 },
        'Vehicles': { items: [], total: 0 },
        'Computers': { items: [], total: 0 },
        'Other Assets': { items: [], total: 0 },
        'Other Assets (Including Amortisable Assets)': { items: [], total: 0 }
      },
      'Prepared By': {
        'j136': 'Partner A',
        'j137': 'Partner B',
        'j138': '9876543210'
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    const excelData = {};

    excelData['i3'] = data['General Information']['R3C2'];
    excelData['i4'] = data['General Information']['R4C2'];
    excelData['i5'] = data['General Information']['R5C2'];
    excelData['i6'] = data['General Information']['R6C2'];
    excelData['i7'] = data['General Information']['R7C2'];
    excelData['i8'] = data['General Information']['R8C2'];

    excelData['j136'] = data['Prepared By']?.['j136'];
    excelData['j137'] = data['Prepared By']?.['j137'];
    excelData['j138'] = data['Prepared By']?.['j138'];

    excelData['i10'] = data['Means of Finance']['i10'];
    excelData['i11'] = data['Means of Finance']['i11'];
    excelData['i12'] = data['Means of Finance']['i12'];
    excelData['h13'] = data['Means of Finance']['h13'];
    excelData['h14'] = data['Means of Finance']['h14'];
    excelData['h15'] = data['Means of Finance']['h15'];

    excelData['i17'] = data['Financial Years']['i17'];
    excelData['i18'] = data['Financial Years']['i18'];
    excelData['i19'] = data['Financial Years']['i19'];
    excelData['i20'] = data['Financial Years']['i20'];
    excelData['i21'] = data['Financial Years']['i21'];

    excelData['i22'] = data['Audited Statements']['i22'];
    excelData['i23'] = data['Audited Statements']['i23'];
    excelData['i24'] = data['Audited Statements']['i24'];
    excelData['i25'] = data['Audited Statements']['i25'];
    excelData['i26'] = data['Audited Statements']['i26'];
    excelData['i27'] = data['Audited Statements']['i27'];
    excelData['i28'] = data['Audited Statements']['i28'];
    excelData['i29'] = data['Audited Statements']['i29'];
    excelData['i30'] = data['Audited Statements']['i30'];
    excelData['i31'] = data['Audited Statements']['i31'];
    excelData['i32'] = data['Audited Statements']['i32'];
    excelData['i33'] = data['Audited Statements']['i33'];
    excelData['i34'] = data['Audited Statements']['i34'];
    excelData['i36'] = data['Audited Statements']['i36'];
    excelData['i37'] = data['Audited Statements']['i37'];
    excelData['i38'] = data['Audited Statements']['i38'];
    excelData['i39'] = data['Audited Statements']['i39'];
    excelData['i40'] = data['Audited Statements']['i40'];
    excelData['i43'] = data['Audited Statements']['i43'];
    excelData['i44'] = data['Audited Statements']['i44'];
    excelData['i45'] = data['Audited Statements']['i45'];
    excelData['i46'] = data['Audited Statements']['i46'];

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
          excelData,
          formData,
          bank_name: formData['General Information']['bank_name'],
          branch_name: formData['General Information']['branch_name'],
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
            Format CC4 - Credit Assessment Report
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

