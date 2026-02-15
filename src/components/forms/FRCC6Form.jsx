import React, { useState, useCallback, useEffect } from 'react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
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
  "Plant and Machinery": { headerRow: 135, dataStartRow: 135, maxItems: 10 },
  "Service Equipment": { headerRow: 145, dataStartRow: 145, maxItems: 10 },
  "Civil works & Shed Construction": { headerRow: 155, dataStartRow: 155, maxItems: 10 },
  "Land": { headerRow: 165, dataStartRow: 165, maxItems: 3 },
  "Electrical Items & fittings": { headerRow: 168, dataStartRow: 168, maxItems: 10 },
  "Electronic Items": { headerRow: 178, dataStartRow: 178, maxItems: 10 },
  "Furniture and Fittings": { headerRow: 188, dataStartRow: 188, maxItems: 10 },
  "Vehicles": { headerRow: 198, dataStartRow: 198, maxItems: 10 },
  "Live stock": { headerRow: 208, dataStartRow: 208, maxItems: 9 },
  "Other Assets": { headerRow: 217, dataStartRow: 217, maxItems: 10 }
};

const FRCC6Form = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null
}) => {
  const [formData, setFormData] = useState(initialData || {
    'General Information': {},
    'Means of Finance': {},
    'Financial Years': {},
    'Provisional or Audited': {},
    'New Term Loan Finance Details': {},
    'Fixed Assets Schedule': {
      'Plant and Machinery': { items: [], total: 0 },
      'Service Equipment': { items: [], total: 0 },
      'Civil works & Shed Construction': { items: [], total: 0 },
      'Land': { items: [], total: 0 },
      'Electrical Items & fittings': { items: [], total: 0 },
      'Electronic Items': { items: [], total: 0 },
      'Furniture and Fittings': { items: [], total: 0 },
      'Vehicles': { items: [], total: 0 },
      'Live stock': { items: [], total: 0 },
      'Other Assets': { items: [], total: 0 },
    },
    'Prepared By': initialData['Prepared By'] || {}
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [activeAssetTab, setActiveAssetTab] = useState(0);

  const sections = [
    { key: 'general', title: 'General Information', icon: DocumentTextIcon },
    { key: 'finance', title: 'Means of Finance', icon: CurrencyDollarIcon },
    { key: 'years', title: 'Financial Years', icon: CalendarIcon },
    { key: 'audited', title: 'Provisional or Audited', icon: ChartBarIcon },
    { key: 'term', title: 'New Term Loan Finance Details', icon: CreditCardIcon },
    {
      key: 'fixed',
      title: 'Fixed Assets Schedule',
      icon: BuildingOfficeIcon,
      categories: Object.keys(fixedAssetsMapping).map(title => ({
        title,
        ...fixedAssetsMapping[title]
      })),

    },
    { key: 'prepared_by', title: 'Prepared By', icon: BuildingOfficeIcon }
  ];

  useEffect(() => {
    if (initialData && isEditMode) {
      console.log('📝 [FRCC6Form] Loading initial data for edit mode:', initialData);
      setFormData(prevFormData => {
        const merged = { ...prevFormData };
        for (const sectionKey in initialData) {
          if (initialData.hasOwnProperty(sectionKey)) {
            if (typeof initialData[sectionKey] === 'object' && initialData[sectionKey] !== null &&
              typeof merged[sectionKey] === 'object' && merged[sectionKey] !== null &&
              !Array.isArray(initialData[sectionKey])) {
              merged[sectionKey] = { ...merged[sectionKey], ...initialData[sectionKey] };
            } else {
              merged[sectionKey] = initialData[sectionKey];
            }
          }
        }
        if (initialData['Fixed Assets Schedule'] && merged['Fixed Assets Schedule']) {
          merged['Fixed Assets Schedule'] = { ...merged['Fixed Assets Schedule'] };
          for (const category in initialData['Fixed Assets Schedule']) {
            if (initialData['Fixed Assets Schedule'].hasOwnProperty(category)) {
              merged['Fixed Assets Schedule'][category] = {
                ...merged['Fixed Assets Schedule'][category],
                ...initialData['Fixed Assets Schedule'][category],
                items: initialData['Fixed Assets Schedule'][category].items
                  ? [...initialData['Fixed Assets Schedule'][category].items]
                  : []
              };
            }
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
        'i3': 'Elite Manufacturing Corp',
        'i4': 'Company',
        'i5': 'Robert Wilson',
        'bank_name': 'ICICI Bank',
        'branch_name': 'Industrial Branch',
        'i6': 'Tech Park, Silicon Valley - 700001',
        'i7': 'Manufacturing sector',
        'i8': 'Manufacturing of Electronics'
      },
      'Means of Finance': {
        'i10': 'Yes',
        'i11': 'No',
        'i12': 25000000,
        'h13': 9.5,
        'h14': 0.3,
        'h15': 22,
        'i16': 'Yes'
      },
      'Financial Years': {
        'i18': '2024-25',
        'i19': '2025-26',
        'i20': '2026-27',
        'i21': '2027-28',
        'i22': '2028-29',
        'i23': '2029-30',
        'i24': '2030-31'
      },
      'Provisional or Audited': {
        'i26': 50000000, 'i27': 25000000, 'i28': 35000,
        'i29': 120000, 'i30': 1500000, 'i31': 16000000,
        'i32': 4000000, 'i33': 10000000, 'i34': 2500000,
        'i35': 9000000, 'i36': 4500000, 'i37': 3000000,
        'i38': 9500000, 'i40': 2200000, 'i41': 3800000,
        'i42': 600000, 'i43': 800000, 'i44': 1.08,
        'i47': 1500000, 'i48': 2000000, 'i49': 500000,
        'i50': 300000
      },
      'New Term Loan Finance Details': {
        'h66': 9.5,
        'i67': 5,
        'i68': 'EMI shared equally over loan Term period',
        'i69': 3,
        'h70': 1.0,
        'i71': 8,
        'i72': '2025-10-01'
      },
      'Fixed Assets Schedule': {
        'Plant and Machinery': { items: [{ description: 'Production Line', amount: 10000000 }], total: 10000000 },
        'Service Equipment': { items: [], total: 0 },
        'Civil works & Shed Construction': { items: [{ description: 'Factory Complex', amount: 15000000 }], total: 15000000 },
        'Land': { items: [{ description: 'Industrial Land', amount: 5000000 }], total: 5000000 },
        'Electrical Items & fittings': { items: [], total: 0 },
        'Electronic Items': { items: [], total: 0 },
        'Furniture and Fittings': { items: [{ description: 'Office Furniture', amount: 300000 }], total: 300000 },
        'Vehicles': { items: [{ description: 'Truck', amount: 1200000 }], total: 1200000 },
        'Live stock': { items: [], total: 0 },
        'Other Assets': { items: [], total: 0 },
      },
      'Prepared By': {
        'j136': 'Partner Name 1',
        'j137': 'Partner Name 2',
        'j138': '9876543210'
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    const excelData = {};

    Object.values(data).forEach(section => {
      if (typeof section === 'object' && section !== null && section !== data['Fixed Assets Schedule']) {
        for (const key in section) {
          if (section.hasOwnProperty(key)) {
            excelData[key] = section[key];
          }
        }
      }
    });

    Object.keys(fixedAssetsMapping).forEach(categoryTitle => {
      const mapping = fixedAssetsMapping[categoryTitle];
      const categoryData = data['Fixed Assets Schedule']?.[categoryTitle];

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

    excelData['j136'] = data['Prepared By']?.['j136'] || '';
    excelData['j137'] = data['Prepared By']?.['j137'] || '';
    excelData['j138'] = data['Prepared By']?.['j138'] || '';

    return excelData;
  };

  const handleSubmit = useCallback(async () => {
    try {
      const excelData = convertToExcelData(formData);

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

      await onSubmit(payload);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to submit form. Please try again.');
    }
  }, [formData, onSubmit]);

  const validateCurrentSection = useCallback(() => {
    const currentSectionConfig = sections[currentStep]; // Get the section config
    const fieldsToValidate = fieldsBySection[currentSectionConfig.key]; // Use fieldsBySection to get fields

    if (!fieldsToValidate) { // If no fields are defined for this section key, it's valid for now
      return true;
    }

    const sectionData = formData[currentSectionConfig.title];

    // If sectionData is undefined/null AND there are required fields, then it's invalid
    if ((sectionData === undefined || sectionData === null) && fieldsToValidate.some(f => f.required)) {
      return false;
    }

    for (const field of fieldsToValidate) { // Iterate over the correct fields array
      if (field.required) {
        const value = sectionData?.[field.id]; // Use optional chaining to safely access value
        if (value === '' || value === null || value === undefined) {
          return false;
        }
        if (field.type === 'number' && (value === 0 || value === '')) {
          return false;
        }
      }
    }

    return true;
  }, [currentStep, formData, sections]);

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

    return (
      <div key={field.id} className="space-y-1.5">
        <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.type === 'select' ? (
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
        ) : field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(sectionTitle, field.id, e.target.value)}
            required={field.required}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white resize-none"
          />
        ) : field.type === 'computed' ? (
          <input
            type="text"
            value={value || 'Auto-calculated'}
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
        ) : (
          <input
            type={field.type}
            value={field.type === 'date' && !value ? '' : value}
            onChange={(e) => handleFieldChange(sectionTitle, field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          />
        )}
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

  const fieldsBySection = {
    general: [
      { id: 'i3', label: 'Name of Firm', type: 'text', required: true },
      { id: 'i4', label: 'Status of Concern', type: 'select', options: ['Soleproprietorship', 'Partnership', 'LLP', 'Company'], required: true },
      { id: 'i5', label: 'Proprietor / Managing Partner / Managing Director', type: 'text', required: true },
      { id: 'bank_name', label: 'Bank Name / Department Name', type: 'text', required: true },
      { id: 'branch_name', label: 'Branch Name', type: 'text', required: true },
      { id: 'i6', label: 'Firm address', type: 'textarea', required: true },
      { id: 'i7', label: 'Sector', type: 'select', options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true },
      { id: 'i8', label: 'Nature of Business', type: 'text', required: true }
    ],
    finance: [
      { id: 'i10', label: 'Do you have working capital limit at present ?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'i11', label: 'Are you going for Working capital limit Topup from present limit?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'i12', label: 'Working capital Loan requirement', type: 'number', min: 0, required: true },
      { id: 'h13', label: 'Working capital loan interest', type: 'number', min: 0, max: 100, step: 0.01, required: true },
      { id: 'h14', label: 'Processing fees (Including GST)(%)', type: 'number', min: 0, step: 0.01, required: true },
      { id: 'h15', label: 'Working capital (% on Turnover)', type: 'number', min: 15, max: 100, step: 0.01, required: true },
      { id: 'i16', label: 'Are you going for Fresh Term Loan in the Present Financial Year', type: 'select', options: ['Yes', 'No'], required: true }
    ],
    years: [
      { id: 'i18', label: '1st Financial year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i19', label: '2nd Financial year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i20', label: '3rd Financial year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i21', label: '4th Financial year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i22', label: '5th Financial year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i23', label: '6th Financial year', type: 'select', options: generateFinancialYearOptions(), required: true },
      { id: 'i24', label: '7th Financial year', type: 'select', options: generateFinancialYearOptions(), required: true }
    ],
    audited: [
      { id: 'i26', label: 'Turnover', type: 'number', min: 0, required: true },
      { id: 'i27', label: 'Opening Stock', type: 'number', min: 0, required: true },
      { id: 'i28', label: 'Direct Material & Expenses', type: 'number', min: 0, required: true },
      { id: 'i29', label: 'Closing Stock', type: 'number', min: 0, required: true },
      { id: 'i30', label: 'Non Operating Income', type: 'number', min: 0, required: true },
      { id: 'i31', label: 'Electricity', type: 'number', min: 0, required: true },
      { id: 'i32', label: 'Depreciation', type: 'number', min: 0, required: true },
      { id: 'i33', label: 'Rent', type: 'number', min: 0, required: true },
      { id: 'i34', label: 'Salaries & Wages', type: 'number', min: 0, required: true },
      { id: 'i35', label: 'Processing fees (Including GST)(%)', type: 'number', min: 0, step: 0.01, required: true },
      { id: 'i36', label: 'Interest on CC / OD Loan', type: 'number', min: 0, required: true },
      { id: 'i37', label: 'Interest on Other loans', type: 'number', min: 0, required: true },
      { id: 'i38', label: 'Net Profit Before Tax', type: 'number', required: true },
      { id: 'i40', label: 'Net Capital (Opening capital +Net Profit -Drawings)', type: 'number', min: 0, required: true },
      { id: 'i41', label: 'Term Loans (Secured and Unsecured Loans Total)', type: 'number', min: 0, required: true },
      { id: 'i42', label: 'CC Loan Outstanding', type: 'number', min: 0, required: true },
      { id: 'i43', label: 'Other Current Liabilities', type: 'number', min: 0, required: true },
      { id: 'i44', label: 'Net Total Fixed Assets', type: 'number', min: 0, required: true },
      { id: 'i47', label: 'Investments', type: 'number', min: 0, required: true },
      { id: 'i48', label: 'Debtors', type: 'number', min: 0, required: true },
      { id: 'i49', label: 'Cash and Cash Equivalents', type: 'number', min: 0, required: true },
      { id: 'i50', label: 'Other Current Assets if any', type: 'number', min: 0, required: true }
    ],
    term: [
      { id: 'h66', label: 'Term Loan Rate of Interest(per annum)', type: 'number', min: 0, step: 0.01, required: true },
      { id: 'i67', label: 'Term Loan Tenure', type: 'number', min: 0, required: true },
      { id: 'i68', label: 'EMI or Principal Amount shared Equally over loan Term period', type: 'select', options: ['EMI shared equally over loan Term period', 'Principal amount shared Equally over Loan term period'], required: true },
      { id: 'i69', label: 'Moratorium period , if any (In months)', type: 'number', min: 0, required: true },
      { id: 'h70', label: 'Processing fees rate (Including GST)(%)', type: 'number', min: 0, step: 0.01, required: true },
      { id: 'i71', label: 'No of Months EMI paid in First year of Term Loan', type: 'number', min: 0, required: true },
      { id: 'i72', label: 'From which month first EMI (New Term Loan) will be paid', type: 'date', required: true }
    ],
    prepared_by: [
      { id: 'j136', label: 'Partner Name 1 (Prepared By)', type: 'text', required: true },
      { id: 'j137', label: 'Partner Name 2 (Prepared By)', type: 'text', required: true },
      { id: 'j138', label: 'Mobile Number (Prepared By)', type: 'text', required: true }
    ]
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
            Format CC6 - Credit Assessment Report (Advanced)
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
                {fieldsBySection[currentSection.key]?.map(field => renderField(field, currentSection.title))}
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

export default FRCC6Form;
