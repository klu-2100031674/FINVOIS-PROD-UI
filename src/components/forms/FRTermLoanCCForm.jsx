import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // If we are in Jan/Feb/Mar (months 0, 1, 2), the "current" financial year is still start-year-1
  const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;

  for (let start = startYear; start <= startYear + 10; start++) {
    options.push(`${start}-${(start + 1).toString().slice(-2)}`);
  }
  return options;
};

// Default asset sections (tenure ≤ 7)
const ASSET_SECTIONS_DEFAULT = {
  'Plant and Machinery': { start: 136, end: 145, loanCell: 'k28' },
  'Service Equipment': { start: 146, end: 155, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 156, end: 158, loanCell: 'k30' },
  'Land': { start: 159, end: 168, loanCell: 'k31' },
  'Electrical Items & fittings': { start: 169, end: 178, loanCell: 'k32' },
  'Electronic Items': { start: 179, end: 188, loanCell: 'k33' },
  'Furniture and Fittings': { start: 189, end: 198, loanCell: 'k34' },
  'Vehicles': { start: 199, end: 207, loanCell: 'k35' },
  'Live stock': { start: 208, end: 217, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 218, end: 227, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 228, end: 236, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 237, end: 245, loanCell: 'k39' }
};

// Asset sections for tenure > 7
const ASSET_SECTIONS_TENURE_GT7 = {
  'Plant and Machinery': { start: 148, end: 157, loanCell: 'k28' },
  'Service Equipment': { start: 158, end: 167, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 168, end: 177, loanCell: 'k30' },
  'Land': { start: 178, end: 180, loanCell: 'k31' },
  'Electrical Items & fittings': { start: 181, end: 190, loanCell: 'k32' },
  'Electronic Items': { start: 191, end: 200, loanCell: 'k33' },
  'Furniture and Fittings': { start: 201, end: 210, loanCell: 'k34' },
  'Vehicles': { start: 211, end: 219, loanCell: 'k35' },
  'Live stock': { start: 220, end: 229, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 230, end: 239, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 240, end: 248, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 249, end: 257, loanCell: 'k39' }
};

// Helper function to get correct asset sections based on tenure
const getAssetSections = (tenure) => {
  if (tenure === undefined || tenure === null || tenure <= 7) {
    return ASSET_SECTIONS_DEFAULT;
  }
  return ASSET_SECTIONS_TENURE_GT7;
};

// Default for backward compatibility
const ASSET_SECTIONS = ASSET_SECTIONS_DEFAULT;

const INDIRECT_EXPENSES_DATA_DEFAULT = {
  "Administrative & Office Expenses": [
    { label: "Office rent", d: "d251", e: "e251" },
    { label: "Electricity and water charges", d: "d252", e: "e252" },
    { label: "Telephone, mobile & internet expenses", d: "d253", e: "e253" },
    { label: "Postage and courier charges", d: "d254", e: "e254" },
    { label: "Printing and stationery", d: "d255", e: "e255" },
    { label: "Office maintenance & repairs", d: "d256", e: "e256" },
    { label: "Petrol, Diesel and Gas Charges", d: "d257", e: "e257" },
    { label: "Computer maintenance & AMC", d: "d258", e: "e258" },
    { label: "Legal and professional fees", d: "d259", e: "e259" },
    { label: "Audit fees", d: "d260", e: "e260" },
    { label: "Consultancy charges", d: "d261", e: "e261" },
    { label: "License and registration fees", d: "d262", e: "e262" },
    { label: "Bank charges", d: "d263", e: "e263" },
    { label: "Software subscription fees", d: "d264", e: "e264" },
    { label: "Security expenses", d: "d265", e: "e265" },
    { label: "Office cleaning expenses", d: "d266", e: "e266" },
    { label: "Staff welfare expenses", d: "d267", e: "e267" },
    { label: "Conveyance expenses", d: "d268", e: "e268" },
    { label: "Travelling expenses (non-production staff)", d: "d269", e: "e269" },
    { label: "Meeting & conference expenses", d: "d270", e: "e270" },
    { label: "Other Administrative & Office Expenses", d: "d271", e: "e271" }
  ],
  "Employee Related Expenses": [
    { label: "Provident fund and ESI contribution", d: "d273", e: "e273" },
    { label: "Gratuity and pension", d: "d274", e: "e274" },
    { label: "Staff training and development", d: "d275", e: "e275" },
    { label: "Recruitment expenses", d: "d276", e: "e276" },
    { label: "Employee insurance", d: "d277", e: "e277" },
    { label: "Refreshments & canteen expenses (office staff)", d: "d278", e: "e278" },
    { label: "Other Employee related expenses", d: "d279", e: "e279" }
  ],
  "Selling and Distribution Expenses": [
    { label: "Advertising & publicity", d: "d280", e: "e280" },
    { label: "Sales promotion expenses", d: "d281", e: "e281" },
    { label: "Trade show / exhibition expenses", d: "d282", e: "e282" },
    { label: "Dealer commission", d: "d283", e: "e283" },
    { label: "Freight inward", d: "d284", e: "e284" },
    { label: "Freight and forwarding (outward)", d: "d285", e: "e285" },
    { label: "Packing and delivery expenses", d: "d286", e: "e286" },
    { label: "Customer discounts / rebates", d: "d287", e: "e287" },
    { label: "Warranty & after-sales service expenses", d: "d288", e: "e288" },
    { label: "Bad debts written off", d: "d289", e: "e289" },
    { label: "Business entertainment expenses", d: "d290", e: "e290" },
    { label: "Other Selling and Distribution Expenses", d: "d291", e: "e291" }
  ],
  "General Overheads": [
    { label: "Insurance (office, employee, general liability)", d: "d292", e: "e292" },
    { label: "Repairs & maintenance (non-production)", d: "d293", e: "e293" },
    { label: "Subscription & membership fees", d: "d294", e: "e294" },
    { label: "Vehicle running expenses (admin vehicles)", d: "d295", e: "e295" },
    { label: "Fuel & maintenance for delivery vehicles", d: "d296", e: "e296" },
    { label: "Rent, rates, and taxes (non-factory premises)", d: "d297", e: "e297" },
    { label: "AMC (Annual Maintenance Contracts)", d: "d298", e: "e298" },
    { label: "Other General Overhead expenses", d: "d299", e: "e299" }
  ],
  "Miscellaneous Expenses": [
    { label: "Donation & charity (if not CSR)", d: "d300", e: "e300" },
    { label: "CSR expenses", d: "d301", e: "e301" },
    { label: "Loss on sale of fixed assets", d: "d302", e: "e302" },
    { label: "Provision for doubtful debts", d: "d303", e: "e303" },
    { label: "Entertainment & hospitality", d: "d304", e: "e304" },
    { label: "Gifts and samples", d: "d305", e: "e305" },
    { label: "Internet domain renewal & web hosting", d: "d306", e: "e306" },
    { label: "Miscellaneous expenses", d: "d307", e: "e307" }
  ]
};

// Indirect expenses for tenure > 7 (TERM_LOAN_CC only)
// Row ranges: Admin 263-283, Employee 285-291 (284 is Salaries formula), 
// Selling 292-303, General Overheads 305-311 (304 is Net Total formula), Misc 312-319
const INDIRECT_EXPENSES_DATA_TENURE_GT7 = {
  "Administrative & Office Expenses": [
    // Rows 263-283 (21 items)
    { label: "Bank charges", d: "d263", e: "e263" },
    { label: "Software subscription fees", d: "d264", e: "e264" },
    { label: "Security expenses", d: "d265", e: "e265" },
    { label: "Office cleaning expenses", d: "d266", e: "e266" },
    { label: "Staff welfare expenses", d: "d267", e: "e267" },
    { label: "Conveyance expenses", d: "d268", e: "e268" },
    { label: "Travelling expenses (non-production staff)", d: "d269", e: "e269" },
    { label: "Meeting & conference expenses", d: "d270", e: "e270" },
    { label: "Other Administrative & Office Expenses", d: "d271", e: "e271" },
    { label: "Audit fees", d: "d272", e: "e272" },
    { label: "Provident fund and ESI contribution", d: "d273", e: "e273" },
    { label: "Gratuity and pension", d: "d274", e: "e274" },
    { label: "Staff training and development", d: "d275", e: "e275" },
    { label: "Recruitment expenses", d: "d276", e: "e276" },
    { label: "Employee insurance", d: "d277", e: "e277" },
    { label: "Refreshments & canteen expenses (office staff)", d: "d278", e: "e278" },
    { label: "Other Employee related expenses", d: "d279", e: "e279" },
    { label: "Advertising & publicity", d: "d280", e: "e280" },
    { label: "Sales promotion expenses", d: "d281", e: "e281" },
    { label: "Trade show / exhibition expenses", d: "d282", e: "e282" },
    { label: "Dealer commission", d: "d283", e: "e283" }
  ],
  "Employee Related Expenses": [
    // Rows 285-291 (7 items) - Row 284 is Salaries formula (auto-calculated)
    { label: "Freight and forwarding (outward)", d: "d285", e: "e285" },
    { label: "Packing and delivery expenses", d: "d286", e: "e286" },
    { label: "Customer discounts / rebates", d: "d287", e: "e287" },
    { label: "Warranty & after-sales service expenses", d: "d288", e: "e288" },
    { label: "Bad debts written off", d: "d289", e: "e289" },
    { label: "Business entertainment expenses", d: "d290", e: "e290" },
    { label: "Other Selling and Distribution Expenses", d: "d291", e: "e291" }
  ],
  "Selling and Distribution Expenses": [
    // Rows 292-303 (12 items)
    { label: "Insurance (office, employee, general liability)", d: "d292", e: "e292" },
    { label: "Repairs & maintenance (non-production)", d: "d293", e: "e293" },
    { label: "Subscription & membership fees", d: "d294", e: "e294" },
    { label: "Vehicle running expenses (admin vehicles)", d: "d295", e: "e295" },
    { label: "Fuel & maintenance for delivery vehicles", d: "d296", e: "e296" },
    { label: "Rent, rates, and taxes (non-factory premises)", d: "d297", e: "e297" },
    { label: "AMC (Annual Maintenance Contracts)", d: "d298", e: "e298" },
    { label: "Other General Overhead expenses", d: "d299", e: "e299" },
    { label: "Donation & charity (if not CSR)", d: "d300", e: "e300" },
    { label: "CSR expenses", d: "d301", e: "e301" },
    { label: "Loss on sale of fixed assets", d: "d302", e: "e302" },
    { label: "Provision for doubtful debts", d: "d303", e: "e303" }
  ],
  "General Overheads": [
    // Rows 304-311 (8 items) - Only row 284 is skipped (Salaries formula)
    { label: "Entertainment & hospitality", d: "d304", e: "e304" },
    { label: "Gifts and samples", d: "d305", e: "e305" },
    { label: "Internet domain renewal & web hosting", d: "d306", e: "e306" },
    { label: "Miscellaneous expenses", d: "d307", e: "e307" },
    { label: "Fuel & maintenance for delivery vehicles", d: "d308", e: "e308" },
    { label: "Rent, rates, and taxes (non-factory premises)", d: "d309", e: "e309" },
    { label: "AMC (Annual Maintenance Contracts)", d: "d310", e: "e310" },
    { label: "Other General Overhead expenses", d: "d311", e: "e311" }
  ],
  "Miscellaneous Expenses": [
    // Rows 312-319 (8 items)
    { label: "Donation & charity (if not CSR)", d: "d312", e: "e312" },
    { label: "CSR expenses", d: "d313", e: "e313" },
    { label: "Loss on sale of fixed assets", d: "d314", e: "e314" },
    { label: "Provision for doubtful debts", d: "d315", e: "e315" },
    { label: "Entertainment & hospitality", d: "d316", e: "e316" },
    { label: "Gifts and samples", d: "d317", e: "e317" },
    { label: "Internet domain renewal & web hosting", d: "d318", e: "e318" },
    { label: "Miscellaneous expenses", d: "d319", e: "e319" }
  ]
};

// Helper function to get correct indirect expenses data based on tenure
const getIndirectExpensesData = (tenure) => {
  if (tenure === undefined || tenure === null || tenure <= 7) {
    return INDIRECT_EXPENSES_DATA_DEFAULT;
  }
  return INDIRECT_EXPENSES_DATA_TENURE_GT7;
};

// Default for backward compatibility
const INDIRECT_EXPENSES_DATA = INDIRECT_EXPENSES_DATA_DEFAULT;

const DEFAULT_INITIAL_DATA = {};

const FRTermLoanCCForm = ({
  onSubmit,
  initialData = DEFAULT_INITIAL_DATA,
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null
}) => {
  // Extract initial tenure from initialData if available (for initial render)
  const initialTenure = initialData?.['Means of Finance details']?.i47 !== undefined
    ? parseInt(initialData['Means of Finance details'].i47, 10)
    : null;

  // Track live tenure value from form state
  const [liveTenure, setLiveTenure] = useState(initialTenure);

  // Get the correct asset sections and indirect expenses based on LIVE tenure
  const CURRENT_ASSET_SECTIONS = useMemo(() => getAssetSections(liveTenure), [liveTenure]);
  const CURRENT_INDIRECT_EXPENSES_DATA = useMemo(() => getIndirectExpensesData(liveTenure), [liveTenure]);

  const defaultFormData = useMemo(() => ({
    'General Information': {
      'i7': '', 'i8': '', 'i9': '', 'i10': '', 'i11': '', 'i12': '', 'i13': '',
      'i14': '', 'i15': '', 'i16': '', 'i17': '', 'i18': '', 'i19': '', 'i20': '',
      'i21': '', 'i22': '', 'i23': ''
    },
    'Prepared By': { 'j136': '', 'j137': '', 'j138': '' },
    'Expected Employment Generation': {
      'i24': '', 'j24': '', // Skilled
      'i25': '', 'j25': '', // Semi Skilled
      'i26': '', 'j26': ''  // Unskilled
    },
    'Means of Finance details': {
      'h45': '', 'i46': '', 'i47': '', 'i48': '', 'i49': '',
      'h52': '', 'h53': '',
      'i58': '', 'i59': '', 'i60': '', 'i63': '', 'i76': ''
    },
    'Indirect Expenses Increment': {
      'h71': '', 'h72': '', 'h73': '', 'h74': '', 'h75': ''
    },
    'Cost of Project details': {
      'i40': '',
      'k40': ''
    },
    'Schedule for Indirect Expenses': {} // Will be populated with d/e keys
  }), []);

  const [formData, setFormData] = useState(() => {
    const initialIndirect = {};
    Object.values(CURRENT_INDIRECT_EXPENSES_DATA).flat().forEach(item => {
      initialIndirect[item.d] = item.label;
      initialIndirect[item.e] = 0;
    });

    const mergedData = {
      ...defaultFormData,
      'Schedule for Indirect Expenses': initialIndirect,
      ...initialData
    };

    if (initialData && initialData['Schedule for Indirect Expenses']) {
      mergedData['Schedule for Indirect Expenses'] = {
        ...initialIndirect,
        ...initialData['Schedule for Indirect Expenses']
      };
    }
    return mergedData;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [assetActiveTab, setAssetActiveTab] = useState(0);
  const [indirectActiveTab, setIndirectActiveTab] = useState(0);

  // Loan percentage state for each asset category (maps to K28-K39)
  const [loanPercentages, setLoanPercentages] = useState(() => {
    if (initialData && initialData['Asset Loan Percentages']) {
      return initialData['Asset Loan Percentages'];
    }
    const initialPercentages = {};
    Object.keys(CURRENT_ASSET_SECTIONS).forEach(key => {
      initialPercentages[key] = 0; // Default to 0%
    });
    return initialPercentages;
  });

  // Loan amount state for each asset category (direct entry)
  const [loanAmounts, setLoanAmounts] = useState(() => {
    if (initialData && initialData['Asset Loan Amounts']) {
      return initialData['Asset Loan Amounts'];
    }
    // Default all categories to empty
    const defaults = {};
    Object.keys(CURRENT_ASSET_SECTIONS).forEach(category => {
      defaults[category] = '';
    });
    return defaults;
  });

  // Track visited asset categories
  const [visitedAssetCategories, setVisitedAssetCategories] = useState(new Set([0]));

  // Track categories that have items entered
  const [categoriesWithItems, setCategoriesWithItems] = useState(new Set());

  // Error states for validation
  const [assetValidationErrors, setAssetValidationErrors] = useState({});
  const [generalInfoErrors, setGeneralInfoErrors] = useState({});
  const [meansOfFinanceErrors, setMeansOfFinanceErrors] = useState({});

  const [assetItems, setAssetItems] = useState(() => {
    if (initialData && initialData['Fixed Assets Schedule']) {
      return initialData['Fixed Assets Schedule'];
    }
    const initialAssets = {};
    Object.keys(CURRENT_ASSET_SECTIONS).forEach(key => {
      const section = CURRENT_ASSET_SECTIONS[key];
      initialAssets[key] = {};
      for (let row = section.start; row <= section.end; row++) {
        initialAssets[key][row] = { description: '', amount: '' };
      }
    });
    return initialAssets;
  });

  // Update state if initialData changes (e.g. loaded from API)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      if (initialData['Fixed Assets Schedule']) {
        // Convert and filter assets to match current tenure-based ranges
        const convertedAssets = {};
        Object.keys(CURRENT_ASSET_SECTIONS).forEach(key => {
          const section = CURRENT_ASSET_SECTIONS[key];
          convertedAssets[key] = {};
          for (let row = section.start; row <= section.end; row++) {
            convertedAssets[key][row] = { description: '', amount: '' };
          }
        });

        // Load and validate assets against current tenure-based ranges
        if (initialData['Fixed Assets Schedule'] && typeof initialData['Fixed Assets Schedule'] === 'object') {
          Object.keys(initialData['Fixed Assets Schedule']).forEach(category => {
            const categoryData = initialData['Fixed Assets Schedule'][category];
            const section = CURRENT_ASSET_SECTIONS[category];

            if (!section) return; // Skip unknown categories

            if (categoryData.items) {
              // Old format: convert items array to row-keyed format
              categoryData.items.forEach((item, index) => {
                const row = section.start + index;
                if (row <= section.end) {
                  convertedAssets[category][row] = item;
                }
              });
            } else if (typeof categoryData === 'object') {
              // New format: row-keyed format
              // Filter to ONLY include rows within current tenure-based range
              Object.keys(categoryData).forEach(row => {
                const rowNum = parseInt(row);
                // Only include if row is within valid range for current tenure
                if (rowNum >= section.start && rowNum <= section.end) {
                  convertedAssets[category][rowNum] = categoryData[row];
                }
                // Silently skip rows outside valid range (they belong to different tenure scenario)
              });
            }
          });
        }
        setAssetItems(convertedAssets);
      }

      setFormData(prev => {
        const newData = { ...prev, ...initialData };
        if (initialData['Schedule for Indirect Expenses']) {
          newData['Schedule for Indirect Expenses'] = initialData['Schedule for Indirect Expenses'];
        }
        return newData;
      });

      // Load loan percentages if available
      if (initialData['Asset Loan Percentages']) {
        setLoanPercentages(initialData['Asset Loan Percentages']);
      }
    }
  }, [initialData]);

  // Track previous tenure to detect when it crosses the threshold
  const prevTenureRef = useRef(liveTenure);
  // Track if expenses have been initialized for the current tenure range
  const expensesInitializedForGT7Ref = useRef(false);

  // Reinitialize indirect expenses when tenure changes
  useEffect(() => {
    const prevTenure = prevTenureRef.current;
    const prevIsGT7 = prevTenure !== null && prevTenure > 7;
    const currentIsGT7 = liveTenure !== null && liveTenure > 7;

    console.log('👀 Tenure useEffect triggered:', {
      prevTenure,
      liveTenure,
      prevIsGT7,
      currentIsGT7,
      wasInitializedForGT7: expensesInitializedForGT7Ref.current
    });

    // Skip if liveTenure is null (initial state)
    if (liveTenure === null) {
      prevTenureRef.current = liveTenure;
      return;
    }

    // Reinitialize if:
    // 1. First time entering any tenure (prevTenure is null, liveTenure is not null)
    // 2. Crossing the threshold from ≤7 to >7 or vice versa
    // 3. First time entering tenure > 7 (and expenses haven't been initialized for GT7)
    const shouldReinitialize =
      (prevTenure === null) ||
      (prevTenure !== null && prevIsGT7 !== currentIsGT7) ||
      (currentIsGT7 && !expensesInitializedForGT7Ref.current);

    if (shouldReinitialize) {
      console.log('🔄 Reinitializing indirect expenses for tenure change', {
        prevTenure,
        liveTenure,
        prevIsGT7,
        currentIsGT7,
        wasInitializedForGT7: expensesInitializedForGT7Ref.current
      });

      // Get the new expenses data based on current tenure
      const newExpensesData = getIndirectExpensesData(liveTenure);

      // Reinitialize the expenses with new cell mappings
      const newIndirect = {};
      Object.values(newExpensesData).flat().forEach(item => {
        newIndirect[item.d] = item.label;
        newIndirect[item.e] = 0;
      });

      const totalItems = Object.values(newExpensesData).flat().length;
      console.log('✅ New expenses initialized:', {
        tenure: liveTenure,
        tenureIsGT7: liveTenure > 7,
        totalItems,
        expenseCount: Object.keys(newIndirect).length / 2,
        completeCellCount: Object.keys(newIndirect).length,
        sampleCells: Object.keys(newIndirect).filter(k => k.startsWith('d')).slice(0, 5),
        lastCells: Object.keys(newIndirect).filter(k => k.startsWith('d')).slice(-5)
      });

      setFormData(prev => ({
        ...prev,
        'Schedule for Indirect Expenses': newIndirect
      }));

      // Track that we've initialized for GT7 or reset if not GT7
      expensesInitializedForGT7Ref.current = currentIsGT7;
    }

    prevTenureRef.current = liveTenure;
  }, [liveTenure]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };

      if (Object.keys(generalInfoErrors).length > 0 && section === 'General Information') {
        setGeneralInfoErrors(validateGeneralInformation(updatedData['General Information'] || {}));
      }

      if (Object.keys(meansOfFinanceErrors).length > 0 && section === 'Means of Finance details') {
        setMeansOfFinanceErrors(validateMeansOfFinance(updatedData));
      }

      if (onFormDataChange) {
        onFormDataChange(updatedData);
      }

      return updatedData;
    });

    // Update liveTenure when tenure field (i47) changes
    if (section === 'Means of Finance details' && field === 'i47') {
      const newTenure = value !== '' && value !== null && value !== undefined ? parseInt(value, 10) : null;
      const parsedTenure = isNaN(newTenure) ? null : newTenure;
      console.log('🔢 Tenure field changed:', {
        section,
        field,
        rawValue: value,
        parsedTenure,
        currentLiveTenure: liveTenure
      });
      setLiveTenure(parsedTenure);
    }

  };

  // Get total cost for an asset category
  const getCategoryTotal = (categoryName) => {
    const items = assetItems[categoryName] || {};
    return Object.values(items).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  // Handle loan percentage change and update loan amount
  const handleLoanPercentageChange = (category, value) => {
    // Allow empty string for clearing
    if (value === '' || value === null || value === undefined) {
      setLoanPercentages(prev => ({
        ...prev,
        [category]: ''
      }));
      setLoanAmounts(prev => ({
        ...prev,
        [category]: ''
      }));
      return;
    }
    // Only allow valid numbers
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const percentage = Math.min(100, Math.max(0, numValue));
      setLoanPercentages(prev => ({
        ...prev,
        [category]: percentage
      }));

      // Calculate and set loan amount based on percentage and category total
      const categoryTotal = getCategoryTotal(category);
      if (categoryTotal > 0) {
        const calculatedAmount = (categoryTotal * percentage) / 100;
        setLoanAmounts(prev => ({
          ...prev,
          [category]: calculatedAmount.toFixed(2)
        }));
      } else {
        // Clear loan amount if no total available
        setLoanAmounts(prev => ({
          ...prev,
          [category]: ''
        }));
      }
    }
  };

  // Handle loan amount change and convert to percentage
  const handleLoanAmountChange = (category, amount, total) => {
    // Allow empty string for clearing
    if (amount === '' || amount === null || amount === undefined) {
      setLoanAmounts(prev => ({
        ...prev,
        [category]: ''
      }));
      setLoanPercentages(prev => ({
        ...prev,
        [category]: 0
      }));
      return;
    }

    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && total > 0) {
      // Cap the amount at the total
      const cappedAmount = Math.min(numAmount, total);
      const percentage = (cappedAmount / total) * 100;
      const clampedPercentage = Math.min(100, Math.max(0, percentage));

      setLoanAmounts(prev => ({
        ...prev,
        [category]: numAmount > total ? total.toString() : amount
      }));
      setLoanPercentages(prev => ({
        ...prev,
        [category]: clampedPercentage
      }));
    } else {
      // Invalid input, just update the amount state
      setLoanAmounts(prev => ({
        ...prev,
        [category]: amount
      }));
    }
  };

  // Calculate loan amount from percentage (for display purposes)
  const calculateLoanAmount = (category, total) => {
    const percentage = loanPercentages[category] || 0;
    return (total * percentage) / 100;
  };

  const handleIndirectExpenseChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      'Schedule for Indirect Expenses': {
        ...prev['Schedule for Indirect Expenses'],
        [field]: value
      }
    }));
  };

  const addAssetItem = (category) => {
    const section = CURRENT_ASSET_SECTIONS[category];
    const categoryItems = assetItems[category] || {};
    const maxItems = section.end - section.start + 1;
    const currentFilled = Object.values(categoryItems).filter(item => item.description || item.amount).length;

    if (currentFilled >= maxItems) {
      alert(`Maximum ${maxItems} items allowed for ${category}`);
      return;
    }

    // Find the first empty row
    for (let row = section.start; row <= section.end; row++) {
      if (!categoryItems[row] || (!categoryItems[row].description && !categoryItems[row].amount)) {
        setAssetItems(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            [row]: { description: '', amount: '' }
          }
        }));
        // Track that this category now has items
        setCategoriesWithItems(prev => new Set([...prev, category]));
        break;
      }
    }
  };

  const removeAssetItem = (category, row) => {
    setAssetItems(prev => {
      const newItems = {
        ...prev,
        [category]: {
          ...prev[category],
          [row]: { description: '', amount: '' }
        }
      };

      // Check if category still has items after removal
      const categoryItems = newItems[category];
      let hasItems = false;
      for (const itemKey in categoryItems) {
        const item = categoryItems[itemKey];
        if (item.description && item.description.trim() !== '' || (item.amount && item.amount !== '' && item.amount !== 0 && item.amount !== '0')) {
          hasItems = true;
          break;
        }
      }

      if (!hasItems) {
        setCategoriesWithItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(category);
          return newSet;
        });
      }

      return newItems;
    });
  };

  const updateAssetItem = (category, row, field, value) => {
    setAssetItems(prev => {
      const newItems = {
        ...prev,
        [category]: {
          ...prev[category],
          [row]: {
            ...prev[category][row],
            [field]: value
          }
        }
      };

      // Track categories with items
      const categoryItems = newItems[category];
      let hasItems = false;
      for (const itemKey in categoryItems) {
        const item = categoryItems[itemKey];
        if (item.description && item.description.trim() !== '' || (item.amount && item.amount !== '' && item.amount !== 0 && item.amount !== '0')) {
          hasItems = true;
          break;
        }
      }

      setCategoriesWithItems(prevSet => {
        const newSet = new Set(prevSet);
        if (hasItems) {
          newSet.add(category);
        } else {
          newSet.delete(category);
        }
        return newSet;
      });

      return newItems;
    });
  };

  const handleSubmit = () => {
    // Extract tenure for conditional row mapping
    const tenure = parseInt(formData['Means of Finance details']?.['i47'] || 0);
    const isTenureGT7 = tenure > 7;

    console.log('🔍 handleSubmit: tenure =', tenure, ', isTenureGT7 =', isTenureGT7);

    // Remap assets based on tenure at submission time
    const convertedAssets = {};

    Object.keys(assetItems).forEach(category => {
      const categoryItems = assetItems[category];
      const tenureGT7Section = ASSET_SECTIONS_TENURE_GT7[category];
      const defaultSection = ASSET_SECTIONS_DEFAULT[category];

      convertedAssets[category] = {};

      Object.keys(categoryItems)
        .sort((a, b) => a - b)
        .forEach(row => {
          const rowNum = parseInt(row);
          const item = categoryItems[row];

          if (item.description || item.amount) {
            let targetRow = rowNum;

            if (isTenureGT7) {
              // Check if row is in DEFAULT range (tenure ≤ 7) - needs remapping
              const isInDefaultRange = rowNum >= defaultSection.start && rowNum <= defaultSection.end;
              // Check if row is already in TENURE_GT7 range - no remapping needed
              const isInTenureGT7Range = rowNum >= tenureGT7Section.start && rowNum <= tenureGT7Section.end;

              if (isInDefaultRange && !isInTenureGT7Range) {
                // User entered in old range - remap to new range
                const offset = rowNum - defaultSection.start;
                targetRow = tenureGT7Section.start + offset;
                console.log(`✓ Asset remapped: ${category} row ${rowNum} → ${targetRow}`);
              } else if (isInTenureGT7Range) {
                // Already in tenure > 7 range - keep as is
                console.log(`✓ Asset kept as-is: ${category} row ${rowNum} (already in tenure > 7 range)`);
              } else {
                console.warn(`⚠ Asset skipped: ${category} row ${rowNum} (invalid range)`);
                return;
              }
            } else {
              // tenure ≤ 7: only keep rows in default range
              const isInDefaultRange = rowNum >= defaultSection.start && rowNum <= defaultSection.end;
              if (!isInDefaultRange) {
                console.warn(`⚠ Asset skipped: ${category} row ${rowNum} (tenure ≤ 7 but row in > 7 range)`);
                return;
              }
            }

            convertedAssets[category][targetRow] = item;
          }
        });
    });

    // Process indirect expenses - NO remapping needed since form already uses correct cells
    // Form uses CURRENT_INDIRECT_EXPENSES_DATA which already has correct cell refs for current tenure
    let filteredIndirectExpenses = {};

    // Define valid ranges based on tenure
    // tenure > 7: 263-283, 285-291, 292-303, 304-311, 312-319 (skip 284)
    // tenure ≤ 7: 251-271, 273-279, 280-291, 292-299, 300-307
    const validExpenseRows = isTenureGT7
      ? { min: 263, max: 319, skip: [284] }  // tenure > 7 range
      : { min: 251, max: 307, skip: [] };     // default range

    Object.keys(formData['Schedule for Indirect Expenses'] || {}).forEach(cell => {
      const match = cell.match(/^([de])(\d+)$/);
      if (match) {
        const rowNum = parseInt(match[2]);
        const isValidRow = rowNum >= validExpenseRows.min &&
          rowNum <= validExpenseRows.max &&
          !validExpenseRows.skip.includes(rowNum);

        if (isValidRow) {
          filteredIndirectExpenses[cell] = formData['Schedule for Indirect Expenses'][cell];
        } else {
          console.warn(`⚠ Expense filtered out: ${cell} (row ${rowNum} invalid for tenure ${tenure})`);
        }
      }
    });

    console.log('📊 Filtered expenses:', Object.keys(filteredIndirectExpenses).filter(k => k.startsWith('e') && formData['Schedule for Indirect Expenses'][k]).length, 'expense values');

    // Convert month inputs to mmm-yy format
    const updatedFormData = {
      ...formData,
      'Means of Finance details': {
        ...formData['Means of Finance details']
      },
      'Schedule for Indirect Expenses': filteredIndirectExpenses
    };
    if (updatedFormData['Means of Finance details']?.['i59']) {
      const [year, month] = updatedFormData['Means of Finance details']['i59'].split('-');
      if (year && month) {
        updatedFormData['Means of Finance details']['i59'] = `${month.padStart(2, '0')}-01-${year}`;
      }
    }
    if (updatedFormData['Means of Finance details']?.['i60']) {
      const [year, month] = updatedFormData['Means of Finance details']['i60'].split('-');
      if (year && month) {
        const date = new Date(year, month - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'short' });
        updatedFormData['Means of Finance details']['i60'] = `${monthName}-${year.slice(-2)}`;
      }
    }

    // Build loan percentages mapping for Excel cells K28-K39
    const loanPercentageCells = {};
    Object.keys(CURRENT_ASSET_SECTIONS).forEach(category => {
      const section = CURRENT_ASSET_SECTIONS[category];
      const percentage = loanPercentages[category] || 0;
      // Map to Excel cell (e.g., k28, k29, etc.)
      loanPercentageCells[section.loanCell] = percentage;
    });

    // Combine all data
    const payload = {
      ...updatedFormData,
      bank_name: formData['General Information']['bank_name'],
      branch_name: formData['General Information']['branch_name'],
      'Fixed Assets Schedule': convertedAssets,
      'Asset Loan Percentages': loanPercentages,
      'Loan Percentage Cells': loanPercentageCells
    };

    console.log('📤 Final payload summary:', {
      tenure,
      isTenureGT7,
      assetCategories: Object.keys(convertedAssets),
      expenseRowRange: isTenureGT7 ? '263-319' : '251-307',
      expenseCount: Object.keys(filteredIndirectExpenses).filter(k => k.startsWith('e')).length
    });

    onSubmit(payload);
  };

  const renderInput = (section, field, label, type = 'text', options = null, suffix = null) => {
    const fieldError = section === 'General Information'
      ? generalInfoErrors[field]
      : section === 'Means of Finance details'
        ? meansOfFinanceErrors[field]
        : null;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {options ? (
          <select
            value={formData[section]?.[field] || ''}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={`w-full p-2 border rounded-md ${fieldError ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select {label}</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <div className="relative">
            <input
              type={type}
              value={formData[section]?.[field] || ''}
              onChange={(e) => handleInputChange(section, field, e.target.value)}
              onWheel={(e) => e.target.type === 'number' && e.target.blur()}
              className={`w-full p-2 border rounded-md ${fieldError ? 'border-red-500' : 'border-gray-300'} ${suffix ? 'pr-8' : ''}`}
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">{suffix}</span>
            )}
          </div>
        )}
        {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
      </div>
    );
  };

  const renderIndirectExpenseInput = (item) => (
    <div key={item.d} className="grid grid-cols-12 gap-4 mb-2 items-center">
      <div className="col-span-8">
        <label className="block text-sm text-gray-700">{item.label}</label>
      </div>
      <div className="col-span-4">
        <input
          type="number" onWheel={(e) => e.target.blur()}
          value={formData['Schedule for Indirect Expenses']?.[item.e] || ''}
          onChange={(e) => handleIndirectExpenseChange(item.e, e.target.value)}

          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Amount"
        />
      </div>
    </div>
  );

  const sections = [
    { key: 'general', title: 'General Information', icon: BuildingOfficeIcon },
    { key: 'term', title: 'Means of Finance details', icon: CurrencyDollarIcon },
    { key: 'assets', title: 'cost of the project', icon: BuildingOfficeIcon },
    { key: 'cost', title: 'working capital requirement', icon: CurrencyDollarIcon },
    { key: 'employment', title: 'Expected Employment Generation', icon: DocumentTextIcon },
    { key: 'expenses', title: 'Schedule for Indirect Expenses (Per Month)', icon: ChartBarIcon },
    { key: 'prepared_by', title: 'Prepared By', icon: BuildingOfficeIcon }
  ];

  // Define required fields for each section
  const requiredFields = {
    'General Information': ['i7', 'i8', 'i9', 'i14', 'i15', 'i16', 'i19', 'i20', 'i21', 'i22', 'bank_name', 'branch_name', 'i12', 'i13'],
    'Expected Employment Generation': ['i24', 'i25', 'i26'],
    'Means of Finance details': ['h45', 'i46', 'i47', 'i48', 'i49', 'h52', 'h53', 'i58', 'i59', 'i60', 'i63'],
    'Indirect Expenses Increment': ['h71', 'h72', 'h73', 'h74', 'h75'],
    'Cost of Project details': ['i40'],
    'Schedule for Assets': [], // Add required fields if any
    'Schedule for Indirect Expenses': [] // Add required fields if any
  };

  const validateGeneralInformation = useCallback((generalInfo = {}) => {
    const errors = {};

    const requiredWithLabels = {
      i7: 'Status of Concern is required',
      i8: 'Name is required',
      i9: 'Mobile Number is required',
      bank_name: 'Bank Name / Department Name is required',
      branch_name: 'Branch Name is required',
      i12: 'Age is required',
      i13: 'Gender is required',
      i14: 'Sector is required',
      i15: 'Nature of Business is required',
      i16: 'Address of office/Factory is required',
      i19: 'Education Qualification is required',
      i20: 'Project covered under scheme is required',
      i21: 'Caste is required',
      i22: 'Unit location is required'
    };

    Object.entries(requiredWithLabels).forEach(([field, message]) => {
      const value = generalInfo[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        errors[field] = message;
      }
    });

    const name = String(generalInfo.i8 || '').trim();
    if (name && name.length < 2) {
      errors.i8 = 'Name must be at least 2 characters';
    }

    const mobile = String(generalInfo.i9 || '').trim();
    if (mobile && !/^\d{10}$/.test(mobile)) {
      errors.i9 = 'Mobile Number must be exactly 10 digits';
    }

    const ageValue = generalInfo.i12;
    const age = Number(ageValue);
    if (String(ageValue || '').trim() !== '' && (!Number.isFinite(age) || age < 18 || age > 100)) {
      errors.i12 = 'Age must be between 18 and 100';
    }

    const aadhar = String(generalInfo.i10 || '').trim();
    if (aadhar && !/^\d{12}$/.test(aadhar)) {
      errors.i10 = 'Aadhar Number must be 12 digits';
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const proprietorPan = String(generalInfo.i11 || '').trim().toUpperCase();
    if (proprietorPan && !panRegex.test(proprietorPan)) {
      errors.i11 = 'PAN format is invalid';
    }

    const firmPan = String(generalInfo.i18 || '').trim().toUpperCase();
    if (firmPan && !panRegex.test(firmPan)) {
      errors.i18 = 'PAN of firm/company format is invalid';
    }

    return errors;
  }, []);

  const validateMeansOfFinance = useCallback((allData = formData) => {
    const errors = {};
    const term = allData['Means of Finance details'] || {};

    const requiredWithLabels = {
      h45: 'Term Loan Rate of Interest is required',
      i46: 'Installment period is required',
      i47: 'Term Loan Tenure is required',
      i48: 'Repayment type is required',
      i49: 'Moratorium period is required',
      h52: 'Working capital loan interest rate is required',
      h53: 'Processing fees rate is required',
      i58: 'Loan Financial Year is required',
      i59: 'Loan Start Month is required',
      i60: 'First Sale Bill Month is required',
      i63: 'Average DSCR Ratio is required'
    };

    Object.entries(requiredWithLabels).forEach(([field, message]) => {
      const value = term[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        errors[field] = message;
      }
    });

    const termLoanRoi = Number(term.h45);
    if (String(term.h45 || '').trim() !== '' && (!Number.isFinite(termLoanRoi) || termLoanRoi <= 0 || termLoanRoi > 100)) {
      errors.h45 = 'Term Loan Rate of Interest must be greater than 0 and up to 100';
    }

    const wcRoi = Number(term.h52);
    if (String(term.h52 || '').trim() !== '' && (!Number.isFinite(wcRoi) || wcRoi <= 0 || wcRoi > 100)) {
      errors.h52 = 'Working capital Loan Rate of Interest must be greater than 0 and up to 100';
    }

    const tenure = Number(term.i47);
    if (String(term.i47 || '').trim() !== '' && (!Number.isFinite(tenure) || tenure <= 0 || tenure > 30)) {
      errors.i47 = 'Term Loan Tenure must be between 1 and 30 years';
    }

    const moratorium = Number(term.i49);
    if (String(term.i49 || '').trim() !== '' && (!Number.isFinite(moratorium) || moratorium < 0)) {
      errors.i49 = 'Moratorium period must be 0 or more';
    }
    if (Number.isFinite(tenure) && tenure > 0 && Number.isFinite(moratorium) && moratorium > tenure * 12) {
      errors.i49 = 'Moratorium period cannot exceed total tenure in months';
    }

    const processingFee = Number(term.h53);
    if (String(term.h53 || '').trim() !== '' && (!Number.isFinite(processingFee) || processingFee < 0 || processingFee > 100)) {
      errors.h53 = 'Processing fees rate must be between 0 and 100';
    }

    if (term.i59 && term.i60 && String(term.i60) < String(term.i59)) {
      errors.i60 = 'First Sale Bill Month cannot be earlier than Loan Start Month';
    }

    const dscr = Number(term.i63);
    if (String(term.i63 || '').trim() !== '' && (!Number.isFinite(dscr) || dscr < 1.75 || dscr > 5)) {
      errors.i63 = 'Average DSCR Ratio must be between 1.75 and 5';
    }

    return errors;
  }, [formData]);

  const generalInfoFieldLabels = {
    i7: 'Status of Concern',
    i8: 'Name',
    i9: 'Mobile Number',
    i10: 'Aadhar number',
    i11: 'PAN',
    bank_name: 'Bank Name / Department Name',
    branch_name: 'Branch Name',
    i12: 'Age',
    i13: 'Gender',
    i14: 'Sector',
    i15: 'Nature of Business',
    i16: 'Address of office/Factory',
    i18: 'PAN of firm/Company',
    i19: 'Education Qualification',
    i20: 'Project covered under which Scheme',
    i21: 'Caste',
    i22: 'Unit location'
  };

  const meansOfFinanceFieldLabels = {
    h45: 'Term Loan Rate of Interest',
    i46: 'Installment period',
    i47: 'Term Loan Tenure (Years)',
    i48: 'Fixed EMI / Fixed Principal',
    i49: 'Moratorium period',
    h52: 'Working capital Loan Rate of Interest',
    h53: 'Processing fees rate',
    i58: 'Loan Financial Year',
    i59: 'Loan Start Month',
    i60: 'First Sale Bill Month',
    i63: 'Average DSCR Ratio Required'
  };

  // Check if user can proceed to next step
  const canProceed = useMemo(() => {
    const currentSection = sections[currentStep];
    const sectionKey = currentSection.key;

    // Map section keys to data keys
    const sectionDataKeys = {
      'general': 'General Information',
      'employment': 'Expected Employment Generation',
      'term': 'Means of Finance details',
      'indirect': 'Indirect Expenses Increment',
      'cost': 'Cost of Project details',
      'assets': 'Schedule for Assets',
      'expenses': 'Schedule for Indirect Expenses',
      'prepared_by': 'Prepared By'
    };

    const dataKey = sectionDataKeys[sectionKey];
    const required = requiredFields[dataKey] || [];

    if (sectionKey === 'general') {
      return Object.keys(validateGeneralInformation(formData['General Information'] || {})).length === 0;
    }

    if (sectionKey === 'term') {
      return Object.keys(validateMeansOfFinance(formData)).length === 0;
    }

    // Special validation for Schedule for Assets
    if (sectionKey === 'assets') {
      const assetCategories = Object.keys(CURRENT_ASSET_SECTIONS);

      // Check if all categories have been visited
      if (visitedAssetCategories.size < assetCategories.length) {
        return false;
      }

      // Check that categories with items have loan percentages set (allow 0%)
      for (const categoryName of categoriesWithItems) {
        const loanPercentage = loanPercentages[categoryName];
        if (loanPercentage === undefined || loanPercentage === null || loanPercentage === '') {
          return false;
        }
      }

      return true;
    }

    if (required.length === 0) return true; // No required fields for this section

    const sectionData = formData[dataKey] || {};
    return required.every(fieldId => {
      const value = sectionData[fieldId];
      return value !== undefined && value !== null && value !== '';
    });
  }, [formData, currentStep, sections, visitedAssetCategories, categoriesWithItems, loanPercentages, validateGeneralInformation, validateMeansOfFinance]);

  const handleNext = () => {
    const currentSection = sections[currentStep];

    if (currentSection.key === 'general') {
      const errors = validateGeneralInformation(formData['General Information'] || {});
      setGeneralInfoErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    if (currentSection.key === 'term') {
      const errors = validateMeansOfFinance(formData);
      setMeansOfFinanceErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    if (canProceed && currentStep < sections.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFillTestData = () => {
    const testTenure = 7; // Test with tenure > 7

    // Get the correct expenses data for test tenure
    const testExpensesData = getIndirectExpensesData(testTenure);

    // Build the initial indirect expenses with correct cell mappings for test tenure
    const testIndirectExpenses = {};
    Object.values(testExpensesData).flat().forEach(item => {
      testIndirectExpenses[item.d] = item.label;
      testIndirectExpenses[item.e] = 0;
    });

    // Add some sample values
    testIndirectExpenses['e263'] = '12000'; // Bank charges
    testIndirectExpenses['e264'] = '5000';  // Software subscription
    testIndirectExpenses['e285'] = '10000'; // Freight and forwarding
    testIndirectExpenses['e292'] = '25000'; // Insurance
    testIndirectExpenses['e300'] = '500';   // Donation

    const testData = {
      'General Information': {
        'i7': 'Sole Proprietorship', 'i8': 'John Doe', 'i9': '9876543210', 'i10': '123456789012',
        'bank_name': 'ICICI Bank', 'branch_name': 'Industrial Branch',
        'i11': 'ABCDE1234F', 'i12': '35', 'i13': 'Male',
        'i14': 'Manufacturing sector', 'i15': 'Textile Manufacturing', 'i16': '123 Industrial Area, City', 'i17': 'Doe Textiles', 'i18': 'ABCDE1234F', 'i19': 'Graduate', 'i20': 'PMEGP',
        'i21': 'OC', 'i22': 'Urban(Other than Panchayat)', 'i23': ''
      },
      'Expected Employment Generation': {
        'i24': '1', 'j24': '8000', // Skilled
        'i25': '1', 'j25': '7500', // Semi Skilled
        'i26': '0', 'j26': '0'  // Unskilled
      },
      'Means of Finance details': {
        'h45': '12', 'i46': 'Monthly', 'i47': String(testTenure), // Tenure > 7 to test new mapping
        'i48': 'Fixed EMI', 'i49': '0',
        'h52': '12', 'h53': '1',
        'i58': '2025-26', 'i59': '2025-04', 'i60': '2025-06', 'i63': '3'
      },
      'Indirect Expenses Increment': {
        'h71': '2', 'h72': '2', 'h73': '2', 'h74': '2', 'h75': '2'
      },
      'Cost of Project details': {
        'i40': '1',
        'k40': '95'
      },
      'Schedule for Indirect Expenses': testIndirectExpenses,
      'Prepared By': {
        'j136': 'Partner A',
        'j137': 'Partner B',
        'j138': '9876543211'
      }
    };

    const testAssets = {
      'Plant and Machinery': {
        // For tenure > 7, rows shift from 136-145 to 148-157
      },
      'Furniture and Fittings': {
        // For tenure > 7, rows shift from 189-198 to 201-210
      }
    };

    // Update liveTenure FIRST to trigger the correct CURRENT_INDIRECT_EXPENSES_DATA
    setLiveTenure(testTenure);
    expensesInitializedForGT7Ref.current = testTenure > 7;

    setFormData(prev => ({
      ...prev,
      ...testData
    }));

    setAssetItems(prev => {
      const newAssets = { ...prev };
      Object.keys(testAssets).forEach(key => {
        newAssets[key] = { ...newAssets[key], ...testAssets[key] };
      });
      return newAssets;
    });

  };

  // Handle asset tab switching with validation
  const handleAssetTabChange = (newTabIndex) => {
    const assetCategories = Object.keys(CURRENT_ASSET_SECTIONS);
    const currentCategoryName = assetCategories[assetActiveTab];
    const currentItems = assetItems[currentCategoryName] || {};
    const hasItems = Object.keys(currentItems).some(row => {
      const item = currentItems[row];
      return item.description.trim() !== '' || (item.amount && item.amount !== 0);
    });

    // If current category has items, validate loan percentage
    if (hasItems) {
      const loanPercentage = loanPercentages[currentCategoryName];
      if (loanPercentage === undefined || loanPercentage === null || loanPercentage === '' || loanPercentage === 0) {
        setAssetValidationErrors(prev => ({
          ...prev,
          [currentCategoryName]: 'Please enter Loan Percentage (%) before switching to another category.'
        }));
        return; // Prevent tab switch
      }
    }

    // Clear any existing error for current category
    setAssetValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[currentCategoryName];
      return newErrors;
    });

    // Mark both current and new category as visited
    setVisitedAssetCategories(prev => new Set([...prev, assetActiveTab, newTabIndex]));

    // Switch to new tab
    setAssetActiveTab(newTabIndex);
  };

  const renderCurrentStep = () => {
    switch (sections[currentStep].key) {
      case 'general':
        return (
          <div className="space-y-4">
            {Object.keys(generalInfoErrors).length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-700 mb-1">Please fix the following errors:</p>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                  {Object.entries(generalInfoErrors).map(([field, error]) => (
                    <li key={field}>{generalInfoFieldLabels[field] ? `${generalInfoFieldLabels[field]}: ${error}` : error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('General Information', 'i7', 'Status of Concern', 'text', ['Sole Proprietorship', 'Partnership Firm', 'Private limited Company', 'LLP', 'Society', 'Trust', 'Federation'])}
              {renderInput('General Information', 'i8', 'Name of Proprietor/ partner/Director/Member/trustee')}
              {renderInput('General Information', 'i9', 'Mobile Number')}
              {renderInput('General Information', 'i10', 'Aadhar number (Optional)')}
              {renderInput('General Information', 'bank_name', 'Bank Name / Department Name')}
              {renderInput('General Information', 'branch_name', 'Branch Name')}
              {renderInput('General Information', 'i11', 'PAN (Optional)')}
              {renderInput('General Information', 'i12', 'Age')}
              {renderInput('General Information', 'i13', 'Gender', 'text', ['Male', 'Female', 'Others'])}
              {renderInput('General Information', 'i14', 'Sector', 'text', ['Manufacturing sector', 'Service Sector (With stock)', 'Trading sector'])}
              {renderInput('General Information', 'i15', 'Nature of Business')}
              {renderInput('General Information', 'i16', 'Address of office/Factory')}
              {renderInput('General Information', 'i17', 'Name of firm/Company (Optional)')}
              {renderInput('General Information', 'i18', 'PAN of firm/Company (Optional)')}
              {renderInput('General Information', 'i19', 'Education Qualification', 'text', ['Below 8th', 'Above 8th', 'SSC 10th', 'intermediate +2', 'Graduate', 'Post Graduate'])}
              {renderInput('General Information', 'i20', 'Project covered under which Scheme', 'text', ['AP IDP 4.0', 'Industrial park Land Allotment', 'PMEGP', 'Mudra', 'PMFME', 'PMMSY', 'Startup India', 'Other MSME', 'NLM scheme'])}
              {renderInput('General Information', 'i21', 'Caste', 'text', ['OC', 'SC', 'ST', 'BC', 'Minority'])}
              {renderInput('General Information', 'i22', 'Unit location', 'text', ['Rural(Panchayat)', 'Urban(Other than Panchayat)'])}
            </div>
          </div>
        );

      case 'employment':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Skilled Employees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('Expected Employment Generation', 'i24', 'Number of Skilled Employees', 'number')}
              {renderInput('Expected Employment Generation', 'j24', 'Salary per Employee Per Month', 'number')}
            </div>
            <h3 className="text-lg font-medium text-gray-900">Semi Skilled Employees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('Expected Employment Generation', 'i25', 'Number of Semi Skilled Employees', 'number')}
              {renderInput('Expected Employment Generation', 'j25', 'Salary per Employee Per Month', 'number')}
            </div>
            <h3 className="text-lg font-medium text-gray-900">Unskilled Employees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('Expected Employment Generation', 'i26', 'Number of Unskilled Employees', 'number')}
              {renderInput('Expected Employment Generation', 'j26', 'Salary per Employee Per Month', 'number')}
            </div>
          </div>
        );

      case 'term':
        return (
          <div className="space-y-4">
            {Object.keys(meansOfFinanceErrors).length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-700 mb-1">Please fix the following errors:</p>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                  {Object.entries(meansOfFinanceErrors).map(([field, error]) => (
                    <li key={field}>{meansOfFinanceFieldLabels[field] ? `${meansOfFinanceFieldLabels[field]}: ${error}` : error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('Means of Finance details', 'h45', 'Term Loan Rate of Interest', 'number')}
              {renderInput('Means of Finance details', 'i46', 'Installment period', 'text', ['Monthly', 'Quarterly', 'Half yearly'])}
              {renderInput('Means of Finance details', 'i47', 'Term Loan Tenure (Years)', 'number')}
              {renderInput('Means of Finance details', 'i48', 'Fixed EMI or Fixed Principal Amount over Loan Term period', 'text', ['Fixed EMI', 'Fixed Principal'])}
              {renderInput('Means of Finance details', 'i49', 'Moratorium period (months)', 'number')}
              {/* {renderInput('Means of Finance details', 'h50', 'Margin money for Working capital requirement', 'number')} */}
              {renderInput('Means of Finance details', 'h52', 'Working capital Loan Rate of Interest', 'number')}
              {renderInput('Means of Finance details', 'h53', 'Processing fees rate', 'number')}

              <div className="col-span-2 border-t pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput('Means of Finance details', 'i58', 'Loan Financial Year', 'text', generateFinancialYearOptions())}
                  {renderInput('Means of Finance details', 'i59', 'Loan Start Month (Month immediately after Santion Month)', 'month')}
                  {renderInput('Means of Finance details', 'i60', 'First Sale Bill Month', 'month')}
                  {renderInput('Means of Finance details', 'i63', 'Average DSCR Ratio Required', 'number')}
                </div>
              </div>
            </div>
          </div>
        );

      case 'cost':
        const wcReq = parseFloat(formData['Cost of Project details']?.['i40'] || 0);
        const wcPercent = parseFloat(formData['Cost of Project details']?.['k40'] || 0);
        const wcLoanAmount = wcReq && wcPercent ? ((wcReq * wcPercent) / 100).toFixed(2) : '';

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInput('Cost of Project details', 'i40', 'Working capital Requirement(Lac)', 'number')}
            {renderInput('Cost of Project details', 'k40', 'Loan Percentage for Working Capital (%)', 'number')}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Working Capital Loan Amount (Calculated)</label>
              <div className="relative">
                <input
                  type="text"
                  value={wcLoanAmount}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                  placeholder="Automatically calculated"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">Lacs</span>
              </div>
            </div>
          </div>
        );

      case 'assets':
        const assetCategories = Object.keys(CURRENT_ASSET_SECTIONS);
        const activeCategoryName = assetCategories[assetActiveTab] || assetCategories[0];
        const activeItems = assetItems[activeCategoryName] || {};
        const sectionConfig = CURRENT_ASSET_SECTIONS[activeCategoryName];
        const maxItems = sectionConfig.end - sectionConfig.start + 1;

        // Calculate total for the current category
        const categoryTotal = Object.values(activeItems).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Schedule for Assets</h3>
              <p className="text-sm text-blue-600">
                Please enter the details for each asset category. Select a category tab to view its items.
              </p>
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Progress:</strong> {visitedAssetCategories.size} of {assetCategories.length} categories visited.
                  {visitedAssetCategories.size < assetCategories.length && (
                    <span className="text-red-600 font-medium">Please visit all categories before proceeding.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
              {assetCategories.map((categoryName, idx) => (
                <button
                  key={categoryName}
                  onClick={() => handleAssetTabChange(idx)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${assetActiveTab === idx
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {categoryName}
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800">{activeCategoryName}</h4>
                <div className="px-4 py-1.5 bg-gray-900 text-white rounded-lg">
                  <span className="text-sm font-bold">
                    Total: ₹{categoryTotal.toLocaleString('en-IN')} Lakhs
                  </span>
                </div>
              </div>

              {/* Display validation errors */}
              {assetValidationErrors[activeCategoryName] && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">{assetValidationErrors[activeCategoryName]}</p>
                </div>
              )}

              <div className="grid grid-cols-12 gap-3 mb-3">
                <div className="col-span-6 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
                  Item Description
                </div>
                <div className="col-span-5 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
                  Amount (₹ in Lakhs)
                </div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {Object.keys(activeItems).length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm italic">
                    No items available.
                  </div>
                )}
                {Object.keys(activeItems).sort((a, b) => a - b).map((row) => {
                  const item = activeItems[row];
                  return (
                    <div key={row} className="grid grid-cols-12 gap-3">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateAssetItem(activeCategoryName, row, 'description', e.target.value)}
                        className="col-span-6 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                      />
                      <input
                        type="number" onWheel={(e) => e.target.blur()}
                        placeholder="Amount"
                        min="0"
                        value={item.amount}
                        onChange={(e) => updateAssetItem(activeCategoryName, row, 'amount', e.target.value)}

                        className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeAssetItem(activeCategoryName, row)}
                        className="col-span-1 px-2 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => addAssetItem(activeCategoryName)}
                disabled={Object.values(activeItems).filter(item => item.description || item.amount).length >= maxItems}
                className={`mt-3 px-4 py-2 text-xs rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 ${Object.values(activeItems).filter(item => item.description || item.amount).length >= maxItems
                  ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
                  : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                  }`}
              >
                <PlusIcon className="w-4 h-4" />
                Add Item ({Object.values(activeItems).filter(item => item.description || item.amount).length}/{maxItems})
              </button>

              {/* Loan Requirement Section */}
              {categoryTotal > 0 && (
                <div className="mt-6 pt-4 border-t-2 border-purple-200">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <CreditCardIcon className="w-4 h-4" />
                      Loan Requirement for {activeCategoryName}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Loan Percentage Input */}
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">
                          Loan Percentage (%)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={loanPercentages[activeCategoryName] || ''}
                            onChange={(e) => handleLoanPercentageChange(activeCategoryName, e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            placeholder="Enter loan %"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 font-medium">%</span>
                        </div>
                      </div>

                      {/* Loan Amount Input */}
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">
                          Loan Amount (₹ in Lakhs)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={loanAmounts[activeCategoryName] || ''}
                            onChange={(e) => handleLoanAmountChange(activeCategoryName, e.target.value, categoryTotal)}
                            className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            placeholder="Enter loan amount"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 font-medium">₹</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Display */}
                    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Category Total:</span>
                        <span className="font-semibold text-gray-900">₹{categoryTotal.toLocaleString('en-IN')} Lakhs</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-600">Loan Required ({(loanPercentages[activeCategoryName] || 0).toFixed(1)}%):</span>
                        <span className="font-bold text-purple-700">
                          ₹{loanAmounts[activeCategoryName] && loanAmounts[activeCategoryName] !== ''
                            ? parseFloat(loanAmounts[activeCategoryName]).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                            : calculateLoanAmount(activeCategoryName, categoryTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                          } Lakhs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'prepared_by':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800">
                  Partner Name 1 (Prepared By)
                </label>
                <input
                  type="text"
                  value={(formData['Prepared By'] && formData['Prepared By']['j136']) || ''}
                  onChange={(e) => handleInputChange('Prepared By', 'j136', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                  placeholder="Enter partner name 1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800">
                  Partner Name 2 (Prepared By)
                </label>
                <input
                  type="text"
                  value={(formData['Prepared By'] && formData['Prepared By']['j137']) || ''}
                  onChange={(e) => handleInputChange('Prepared By', 'j137', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                  placeholder="Enter partner name 2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800">
                  Mobile Number (Prepared By)
                </label>
                <input
                  type="text"
                  value={(formData['Prepared By'] && formData['Prepared By']['j138']) || ''}
                  onChange={(e) => handleInputChange('Prepared By', 'j138', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
          </div>
        );

      case 'expenses':
        const expenseCategories = Object.keys(CURRENT_INDIRECT_EXPENSES_DATA);
        const activeExpenseCategory = expenseCategories[indirectActiveTab] || expenseCategories[0];
        const activeExpenseItems = CURRENT_INDIRECT_EXPENSES_DATA[activeExpenseCategory];

        // Mapping for increment percentage for FRTermLoanCCForm
        const incrementMap = {
          'Administrative & Office Expenses': 'h72',
          'Employee Related Expenses': 'h71',
          'Selling and Distribution Expenses': 'h73',
          'General Overheads': 'h74',
          'Miscellaneous Expenses': 'h75'
        };
        const incrementKey = incrementMap[activeExpenseCategory];

        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Schedule for Indirect Expenses (Per Month)</h3>
              <p className="text-sm text-blue-600">
                Please enter the details and increment percentage for each expense category.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
              {expenseCategories.map((categoryName, idx) => (
                <button
                  key={categoryName}
                  onClick={() => setIndirectActiveTab(idx)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${indirectActiveTab === idx
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {categoryName}
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-4">{activeExpenseCategory} (Rs per Month)</h4>
              <div className="space-y-2">
                {activeExpenseCategory === 'Employee Related Expenses' && (
                  (() => {
                    const skilledNum = parseFloat(formData['Expected Employment Generation']?.['i24'] || 0);
                    const skilledCost = parseFloat(formData['Expected Employment Generation']?.['j24'] || 0);

                    const semiSkilledNum = parseFloat(formData['Expected Employment Generation']?.['i25'] || 0);
                    const semiSkilledCost = parseFloat(formData['Expected Employment Generation']?.['j25'] || 0);

                    const unskilledNum = parseFloat(formData['Expected Employment Generation']?.['i26'] || 0);
                    const unskilledCost = parseFloat(formData['Expected Employment Generation']?.['j26'] || 0);

                    const totalSalaries = (skilledNum * skilledCost) + (semiSkilledNum * semiSkilledCost) + (unskilledNum * unskilledCost);

                    return (
                      <div className="grid grid-cols-12 gap-4 mb-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="col-span-8">
                          <label className="block text-sm font-semibold text-gray-700">
                            Salaries and wages (office & admin staff)
                          </label>
                          <span className="text-xs text-gray-500 block">(Auto-calculated from Employment Generation)</span>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={totalSalaries}
                            readOnly
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                          />
                        </div>
                      </div>
                    );
                  })()
                )}
                {activeExpenseItems.map((item) => renderIndirectExpenseInput(item))}
              </div>

              {/* Increment Percentage Field - MOVED TO BOTTOM */}
              {incrementKey && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <label className="block text-sm font-semibold text-indigo-700 mb-1">
                      {activeExpenseCategory} Increment Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number" onWheel={(e) => e.target.blur()}
                        className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData['Indirect Expenses Increment'][incrementKey]}
                        onChange={(e) => handleInputChange('Indirect Expenses Increment', incrementKey, e.target.value)}
                        placeholder="Enter %"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 font-medium">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900 mb-2">
              Term Loan + CC Loan Application
            </h1>
            <p className="text-gray-600 text-sm">Term Loan + CC Loan</p>
          </div>
          <button
            type="button"
            onClick={handleFillTestData}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
              {Math.round(((currentStep + 1) / sections.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
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
            {React.createElement(sections[currentStep].icon, { className: "w-6 h-6 text-gray-900" })}
            <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xl font-bold text-gray-900">
              {sections[currentStep].title}
            </h2>
          </div>

          <div className="bg-ghostwhite rounded-lg p-4" style={{ backgroundColor: '#F8F8FF' }}>
            {renderCurrentStep()}
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-5 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent font-medium text-sm flex items-center gap-1"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>

          {currentStep === sections.length - 1 ? (
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
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 3 8l3-2.709z"></path>
                  </svg>
                  {isEditMode ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  {isEditMode ? 'Save & Update' : 'Submit Application'}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="px-5 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-300 font-medium text-sm flex items-center gap-1"
              onClick={handleNext}
              disabled={sections[currentStep].key !== 'general' && sections[currentStep].key !== 'term' && !canProceed}
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {!canProceed && currentStep < sections.length - 1 && (
          <div className="mt-3 text-xs text-red-600 text-center">
            Please fill all required fields to proceed
          </div>
        )}
      </div>
    </div>
  );
};

export default FRTermLoanCCForm;
