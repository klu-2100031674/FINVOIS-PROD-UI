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
  TrashIcon
} from '@heroicons/react/24/outline';

// Generate financial year options
const generateFinancialYearOptions = () => {
  const options = [];
  for (let start = 2024; start <= 2033; start++) {
    options.push(`${start}-${(start + 1).toString().slice(-2)}`);
  }

  return options;
};

// Form configuration for CC2
const sections = [
  {
    key: 'general',
    title: 'General Information',
    icon: DocumentTextIcon,
    fields: [
      { id: 'i3', label: 'Name of Firm', type: 'text', required: true, note: 'Enter your company/firm name' },
      { id: 'i4', label: 'Status of Concern', type: 'select', options: ['Soleproprietorship', 'Partnership', 'LLP', 'Company'], required: true, note: 'Select business structure' },
      { id: 'i5', label: 'Proprietor / MP / MD Name', type: 'text', required: true, note: 'Enter the name of the owner/managing partner/managing director' },
      { id: 'i6', label: 'Firm Address', type: 'textarea', required: true, note: 'Enter complete business address' },
      { id: 'i7', label: 'Sector', type: 'select', options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true, note: 'Select your primary business sector' },
      { id: 'i8', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' }
    ]
  },
  {
    key: 'finance',
    title: 'Means of Finance',
    icon: CurrencyDollarIcon,
    fields: [
      { id: 'i10', label: 'Do you have working capital limit at present?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you currently have an existing working capital loan' },
      { id: 'i11', label: 'Working Capital Loan Requirement (₹)', type: 'number', min: 0, required: true, note: 'Enter loan amount in rupees (e.g., 10000000 for ₹1 crore)' },
      { id: 'h12', label: 'Working Capital Loan Interest (Annual %)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Enter annual interest rate as percentage (e.g., 12 for 12% per annum)' },
      { id: 'h13', label: 'Processing Fees (% of Loan Amount)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Enter processing fee as % (e.g., 1 for 1%)' },
      { id: 'h14', label: 'Working Capital (% of Turnover)', type: 'number', min: 15, max: 100, step: 0.01, required: true, note: 'Enter working capital as percentage of turnover (minimum 15%)' }
    ]
  },
  {
    key: 'years',
    title: 'Financial Years',
    icon: CalendarIcon,
    fields: [
      { id: 'i16', label: '1st Financial Year (Audited)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select audited financial year' },
      { id: 'i17', label: '2nd Financial Year (Provisional)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Partial year possible (e.g., Apr to Sept 2025-26)' },
      { id: 'i18', label: '3rd Financial Year (Estimated)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select estimated year' },
      { id: 'i19', label: '4th Financial Year (Projected)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select projected year' },
      { id: 'i20', label: '5th Financial Year (Projected)', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select projected year' }
    ]
  },
  {
    key: 'financial-statements',
    title: 'Financial Statements',
    icon: ChartBarIcon,
    fields: [
      { id: 'i45', label: 'No of Months Completed in Provisional Year', type: 'number', min: 1, max: 12, required: true, note: 'Number of months completed (e.g., 6 for Apr to Sept)' }
    ],
    audited: {
      title: 'Audited Financial Statements',
      subtitle: 'Based on 1st Financial Year (Audited)',
      fields: [
        { id: 'i22', label: 'Turnover (₹)', type: 'number', min: 0, required: true, note: 'Annual turnover from audited statements' },
        { id: 'i23', label: 'Opening Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at beginning of year' },
        { id: 'i24', label: 'Direct Material & Expenses (₹)', type: 'number', min: 0, required: true, note: 'Cost of materials and direct expenses' },
        { id: 'i25', label: 'Closing Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at end of year' },
        { id: 'i26', label: 'Non Operating Income (₹)', type: 'number', min: 0, required: true, note: 'Other income (interest, rent received, etc.)' },
        { id: 'i27', label: 'Depreciation (₹)', type: 'number', min: 0, required: true, note: 'Depreciation expense for the year' },
        { id: 'i28', label: 'Electricity (₹)', type: 'number', min: 0, required: true, note: 'Power and electricity charges' },
        { id: 'i29', label: 'Rent (₹)', type: 'number', min: 0, required: true, note: 'Annual rent paid' },
        { id: 'i30', label: 'Salaries & Wages (₹)', type: 'number', min: 0, required: true, note: 'Total employee salaries and wages' },
        { id: 'i31', label: 'Interest on Other Loans (₹)', type: 'number', min: 0, required: true, note: 'Interest on term loans and other borrowings' },
        { id: 'i32', label: 'Net Profit Before Tax (₹)', type: 'number', min: 0, required: true, note: 'Profit before tax as per audited statements' },
        { id: 'i34', label: 'Net Capital (Opening + Profit - Drawings) (₹)', type: 'number', min: 0, required: true, note: 'Net capital at year end' },
        { id: 'i35', label: 'Term Loans (Secured + Unsecured Total) (₹)', type: 'number', min: 0, required: true, note: 'Total outstanding term loans' },
        { id: 'i36', label: 'Current Liabilities (₹)', type: 'number', min: 0, required: true, note: 'Total current liabilities' },
        { id: 'i37', label: 'Net Total Fixed Assets (₹)', type: 'computed', note: 'Auto-generated from Fixed Assets Schedule' },
        { id: 'i40', label: 'Investments (₹)', type: 'number', min: 0, required: true, note: 'Investments held' },
        { id: 'i41', label: 'Debtors (₹)', type: 'number', min: 0, required: true, note: 'Accounts receivable' },
        { id: 'i42', label: 'Cash and Cash Equivalents (₹)', type: 'number', min: 0, required: true, note: 'Cash, bank balances' },
        { id: 'i43', label: 'Other Current Assets (₹)', type: 'number', min: 0, required: true, note: 'Other current assets if any' }
      ]
    },
    provisional: {
      title: 'Provisional Financial Statements',
      subtitle: 'Based on 2nd Financial Year (Provisional)',
      fields: [
        { id: 'i46', label: 'Turnover (₹)', type: 'number', min: 0, required: true, note: 'Turnover for provisional period' },
        { id: 'i47', label: 'Opening Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at beginning of provisional year' },
        { id: 'i48', label: 'Direct Material & Expenses (₹)', type: 'number', min: 0, required: true, note: 'Cost of materials and direct expenses' },
        { id: 'i49', label: 'Closing Stock (₹)', type: 'number', min: 0, required: true, note: 'Stock at end of provisional period' },
        { id: 'i50', label: 'Non Operating Income (₹)', type: 'number', min: 0, required: true, note: 'Other income for provisional period' },
        { id: 'i51', label: 'Depreciation (₹)', type: 'number', min: 0, required: true, note: 'Depreciation for provisional period' },
        { id: 'i52', label: 'Electricity (₹)', type: 'number', min: 0, required: true, note: 'Electricity charges for provisional period' },
        { id: 'i53', label: 'Rent (₹)', type: 'number', min: 0, required: true, note: 'Rent paid for provisional period' },
        { id: 'i54', label: 'Salaries & Wages (₹)', type: 'number', min: 0, required: true, note: 'Salaries for provisional period' },
        { id: 'i55', label: 'Interest on Other Loans (₹)', type: 'number', min: 0, required: true, note: 'Interest paid on term loans' },
        { id: 'i56', label: 'Net Profit Before Tax (₹)', type: 'number', min: 0, required: true, note: 'Profit before tax for provisional period' },
        { id: 'i58', label: 'Net Capital (Opening + Profit - Drawings) (₹)', type: 'number', min: 0, required: true, note: 'Net capital at provisional period end' },
        { id: 'i59', label: 'Term Loans (Secured + Unsecured Total) (₹)', type: 'number', min: 0, required: true, note: 'Outstanding term loans' },
        { id: 'i60', label: 'Current Liabilities (₹)', type: 'number', min: 0, required: true, note: 'Current liabilities at provisional period end' },
        { id: 'i63', label: 'Net Fixed Assets (₹)', type: 'computed', note: 'Auto-calculated (Gross - Depreciation)' },
        { id: 'i64', label: 'Investments (₹)', type: 'number', min: 0, required: true, note: 'Investments held' },
        { id: 'i65', label: 'Debtors (₹)', type: 'number', min: 0, required: true, note: 'Accounts receivable' },
        { id: 'i66', label: 'Cash and Cash Equivalents (₹)', type: 'number', min: 0, required: true, note: 'Cash and bank balances' },
        { id: 'i67', label: 'Other Current Assets (₹)', type: 'number', min: 0, required: true, note: 'Other current assets if any' }
      ]
    }
  },
  {
    key: 'fixed',
    title: 'Fixed Assets Schedule (as on 31.03.2025)',
    icon: BuildingOfficeIcon,
    categories: [
      { idPrefix: 'R121C2', title: 'Plant and Machinery', itemCount: 10, startIndex: 121 },
      { idPrefix: 'R131C2', title: 'Service Equipment', itemCount: 10, startIndex: 131 },
      { idPrefix: 'R141C2', title: 'Shed and Civil Works', itemCount: 10, startIndex: 141 },
      { idPrefix: 'R151C2', title: 'Land', itemCount: 3, startIndex: 151 },
      { idPrefix: 'R154C2', title: 'Electrical Items', itemCount: 9, startIndex: 154 },
      { idPrefix: 'R164C2', title: 'Electronic Items', itemCount: 10, startIndex: 164 },
      { idPrefix: 'R173C2', title: 'Furniture and Fittings', itemCount: 10, startIndex: 173 },
      { idPrefix: 'R183C2', title: 'Vehicles', itemCount: 10, startIndex: 183 },
      { idPrefix: 'R193C2', title: 'Live Stock', itemCount: 9, startIndex: 193 },
      { idPrefix: 'R202C2', title: 'Other Assets', itemCount: 10, startIndex: 202 },
      { idPrefix: 'R212C2', title: 'Other Assets (Including Amortisable Assets)', itemCount: 10, startIndex: 212 }
    ]
  }
];

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
      "i3": "",
      "i4": "",
      "i5": "",
      "i6": "",
      "i7": "",
      "i8": ""
    },
    "Means of Finance": {
      "i10": "",
      "i11": "",
      "h12": "",
      "h13": "",
      "h14": ""
    },
    "Financial Years": {
      "i16": "",
      "i17": "",
      "i18": "",
      "i19": "",
      "i20": ""
    },
    "Audited Financial Statements": {
      "i22": "",
      "i23": "",
      "i24": "",
      "i25": "",
      "i26": "",
      "i27": "",
      "i28": "",
      "i29": "",
      "i30": "",
      "i31": "",
      "i32": "",
      "i34": "",
      "i35": "",
      "i36": "",
      "i37": "",
      "i40": "",
      "i41": "",
      "i42": "",
      "i43": ""
    },
    "Provisional Financial Statements": {
      "i45": "",
      "i46": "",
      "i47": "",
      "i48": "",
      "i49": "",
      "i50": "",
      "i51": "",
      "i52": "",
      "i53": "",
      "i54": "",
      "i55": "",
      "i56": "",
      "i58": "",
      "i59": "",
      "i60": "",
      "i63": "",
      "i64": "",
      "i65": "",
      "i66": "",
      "i67": ""
    },
    "Fixed Assets Schedule": {
      "Plant and Machinery": { items: [], total: 0 },
      "Service Equipment": { items: [], total: 0 },
      "Shed and Civil Works": { items: [], total: 0 },
      "Land": { items: [], total: 0 },
      "Electrical Items": { items: [], total: 0 },
      "Electronic Items": { items: [], total: 0 },
      "Furniture and Fittings": { items: [], total: 0 },
      "Vehicles": { items: [], total: 0 },
      "Live Stock": { items: [], total: 0 },
      "Other Assets": { items: [], total: 0 },
      "Other Assets (Including Amortisable Assets)": { items: [], total: 0 }
    }
  });
  
  const [showResult, setShowResult] = useState(false);
  const [finalJson, setFinalJson] = useState(null);
  const [activeAssetTab, setActiveAssetTab] = useState(0);

  useEffect(() => {
    if (initialData && isEditMode) {
      console.log('📝 [FRCC2Form] Loading initial data for edit mode:', initialData);
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
  }, []);

  const updateFixedAssetCategory = useCallback((categoryName, items) => {
    const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData(prev => ({
      ...prev,
      "Fixed Assets Schedule": {
        ...prev["Fixed Assets Schedule"],
        [categoryName]: { items, total }
      }
    }));
  }, []);

  const addFixedAssetItem = useCallback((categoryName) => {
    setFormData(prev => {
      const currentItems = prev["Fixed Assets Schedule"][categoryName]?.items || [];
      const newItems = [...currentItems, { description: '', amount: 0 }];
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        "Fixed Assets Schedule": {
          ...prev["Fixed Assets Schedule"],
          [categoryName]: { items: newItems, total }
        }
      };
    });
  }, []);

  const removeFixedAssetItem = useCallback((categoryName, index) => {
    setFormData(prev => {
      const currentItems = prev["Fixed Assets Schedule"][categoryName]?.items || [];
      const newItems = currentItems.filter((_, i) => i !== index);
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        "Fixed Assets Schedule": {
          ...prev["Fixed Assets Schedule"],
          [categoryName]: { items: newItems, total }
        }
      };
    });
  }, []);

  const updateFixedAssetItem = useCallback((categoryName, index, field, value) => {
    setFormData(prev => {
      const currentItems = [...(prev["Fixed Assets Schedule"][categoryName]?.items || [])];
      currentItems[index] = { ...currentItems[index], [field]: value };
      const total = currentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        "Fixed Assets Schedule": {
          ...prev["Fixed Assets Schedule"],
          [categoryName]: { items: currentItems, total }
        }
      };
    });
  }, []);

  const fillTestData = useCallback(() => {
    setFormData({
      "General Information": {
        "i3": "MEDICAID LABS LLP",
        "i4": "LLP",
        "i5": "N Apuroop",
        "i6": "Autonagar, Vijayawada, Andhra Pradesh - 520001",
        "i7": "Trading sector",
        "i8": "Trading in Pharmaceutical Products"
      },
      "Means of Finance": {
        "i10": "No",
        "i11": 10000000,
        "h12": 12,
        "h13": 1,
        "h14": 15
      },
      "Financial Years": {
        "i16": "2024-25",
        "i17": "Apr to Sept 2025-26",
        "i18": "2025-26",
        "i19": "2026-27",
        "i20": "2027-28"
      },
      "Audited Financial Statements": {
        "i22": 67000000,
        "i23": 12000000,
        "i24": 43000000,
        "i25": 13000000,
        "i26": 50000,
        "i27": 150000,
        "i28": 300000,
        "i29": 600000,
        "i30": 3000000,
        "i31": 800000,
        "i32": 5800000,
        "i34": 8000000,
        "i35": 10000000,
        "i36": 5000000,
        "i37": 2000000,
        "i40": 1000000,
        "i41": 5500000,
        "i42": 500000,
        "i43": 2000000
      },
      "Provisional Financial Statements": {
        "i45": 6,
        "i46": 35000000,
        "i47": 13000000,
        "i48": 22000000,
        "i49": 13500000,
        "i50": 25000,
        "i51": 75000,
        "i52": 150000,
        "i53": 300000,
        "i54": 1500000,
        "i55": 400000,
        "i56": 3000000,
        "i58": 10000000,
        "i59": 9500000,
        "i60": 5500000,
        "i63": 2075000,
        "i64": 1000000,
        "i65": 2900000,
        "i66": 1750000,
        "i67": 2500000
      },
      "Fixed Assets Schedule": {
        "Plant and Machinery": {
          items: [
            { description: "Packaging Machine", amount: 800000 },
            { description: "Conveyor System", amount: 300000 }
          ],
          total: 1100000
        },
        "Service Equipment": {
          items: [{ description: "Air Conditioners", amount: 200000 }],
          total: 200000
        },
        "Shed and Civil Works": {
          items: [{ description: "Warehouse Building", amount: 500000 }],
          total: 500000
        },
        "Land": { items: [], total: 0 },
        "Electrical Items": { items: [], total: 0 },
        "Electronic Items": { items: [], total: 0 },
        "Furniture and Fittings": {
          items: [{ description: "Office Furniture", amount: 350000 }],
          total: 350000
        },
        "Vehicles": { items: [], total: 0 },
        "Live Stock": { items: [], total: 0 },
        "Other Assets": { items: [], total: 0 },
        "Other Assets (Including Amortisable Assets)": { items: [], total: 0 }
      }
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      const excelData = convertToExcelData(formData);
      onSubmit({
        formData: { excelData, formData },
        templateId: templateId || 'frcc2',
        reportId
      });
    }
  }, [formData, onSubmit, templateId, reportId]);

  const convertToExcelData = (data) => {
    const excelData = {};
    
    excelData['i3'] = data['General Information']['i3'];
    excelData['i4'] = data['General Information']['i4'];
    excelData['i5'] = data['General Information']['i5'];
    excelData['i6'] = data['General Information']['i6'];
    excelData['i7'] = data['General Information']['i7'];
    excelData['i8'] = data['General Information']['i8'];
    
    excelData['i10'] = data['Means of Finance']['i10'];
    excelData['i11'] = data['Means of Finance']['i11'];
    excelData['h12'] = data['Means of Finance']['h12'];
    excelData['h13'] = data['Means of Finance']['h13'];
    excelData['h14'] = data['Means of Finance']['h14'];
    
    excelData['i16'] = data['Financial Years']['i16'];
    excelData['i17'] = data['Financial Years']['i17'];
    excelData['i18'] = data['Financial Years']['i18'];
    excelData['i19'] = data['Financial Years']['i19'];
    excelData['i20'] = data['Financial Years']['i20'];
    
    excelData['i22'] = data['Audited Financial Statements']['i22'];
    excelData['i23'] = data['Audited Financial Statements']['i23'];
    excelData['i24'] = data['Audited Financial Statements']['i24'];
    excelData['i25'] = data['Audited Financial Statements']['i25'];
    excelData['i26'] = data['Audited Financial Statements']['i26'];
    excelData['i27'] = data['Audited Financial Statements']['i27'];
    excelData['i28'] = data['Audited Financial Statements']['i28'];
    excelData['i29'] = data['Audited Financial Statements']['i29'];
    excelData['i30'] = data['Audited Financial Statements']['i30'];
    excelData['i31'] = data['Audited Financial Statements']['i31'];
    excelData['i32'] = data['Audited Financial Statements']['i32'];
    excelData['i34'] = data['Audited Financial Statements']['i34'];
    excelData['i35'] = data['Audited Financial Statements']['i35'];
    excelData['i36'] = data['Audited Financial Statements']['i36'];
    excelData['i37'] = data['Audited Financial Statements']['i37'];
    excelData['i40'] = data['Audited Financial Statements']['i40'];
    excelData['i41'] = data['Audited Financial Statements']['i41'];
    excelData['i42'] = data['Audited Financial Statements']['i42'];
    excelData['i43'] = data['Audited Financial Statements']['i43'];
    
    excelData['i45'] = data['Provisional Financial Statements']['i45'];
    excelData['i46'] = data['Provisional Financial Statements']['i46'];
    excelData['i47'] = data['Provisional Financial Statements']['i47'];
    excelData['i48'] = data['Provisional Financial Statements']['i48'];
    excelData['i49'] = data['Provisional Financial Statements']['i49'];
    excelData['i50'] = data['Provisional Financial Statements']['i50'];
    excelData['i51'] = data['Provisional Financial Statements']['i51'];
    excelData['i52'] = data['Provisional Financial Statements']['i52'];
    excelData['i53'] = data['Provisional Financial Statements']['i53'];
    excelData['i54'] = data['Provisional Financial Statements']['i54'];
    excelData['i55'] = data['Provisional Financial Statements']['i55'];
    excelData['i56'] = data['Provisional Financial Statements']['i56'];
    excelData['i58'] = data['Provisional Financial Statements']['i58'];
    excelData['i59'] = data['Provisional Financial Statements']['i59'];
    excelData['i60'] = data['Provisional Financial Statements']['i60'];
    excelData['i63'] = data['Provisional Financial Statements']['i63'];
    excelData['i64'] = data['Provisional Financial Statements']['i64'];
    excelData['i65'] = data['Provisional Financial Statements']['i65'];
    excelData['i66'] = data['Provisional Financial Statements']['i66'];
    excelData['i67'] = data['Provisional Financial Statements']['i67'];
    
    const fixedAssetsMapping = {
      "Plant and Machinery": { headerRow: 121, dataStartRow: 121, maxItems: 10 },
      "Service Equipment": { headerRow: 131, dataStartRow: 131, maxItems: 10 },
      "Shed and Civil Works": { headerRow: 141, dataStartRow: 141, maxItems: 10 },
      "Land": { headerRow: 151, dataStartRow: 151, maxItems: 3 },
      "Electrical Items": { headerRow: 154, dataStartRow: 154, maxItems: 9 },
      "Electronic Items": { headerRow: 164, dataStartRow: 164, maxItems: 9 },
      "Furniture and Fittings": { headerRow: 173, dataStartRow: 173, maxItems: 10 },
      "Vehicles": { headerRow: 183, dataStartRow: 183, maxItems: 10 },
      "Live Stock": { headerRow: 193, dataStartRow: 193, maxItems: 9 },
      "Other Assets": { headerRow: 202, dataStartRow: 202, maxItems: 10 },
      "Other Assets (Including Amortisable Assets)": { headerRow: 212, dataStartRow: 212, maxItems: 10 }
    };

    if (data['Fixed Assets Schedule']) {
      Object.entries(data['Fixed Assets Schedule']).forEach(([categoryName, categoryData]) => {
        const mapping = fixedAssetsMapping[categoryName];
        if (mapping && categoryData.items && Array.isArray(categoryData.items)) {
          excelData[`b${mapping.headerRow}`] = categoryName;
          
          categoryData.items.slice(0, mapping.maxItems).forEach((item, index) => {
            const row = mapping.dataStartRow + index;
            if (item.description) {
              excelData[`d${row}`] = item.description;
            }
            if (item.amount !== undefined && item.amount !== null) {
              excelData[`e${row}`] = parseFloat(item.amount) || 0;
            }
          });
        }
      });
    }
    
    return excelData;
  };

  const validateCurrentSection  = useCallback(() => {
    const currentSection = sections[currentStep];
    
    if (currentSection.key === 'fixed') {
      return true;
    }
    
    if (currentSection.key === 'financial-statements') {
      const auditedData = formData["Audited Financial Statements"];
      const provisionalData = formData["Provisional Financial Statements"];
      
      for (const field of currentSection.fields) {
        const value = provisionalData[field.id];
        if (field.required && (value === '' || value === null || value === undefined)) {
          return false;
        }
      }
      
      for (const field of currentSection.audited.fields) {
        if (field.type !== 'computed') {
          const value = auditedData[field.id];
          if (field.required && (value === '' || value === null || value === undefined)) {
            return false;
          }
        }
      }
      
      for (const field of currentSection.provisional.fields) {
        if (field.type !== 'computed') {
          const value = provisionalData[field.id];
          if (field.required && (value === '' || value === null || value === undefined)) {
            return false;
          }
        }
      }
      
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

  const nextStep = () => {
    goToNextStep();
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
            onChange={(e) => updateField(sectionTitle, field.id, e.target.value)}
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
            onChange={(e) => updateField(sectionTitle, field.id, e.target.value)}
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
          onChange={(e) => updateField(sectionTitle, field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
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
    
    const categoryData = formData["Fixed Assets Schedule"][currentCategory.title] || { items: [], total: 0 };
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveAssetTab(idx)}
              type="button"
              className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${
                activeAssetTab === idx 
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
            Format CC2 - Credit Card Application Form
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
            {currentSection.key === 'financial-statements' ? (
              <>
                <div className="mb-6">
                  {currentSection.fields.map(field => renderField(field, "Provisional Financial Statements"))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-bold text-gray-800 mb-3">
                      {currentSection.audited.title}
                    </h3>
                    {currentSection.audited.subtitle && (
                      <p className="text-xs text-gray-600 mb-4">{currentSection.audited.subtitle}</p>
                    )}
                    <div className="space-y-3">
                      {currentSection.audited.fields.map(field => renderField(field, "Audited Financial Statements"))}
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-bold text-gray-800 mb-3">
                      {currentSection.provisional.title}
                    </h3>
                    {currentSection.provisional.subtitle && (
                      <p className="text-xs text-gray-600 mb-4">{currentSection.provisional.subtitle}</p>
                    )}
                    <div className="space-y-3">
                      {currentSection.provisional.fields.map(field => renderField(field, "Provisional Financial Statements"))}
                    </div>
                  </div>
                </div>
              </>
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
              className="px-5 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-300 font-medium text-sm flex items-center gap-1" 
              onClick={nextStep}
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

export default FRCC2Form;


