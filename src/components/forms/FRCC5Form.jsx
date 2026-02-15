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

// CORRECTED Fixed Assets Mapping - Matches Excel Template Exactly
const fixedAssetsMapping = {
  "Plant and Machinery": { dataStartRow: 99, maxItems: 10 },        // 99-108
  "Service Equipment": { dataStartRow: 109, maxItems: 10 },         // 109-118
  "Shed and Civil works": { dataStartRow: 119, maxItems: 10 },      // 119-128
  "Land": { dataStartRow: 129, maxItems: 3 },                       // 129-131
  "Electrical Items": { dataStartRow: 132, maxItems: 9 },           // 132-140
  "Electronic items": { dataStartRow: 141, maxItems: 10 },          // 141-150
  "Furniture and Fittings": { dataStartRow: 151, maxItems: 10 },    // 151-160
  "Vehicles": { dataStartRow: 161, maxItems: 10 },                  // 161-170
  "Live stock": { dataStartRow: 171, maxItems: 9 },                 // 171-179
  "Other Assets": { dataStartRow: 180, maxItems: 10 },              // 180-189
  "Other Assets (Including Amortisable Assets)": { dataStartRow: 190, maxItems: 10 } // 190-199
};


const generateFinancialYearOptions = () => {
  const options = [];
  for (let start = 2024; start <= 2033; start++) {
    options.push(`${start}-${(start + 1).toString().slice(-2)}`);
  }
  return options;
};

const validateFixedAssetsData = (formData) => {
  const errors = [];

  Object.keys(fixedAssetsMapping).forEach(categoryTitle => {
    const mapping = fixedAssetsMapping[categoryTitle];
    const categoryData = formData['Fixed Assets Schedule'][categoryTitle];

    if (categoryData && categoryData.items) {
      if (categoryData.items.length > mapping.maxItems) {
        errors.push(`${categoryTitle} exceeds maximum items (${mapping.maxItems})`);
      }

      categoryData.items.forEach((item, idx) => {
        if (item.description && item.description.trim() !== '' && !item.amount) {
          errors.push(`${categoryTitle} - Item ${idx + 1}: Missing amount`);
        }
        if (!item.description && item.amount && item.amount > 0) {
          errors.push(`${categoryTitle} - Item ${idx + 1}: Missing description`);
        }
      });
    }
  });

  return errors;
};

const FRCC5Form = ({
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
    'Audited Financial Statements': initialData['Audited Financial Statements'] || {},
    'Fixed Assets Schedule': initialData['Fixed Assets Schedule'] || {
      'Plant and Machinery': { items: [], total: 0 },
      'Service Equipment': { items: [], total: 0 },
      'Shed and Civil works': { items: [], total: 0 },
      'Land': { items: [], total: 0 },
      'Electrical Items': { items: [], total: 0 },
      'Electronic items': { items: [], total: 0 },
      'Furniture and Fittings': { items: [], total: 0 },
      'Vehicles': { items: [], total: 0 },
      'Live stock': { items: [], total: 0 },
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
        { id: 'i3', label: 'Name of Firm', type: 'text', required: true, note: 'Enter your company/firm name' },
        { id: 'i4', label: 'Status of Concern', type: 'select', options: ['Soleproprietorship', 'Partnership', 'LLP', 'Company'], required: true, note: 'Select business structure' },
        { id: 'i5', label: 'Proprietor / MP / MD Name', type: 'text', required: true, note: 'Enter owner/managing partner name' },
        { id: 'bank_name', label: 'Bank Name / Department Name', type: 'text', required: true, note: 'Enter bank or department name' },
        { id: 'branch_name', label: 'Branch Name', type: 'text', required: true, note: 'Enter branch name' },
        { id: 'i6', label: 'Firm Address', type: 'textarea', required: true, note: 'Enter complete business address' },
        { id: 'i7', label: 'Sector', type: 'select', options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true, note: 'Select your primary business sector' },
        { id: 'i8', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' },
        { id: 'i8', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' }
      ]
    },
    {
      key: 'finance',
      title: 'Means of Finance',
      icon: CurrencyDollarIcon,
      fields: [
        { id: 'i10', label: 'Do you have existing working capital limit?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you have existing loan' },
        { id: 'i11', label: 'Are you going for Working capital limit Topup from present limit?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you need top-up' },
        { id: 'i12', label: 'Working capital Loan requirement (Existing)', type: 'number', min: 0, required: true, note: 'Existing loan amount in rupees' },
        { id: 'i13', label: 'Working capital Loan requirement (Top up)', type: 'number', min: 0, required: true, note: 'Top-up loan amount in rupees' },
        { id: 'h14', label: 'Working capital loan interest', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Annual interest rate' },
        { id: 'h15', label: 'Processing fees (Including GST)(%)', type: 'number', min: 0, step: 0.01, required: true, note: 'Processing fee percentage' },
        { id: 'h16', label: 'Working capital (% on Turnover)', type: 'number', min: 15, max: 100, step: 0.01, required: true, note: 'Working capital as % of turnover' }
      ]
    },
    {
      key: 'years',
      title: 'Financial Years',
      icon: CalendarIcon,
      fields: [
        { id: 'i18', label: '1st Financial year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select first year' },
        { id: 'i19', label: '2nd Financial year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select second year' },
        { id: 'i20', label: '3rd Financial year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select third year' },
        { id: 'i21', label: '4th Financial year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select fourth year' }
      ]
    },
    {
      key: 'audited',
      title: 'Audited Financial Statements',
      icon: ChartBarIcon,
      fields: [
        { id: 'i23', label: 'Turnover', type: 'number', min: 0, required: true, note: 'Annual turnover' },
        { id: 'i24', label: 'Opening Stock', type: 'number', min: 0, required: true, note: 'Stock at beginning' },
        { id: 'i25', label: 'Direct Material & Expenses', type: 'number', min: 0, required: true, note: 'Cost of materials' },
        { id: 'i26', label: 'Closing Stock', type: 'number', min: 0, required: true, note: 'Stock at end' },
        { id: 'i27', label: 'Non Operating Income', type: 'number', min: 0, required: true, note: 'Other income' },
        { id: 'i28', label: 'Electricity (If not included in Direct Expenses)', type: 'number', min: 0, required: true, note: 'Power charges' },
        { id: 'i29', label: 'Depreciation', type: 'number', min: 0, required: true, note: 'Depreciation expense' },
        { id: 'i30', label: 'Rent', type: 'number', min: 0, required: true, note: 'Annual rent paid' },
        { id: 'i31', label: 'Salaries & Wages', type: 'number', min: 0, required: true, note: 'Total salaries and wages' },
        { id: 'i32', label: 'Processing fees (Including GST)(%)', type: 'number', min: 0, required: true, note: 'Processing fees paid' },
        { id: 'i33', label: 'Interest on CC / OD Loan', type: 'number', min: 0, required: true, note: 'Interest on cash credit/overdraft' },
        { id: 'i34', label: 'Interest on Other loans', type: 'number', min: 0, required: true, note: 'Interest on term loans' },
        { id: 'i35', label: 'Net Profit Before Tax', type: 'number', required: true, note: 'Net profit before tax' },
        { id: 'i37', label: 'Net Capital (Opening capital +Net Profit -Drawings)', type: 'number', min: 0, required: true, note: 'Net capital at year end' },
        { id: 'i38', label: 'Term Loans (Secured and Unsecured Loans Total)', type: 'number', min: 0, required: true, note: 'Outstanding term loans' },
        { id: 'i39', label: 'CC Loan Outstanding', type: 'number', min: 0, required: true, note: 'Cash credit outstanding' },
        { id: 'i40', label: 'Other Current Liabilities', type: 'number', min: 0, required: true, note: 'Other current liabilities' },
        { id: 'i44', label: 'Investments', type: 'number', min: 0, required: true, note: 'Investments held' },
        { id: 'i45', label: 'Debtors', type: 'number', min: 0, required: true, note: 'Accounts receivable' },
        { id: 'i46', label: 'Cash and Cash Equivalents', type: 'number', min: 0, required: true, note: 'Cash and bank balances' },
        { id: 'i47', label: 'Other Current Assets if any', type: 'number', min: 0, required: true, note: 'Other current assets' }
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
      console.log('📝 Loading initial data for edit mode');
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
      const mapping = fixedAssetsMapping[categoryName];

      if (currentItems.length >= mapping.maxItems) {
        alert(`Maximum ${mapping.maxItems} items allowed for ${categoryName}`);
        return prev;
      }

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
        'i3': 'Global Traders LLP',
        'i4': 'LLP',
        'i5': 'Jane Smith',
        'bank_name': 'HDFC Bank',
        'branch_name': 'Corporate Branch',
        'i6': 'Commercial Hub, Metro City - 600001',
        'i7': 'Trading sector',
        'i8': 'Trading in Consumer Goods'
      },
      'Means of Finance': {
        'i10': 'Yes',
        'i11': 'No',
        'i12': 150000000,
        'i13': 500000,
        'h14': 10.5,
        'h15': 0.8,
        'h16': 20
      },
      'Financial Years': {
        'i18': '2024-25',
        'i19': '2025-26',
        'i20': '2026-27',
        'i21': '2027-28'
      },
      'Audited Financial Statements': {
        'i23': 45000000, 'i24': 18000000, 'i25': 55000000,
        'i26': 20000000, 'i27': 80000, 'i28': 250000,
        'i29': 400000, 'i30': 150000, 'i31': 4000000,
        'i32': 1000000, 'i33': 7000000, 'i34': 500000,
        'i35': 12000000, 'i37': 1500000, 'i38': 7000000,
        'i39': 2800000, 'i40': 800000, 'i44': 600000,
        'i45': 1000000, 'i46': 500000, 'i47': 200000
      },
      'Fixed Assets Schedule': {
        'Plant and Machinery': {
          items: [
            { description: 'Drilling Machine', amount: 120000 },
            { description: 'Lathe Machine', amount: 95000 },
            { description: 'CNC Machine', amount: 350000 },
            { description: 'Hydraulic Press', amount: 175000 },
            { description: 'Cutting Machine', amount: 80000 },
            { description: 'Welding Machine', amount: 60000 },
            { description: 'Air Compressor', amount: 50000 },
            { description: 'Milling Machine', amount: 110000 },
            { description: 'Packaging Line', amount: 200000 }
          ],
          total: 1240000
        },
        'Service Equipment': {
          items: [
            { description: 'Compressor Unit', amount: 45000 },
            { description: 'Service Pump', amount: 30000 },
            { description: 'Tool Kit Set', amount: 15000 },
            { description: 'Pressure Washer', amount: 25000 },
            { description: 'Vacuum Cleaner', amount: 12000 },
            { description: 'Diagnostic Tool', amount: 40000 },
            { description: 'Maintenance Bench', amount: 22000 },
            { description: 'Lifting Jack', amount: 35000 },
            { description: 'Air Blower', amount: 8000 },
            { description: 'Grease Pump', amount: 10000 }
          ],
          total: 242000
        },
        'Shed and Civil works': {
          items: [
            { description: 'Main Factory Shed', amount: 850000 },
            { description: 'Office Block', amount: 350000 },
            { description: 'Warehouse', amount: 420000 },
            { description: 'Compound Wall', amount: 125000 },
            { description: 'Water Drainage', amount: 75000 },
            { description: 'Security Cabin', amount: 55000 },
            { description: 'Road Pavement', amount: 95000 },
            { description: 'Painting and Flooring', amount: 65000 },
            { description: 'Roof Structure', amount: 140000 },
            { description: 'Restroom Construction', amount: 40000 }
          ],
          total: 2215000
        },
        'Land': {
          items: [
            { description: 'Industrial Plot', amount: 2000000 },
            { description: 'Parking Area', amount: 150000 },
            { description: 'Boundary Wall', amount: 80000 }
          ],
          total: 2230000
        },
        'Electrical Items': {
          items: [
            { description: 'Main Transformer', amount: 120000 },
            { description: 'Wiring and Cabling', amount: 40000 },
            { description: 'Control Panel', amount: 55000 },
            { description: 'UPS System', amount: 35000 },
            { description: 'Inverter', amount: 25000 },
            { description: 'Switchboards', amount: 18000 },
            { description: 'LED Lighting System', amount: 30000 },
            { description: 'CCTV Wiring', amount: 10000 },
            { description: 'Generator', amount: 90000 },
          ],
          total: 438000
        },
        'Electronic items': {
          items: [
            { description: 'Desktop Computers', amount: 60000 },
            { description: 'Printer', amount: 12000 },
            { description: 'Scanner', amount: 8000 },
            { description: 'Router and Modem', amount: 7000 },
            { description: 'Smart TV', amount: 35000 },
            { description: 'CCTV Camera', amount: 15000 },
            { description: 'Projector', amount: 25000 },
            { description: 'Server System', amount: 90000 },
            { description: 'Tablets', amount: 18000 },
            { description: 'Wireless Devices', amount: 10000 }
          ],
          total: 280000
        },
        'Furniture and Fittings': {
          items: [
            { description: 'Office Chairs', amount: 12000 },
            { description: 'Executive Desk', amount: 18000 },
            { description: 'Conference Table', amount: 25000 },
            { description: 'Storage Cabinets', amount: 10000 },
            { description: 'Display Units', amount: 15000 },
            { description: 'Partitions', amount: 9000 },
            { description: 'Reception Desk', amount: 18000 },
            { description: 'Visitor Sofa', amount: 20000 },
            { description: 'Cupboards', amount: 8000 },
            { description: 'Book Shelf', amount: 7000 }
          ],
          total: 142000
        },
        'Vehicles': {
          items: [
            { description: 'Company Car', amount: 600000 },
            { description: 'Delivery Van', amount: 850000 },
            { description: 'Forklift', amount: 300000 },
            { description: 'Pickup Truck', amount: 450000 },
            { description: 'Bike', amount: 90000 },
            { description: 'Tractor', amount: 275000 },
            { description: 'Mini Truck', amount: 350000 },
            { description: 'Auto Loader', amount: 180000 },
            { description: 'Electric Vehicle', amount: 400000 },
            { description: 'Spare Van', amount: 250000 }
          ],
          total: 3745000
        },
        'Live stock': {
          items: [
            { description: 'Cows', amount: 40000 },
            { description: 'Goats', amount: 15000 },
            { description: 'Sheep', amount: 12000 },
            { description: 'Buffaloes', amount: 60000 },
            { description: 'Horses', amount: 80000 },
            { description: 'Pigs', amount: 10000 },
            { description: 'Chickens', amount: 5000 },
            { description: 'Fish Stock', amount: 7000 },
            { description: 'Beehives', amount: 3000 }
          ],
          total: 232000
        },
        'Other Assets': {
          items: [
            { description: 'Air Conditioner', amount: 35000 },
            { description: 'Water Cooler', amount: 12000 },
            { description: 'Inverter Battery', amount: 10000 },
            { description: 'Time Attendance Machine', amount: 7000 },
            { description: 'Fire Extinguisher', amount: 5000 },
            { description: 'Projector', amount: 20000 },
            { description: 'Printer', amount: 9000 },
            { description: 'Router', amount: 4000 },
            { description: 'Speaker System', amount: 6000 },
            { description: 'Heater', amount: 3000 }
          ],
          total: 111000
        },
        'Other Assets (Including Amortisable Assets)': {
          items: [
            { description: 'Software License', amount: 25000 },
            { description: 'Patent Rights', amount: 15000 },
            { description: 'Trademark Registration', amount: 10000 },
            { description: 'Copyrights', amount: 12000 },
            { description: 'Brand Value', amount: 30000 },
            { description: 'Franchise Rights', amount: 20000 },
            { description: 'Goodwill', amount: 40000 },
            { description: 'Insurance Deposit', amount: 5000 },
            { description: 'Deferred Tax Asset', amount: 8000 },
            { description: 'Security Deposit', amount: 15000 }
          ],
          total: 180000
        }
      },
      'Prepared By': {
        'j136': 'Partner One',
        'j137': 'Partner Two',
        'j138': '9876543210'
      }
    });
  }, []);

  const convertToExcelData = (data) => {
    const excelData = {};

    excelData['i3'] = data['General Information']['i3'];
    excelData['i4'] = data['General Information']['i4'];
    excelData['i5'] = data['General Information']['i5'];
    excelData['i6'] = data['General Information']['i6'];
    excelData['i7'] = data['General Information']['i7'];
    excelData['i8'] = data['General Information']['i8'];

    excelData['j136'] = data['Prepared By']?.['j136'];
    excelData['j137'] = data['Prepared By']?.['j137'];
    excelData['j138'] = data['Prepared By']?.['j138'];

    excelData['i10'] = data['Means of Finance']['i10'];
    excelData['i11'] = data['Means of Finance']['i11'];
    excelData['i12'] = data['Means of Finance']['i12'];
    excelData['i13'] = data['Means of Finance']['i13'];
    excelData['h14'] = data['Means of Finance']['h14'];
    excelData['h15'] = data['Means of Finance']['h15'];
    excelData['h16'] = data['Means of Finance']['h16'];

    excelData['i18'] = data['Financial Years']['i18'];
    excelData['i19'] = data['Financial Years']['i19'];
    excelData['i20'] = data['Financial Years']['i20'];
    excelData['i21'] = data['Financial Years']['i21'];

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
    excelData['i33'] = data['Audited Financial Statements']['i33'];
    excelData['i34'] = data['Audited Financial Statements']['i34'];
    excelData['i35'] = data['Audited Financial Statements']['i35'];
    excelData['i37'] = data['Audited Financial Statements']['i37'];
    excelData['i38'] = data['Audited Financial Statements']['i38'];
    excelData['i39'] = data['Audited Financial Statements']['i39'];
    excelData['i40'] = data['Audited Financial Statements']['i40'];
    excelData['i44'] = data['Audited Financial Statements']['i44'];
    excelData['i45'] = data['Audited Financial Statements']['i45'];
    excelData['i46'] = data['Audited Financial Statements']['i46'];
    excelData['i47'] = data['Audited Financial Statements']['i47'];

    console.log('🔧 Converting Fixed Assets to Excel Data...');

    Object.keys(fixedAssetsMapping).forEach(categoryTitle => {
      const mapping = fixedAssetsMapping[categoryTitle];
      const categoryData = data['Fixed Assets Schedule'][categoryTitle];

      if (categoryData && categoryData.items) {
        const itemsToProcess = categoryData.items.slice(0, mapping.maxItems);

        itemsToProcess.forEach((item, index) => {
          const row = mapping.dataStartRow + index;

          if (item.description && item.description.trim() !== '') {
            excelData[`d${row}`] = item.description.trim();
            excelData[`e${row}`] = parseFloat(item.amount) || 0;

            console.log(`✅ ${categoryTitle} [Row ${row}]: ${item.description} = ₹${item.amount}`);
          }
        });

        console.log(`📊 ${categoryTitle}: Processed ${itemsToProcess.length}/${mapping.maxItems} items (Rows ${mapping.dataStartRow}-${mapping.dataStartRow + mapping.maxItems - 1})`);
      }
    });

    const fixedAssetKeys = Object.keys(excelData).filter(key => key.startsWith('d') || key.startsWith('e'));



    return excelData;
  };

  const handleSubmit = useCallback(async () => {
    try {
      console.log('🚀 Starting form submission...');

      const validationErrors = validateFixedAssetsData(formData);

      if (validationErrors.length > 0) {
        console.error('❌ Validation Errors:', validationErrors);
        alert('Validation Errors:\n\n' + validationErrors.join('\n'));
        return;
      }

      console.log('✅ Validation passed');

      const excelData = convertToExcelData(formData);

      console.log('📊 Excel Data Summary:', {
        totalKeys: Object.keys(excelData).length,
        generalInfo: Object.keys(excelData).filter(k => k.startsWith('i') && parseInt(k.substring(1)) < 10).length,
        finance: Object.keys(excelData).filter(k => (k.startsWith('i') || k.startsWith('h')) && parseInt(k.substring(1)) >= 10 && parseInt(k.substring(1)) < 18).length,
        years: Object.keys(excelData).filter(k => k.startsWith('i') && parseInt(k.substring(1)) >= 18 && parseInt(k.substring(1)) < 23).length,
        audited: Object.keys(excelData).filter(k => k.startsWith('i') && parseInt(k.substring(1)) >= 23).length,
        fixedAssets: Object.keys(excelData).filter(k => k.startsWith('d') || k.startsWith('e')).length
      });

      console.log('📋 Fixed Assets Summary:',
        Object.keys(fixedAssetsMapping).map(cat => ({
          category: cat,
          items: formData['Fixed Assets Schedule'][cat]?.items?.length || 0,
          total: formData['Fixed Assets Schedule'][cat]?.total || 0,
          startRow: fixedAssetsMapping[cat].dataStartRow,
          endRow: fixedAssetsMapping[cat].dataStartRow + fixedAssetsMapping[cat].maxItems - 1
        }))
      );

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

      console.log('📤 Submitting payload...');
      await onSubmit(payload);
      console.log('✅ Form submitted successfully');

    } catch (error) {
      console.error('❌ Form submission error:', error);
      alert(`Failed to submit form: ${error.message}\n\nPlease check the console for details.`);
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">
                Rows: {currentCategory.dataStartRow} - {currentCategory.dataStartRow + currentCategory.maxItems - 1}
              </span>
              <div className="px-4 py-1.5 bg-gray-900 text-white rounded-lg">
                <span style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-bold">
                  Total: ₹{categoryData.total?.toLocaleString('en-IN') || 0}
                </span>
              </div>
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
            Format CC5 - Credit Assessment Report
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
                    ? 'bg-white text-black border border-gray-900'
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
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-300 font-medium text-sm flex items-center gap-1"
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

export default FRCC5Form;




