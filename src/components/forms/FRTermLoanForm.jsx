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
  for (let start = 2024; start <= 2033; start++) {
    options.push(`${start}-${(start + 1).toString().slice(-2)}`);
  }
  return options;
};

// Asset categories with row ranges and loan cell mappings for tenure ≤ 7 (K28-K39)
const ASSET_SECTIONS_DEFAULT = {
  'Plant and Machinery': { start: 122, end: 131, loanCell: 'k28' },
  'Service Equipment': { start: 132, end: 141, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 142, end: 151, loanCell: 'k30' },
  'Land': { start: 152, end: 154, loanCell: 'k31' },
  'Electrical Items & fittings': { start: 155, end: 164, loanCell: 'k32' },
  'Electronic Items': { start: 165, end: 174, loanCell: 'k33' },
  'Furniture and Fittings': { start: 175, end: 184, loanCell: 'k34' },
  'Vehicles': { start: 185, end: 194, loanCell: 'k35' },
  'Live stock': { start: 195, end: 203, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 204, end: 213, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 214, end: 223, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 224, end: 233, loanCell: 'k39' }
};

// Asset categories for tenure > 7 (shifted by +12 rows)
const ASSET_SECTIONS_TENURE_GT7 = {
  'Plant and Machinery': { start: 134, end: 143, loanCell: 'k28' },
  'Service Equipment': { start: 144, end: 153, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 154, end: 163, loanCell: 'k30' },
  'Land': { start: 164, end: 166, loanCell: 'k31' },
  'Electrical Items and fittings': { start: 167, end: 176, loanCell: 'k32' },
  'Electronic Items': { start: 177, end: 186, loanCell: 'k33' },
  'Furniture and Fittings': { start: 187, end: 196, loanCell: 'k34' },
  'Vehicles': { start: 197, end: 206, loanCell: 'k35' },
  'Live stock': { start: 207, end: 215, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 216, end: 225, loanCell: 'k37' },
  'Other Assets(Nil Depreciation)': { start: 226, end: 235, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 236, end: 245, loanCell: 'k39' }
};

// Helper function to get asset sections based on tenure
const getAssetSections = (tenure) => {
  if (tenure === undefined || tenure === null || tenure <= 7) {
    return ASSET_SECTIONS_DEFAULT;
  }
  return ASSET_SECTIONS_TENURE_GT7;
};

// Indirect expenses data for tenure ≤ 7 (DEFAULT)
const INDIRECT_EXPENSES_DATA_DEFAULT = {
  "Administrative & Office Expenses": [
    { label: "Office rent", d: "d239", e: "e239" },
    { label: "Electricity and water charges", d: "d240", e: "e240" },
    { label: "Telephone, mobile & internet expenses", d: "d241", e: "e241" },
    { label: "Postage and courier charges", d: "d242", e: "e242" },
    { label: "Printing and stationery", d: "d243", e: "e243" },
    { label: "Office maintenance & repairs", d: "d244", e: "e244" },
    { label: "Petrol, Diesel and Gas Charges", d: "d245", e: "e245" },
    { label: "Computer maintenance & AMC", d: "d246", e: "e246" },
    { label: "Legal and professional fees", d: "d247", e: "e247" },
    { label: "Audit fees", d: "d248", e: "e248" },
    { label: "Consultancy charges", d: "d249", e: "e249" },
    { label: "License and registration fees", d: "d250", e: "e250" },
    { label: "Bank charges", d: "d251", e: "e251" },
    { label: "Software subscription fees", d: "d252", e: "e252" },
    { label: "Security expenses", d: "d253", e: "e253" },
    { label: "Office cleaning expenses", d: "d254", e: "e254" },
    { label: "Staff welfare expenses", d: "d255", e: "e255" },
    { label: "Conveyance expenses", d: "d256", e: "e256" },
    { label: "Travelling expenses (non-production staff)", d: "d257", e: "e257" },
    { label: "Meeting & conference expenses", d: "d258", e: "e258" },
    { label: "Other Administrative & Office Expenses", d: "d259", e: "e259" }
  ],
  "Employee Related Expenses": [
    { label: "Provident fund and ESI contribution", d: "d261", e: "e261" },
    { label: "Gratuity and pension", d: "d262", e: "e262" },
    { label: "Staff training and development", d: "d263", e: "e263" },
    { label: "Recruitment expenses", d: "d264", e: "e264" },
    { label: "Employee insurance", d: "d265", e: "e265" },
    { label: "Refreshments & canteen expenses (office staff)", d: "d266", e: "e266" },
    { label: "Other Employee related expenses", d: "d267", e: "e267" }
  ],
  "Selling and Distribution Expenses": [
    { label: "Advertising & publicity", d: "d268", e: "e268" },
    { label: "Sales promotion expenses", d: "d269", e: "e269" },
    { label: "Trade show / exhibition expenses", d: "d270", e: "e270" },
    { label: "Dealer commission", d: "d271", e: "e271" },
    { label: "Freight inward", d: "d272", e: "e272" },
    { label: "Freight and forwarding (outward)", d: "d273", e: "e273" },
    { label: "Packing and delivery expenses", d: "d274", e: "e274" },
    { label: "Customer discounts / rebates", d: "d275", e: "e275" },
    { label: "Warranty & after-sales service expenses", d: "d276", e: "e276" },
    { label: "Bad debts written off", d: "d277", e: "e277" },
    { label: "Business entertainment expenses", d: "d278", e: "e278" },
    { label: "Other Selling and Distribution Expenses", d: "d279", e: "e279" }
  ],
  "General Overheads": [
    { label: "Insurance (office, employee, general liability)", d: "d280", e: "e280" },
    { label: "Repairs & maintenance (non-production)", d: "d281", e: "e281" },
    { label: "Subscription & membership fees", d: "d282", e: "e282" },
    { label: "Vehicle running expenses (admin vehicles)", d: "d283", e: "e283" },
    { label: "Fuel & maintenance for delivery vehicles", d: "d284", e: "e284" },
    { label: "Rent, rates, and taxes (non-factory premises)", d: "d285", e: "e285" },
    { label: "AMC (Annual Maintenance Contracts)", d: "d286", e: "e286" },
    { label: "Other General Overhead expenses", d: "d287", e: "e287" }
  ],
  "Miscellaneous Expenses": [
    { label: "Donation & charity (if not CSR)", d: "d288", e: "e288" },
    { label: "CSR expenses", d: "d289", e: "e289" },
    { label: "Loss on sale of fixed assets", d: "d290", e: "e290" },
    { label: "Provision for doubtful debts", d: "d291", e: "e291" },
    { label: "Entertainment & hospitality", d: "d292", e: "e292" },
    { label: "Gifts and samples", d: "d293", e: "e293" },
    { label: "Internet domain renewal & web hosting", d: "d294", e: "e294" },
    { label: "Miscellaneous expenses", d: "d295", e: "e295" }
  ]
};

// Indirect expenses data for tenure > 7 (shifted by +12 rows, skip row 272)
const INDIRECT_EXPENSES_DATA_TENURE_GT7 = {
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

// Helper function to get indirect expenses data based on tenure
const getIndirectExpensesData = (tenure) => {
  if (tenure === undefined || tenure === null || tenure <= 7) {
    return INDIRECT_EXPENSES_DATA_DEFAULT;
  }
  return INDIRECT_EXPENSES_DATA_TENURE_GT7;
};

const FRTermLoanForm = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null
}) => {
  const defaultFormData = {
    'General Information': {},
    'Expected Employment Generation': {},
    'General Information': {},
    'Expected Employment Generation': {},
    'Term Loan Details': {},
    'Prepared By': {},
    'Indirect Expenses Increment': {},
    'Cost of Project': {},
    'Schedule for Assets': {},
    'Schedule for Indirect Expenses': {
      'Administrative & Office Expenses': {
        'd239': 'Office rent', 'e239': 0,
        'd240': 'Electricity and water charges', 'e240': 0,
        'd241': 'Telephone, mobile & internet expenses', 'e241': 0,
        'd242': 'Postage and courier charges', 'e242': 0,
        'd243': 'Printing and stationery', 'e243': 0,
        'd244': 'Office maintenance & repairs', 'e244': 0,
        'd245': 'Petrol, Diesel and Gas Charges', 'e245': 0,
        'd246': 'Computer maintenance & AMC', 'e246': 0,
        'd247': 'Legal and professional fees', 'e247': 0,
        'd248': 'Audit fees', 'e248': 0,
        'd249': 'Consultancy charges', 'e249': 0,
        'd250': 'License and registration fees', 'e250': 0,
        'd251': 'Bank charges', 'e251': 0,
        'd252': 'Software subscription fees', 'e252': 0,
        'd253': 'Security expenses', 'e253': 0,
        'd254': 'Office cleaning expenses', 'e254': 0,
        'd255': 'Staff welfare expenses', 'e255': 0,
        'd256': 'Conveyance expenses', 'e256': 0,
        'd257': 'Travelling expenses (non-production staff)', 'e257': 0,
        'd258': 'Meeting & conference expenses', 'e258': 0,
        'd259': 'Other Administrative & Office Expenses', 'e259': 0
      },
      'Employee Related Expenses': {
        'd261': 'Provident fund and ESI contribution', 'e261': 0,
        'd262': 'Gratuity and pension', 'e262': 0,
        'd263': 'Staff training and development', 'e263': 0,
        'd264': 'Recruitment expenses', 'e264': 0,
        'd265': 'Employee insurance', 'e265': 0,
        'd266': 'Refreshments & canteen expenses (office staff)', 'e266': 0,
        'd267': 'Other Employee related expenses', 'e267': 0
      },
      'Selling and Distribution Expenses': {
        'd268': 'Advertising & publicity', 'e268': 0,
        'd269': 'Sales promotion expenses', 'e269': 0,
        'd270': 'Trade show / exhibition expenses', 'e270': 0,
        'd271': 'Dealer commission', 'e271': 0,
        'd272': 'Freight inward', 'e272': 0,
        'd273': 'Freight and forwarding (outward)', 'e273': 0,
        'd274': 'Packing and delivery expenses', 'e274': 0,
        'd275': 'Customer discounts / rebates', 'e275': 0,
        'd276': 'Warranty & after-sales service expenses', 'e276': 0,
        'd277': 'Bad debts written off', 'e277': 0,
        'd278': 'Business entertainment expenses', 'e278': 0.08,
        'd279': 'Other Selling and Distribution Expenses', 'e279': 8000
      },
      'General Overheads': {
        'd280': 'Insurance (office, employee, general liability)', 'e280': 0,
        'd281': 'Repairs & maintenance (non-production)', 'e281': 0,
        'd282': 'Subscription & membership fees', 'e282': 0,
        'd283': 'Vehicle running expenses (admin vehicles)', 'e283': 0,
        'd284': 'Fuel & maintenance for delivery vehicles', 'e284': 0,
        'd285': 'Rent, rates, and taxes (non-factory premises)', 'e285': 0,
        'd286': 'AMC (Annual Maintenance Contracts)', 'e286': 0,
        'd287': 'Other General Overhead expenses', 'e287': 0.1
      },
      'Miscellaneous Expenses': {
        'd288': 'Donation & charity (if not CSR)', 'e288': 0,
        'd289': 'CSR expenses', 'e289': 0,
        'd290': 'Loss on sale of fixed assets', 'e290': 0,
        'd291': 'Provision for doubtful debts', 'e291': 0,
        'd292': 'Entertainment & hospitality', 'e292': 0,
        'd293': 'Gifts and samples', 'e293': 0,
        'd294': 'Internet domain renewal & web hosting', 'e294': 0,
        'd295': 'Miscellaneous expenses', 'e295': 0
      }
    }
  };

  const [formData, setFormData] = useState(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // Merge initialData with default structure
      const merged = { ...defaultFormData };
      for (const key in initialData) {
        if (initialData.hasOwnProperty(key)) {
          if (typeof initialData[key] === 'object' && initialData[key] !== null && typeof merged[key] === 'object' && merged[key] !== null) {
            merged[key] = { ...merged[key], ...initialData[key] };
          } else {
            merged[key] = initialData[key];
          }
        }
      }
      return merged;
    }
    return defaultFormData;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [activeAssetTab, setActiveAssetTab] = useState(0);
  const [indirectActiveTab, setIndirectActiveTab] = useState(0);

  // Initialize tenure from initial data (i46 field in Term Loan Details)
  const initialTenure = initialData?.['Term Loan Details']?.i46 !== undefined
    ? parseInt(initialData['Term Loan Details'].i46, 10)
    : null;

  // Live tenure state - tracks real-time tenure value from form input
  const [liveTenure, setLiveTenure] = useState(initialTenure);

  // Get current asset sections and indirect expenses based on live tenure
  const CURRENT_ASSET_SECTIONS = useMemo(() => getAssetSections(liveTenure), [liveTenure]);
  const CURRENT_INDIRECT_EXPENSES_DATA = useMemo(() => getIndirectExpensesData(liveTenure), [liveTenure]);

  // Refs for tracking tenure changes
  const prevTenureRef = useRef(liveTenure);
  const expensesInitializedForGT7Ref = useRef(false);

  // Loan percentage state for each asset category (maps to K28-K39)
  const [loanPercentages, setLoanPercentages] = useState(() => {
    if (initialData && initialData['Asset Loan Percentages']) {
      return initialData['Asset Loan Percentages'];
    }
    // Default all categories to 0%
    const defaults = {};
    Object.keys(CURRENT_ASSET_SECTIONS).forEach(category => {
      defaults[category] = 0;
    });
    return defaults;
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

  const sections = [
    { key: 'general', title: 'General Information', icon: DocumentTextIcon },
    { key: 'term', title: 'Means of Finance details', icon: CreditCardIcon },
    { key: 'assets', title: 'Schedule for Assets', icon: BuildingOfficeIcon },
    { key: 'employment', title: 'Expected Employment Generation', icon: ChartBarIcon },
    { key: 'expenses', title: 'Schedule for Indirect Expenses (Per Month)', icon: CurrencyDollarIcon },
    { key: 'prepared_by', title: 'Prepared By', icon: BuildingOfficeIcon }
  ];

  useEffect(() => {
    if (initialData && isEditMode) {
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
        return merged;
      });
    }
  }, [initialData, isEditMode]);

  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  // Reinitialize indirect expenses when tenure changes
  useEffect(() => {
    const prevTenure = prevTenureRef.current;
    const prevIsGT7 = prevTenure !== null && prevTenure > 7;
    const currentIsGT7 = liveTenure !== null && liveTenure > 7;

    // Skip if liveTenure is null (initial state before user enters value)
    if (liveTenure === null) {
      prevTenureRef.current = liveTenure;
      return;
    }

    // Reinitialize expenses when:
    // 1. First time entering any tenure value (prevTenure is null)
    // 2. Crossing the 7-year threshold (≤7 to >7 or vice versa)
    // 3. First time entering tenure > 7
    const shouldReinitialize =
      (prevTenure === null) ||
      (prevTenure !== null && prevIsGT7 !== currentIsGT7) ||
      (currentIsGT7 && !expensesInitializedForGT7Ref.current);

    if (shouldReinitialize) {
      console.log('🔄 [TERM_LOAN] Reinitializing indirect expenses', {
        prevTenure,
        liveTenure,
        prevIsGT7,
        currentIsGT7,
        reason: prevTenure === null ? 'first-entry' : prevIsGT7 !== currentIsGT7 ? 'threshold-crossed' : 'first-GT7'
      });

      // Get correct expenses data for current tenure
      const newExpensesData = getIndirectExpensesData(liveTenure);

      // Build new expense object with correct cell references
      const newIndirect = {};
      Object.values(newExpensesData).flat().forEach(item => {
        newIndirect[item.d] = item.label;
        newIndirect[item.e] = 0;
      });

      console.log('🔄 [TERM_LOAN] New expenses initialized', {
        expenseCount: Object.keys(newIndirect).length / 2,
        sections: Object.keys(newExpensesData),
        sampleCells: Object.keys(newIndirect).slice(0, 10)
      });

      setFormData(prev => ({
        ...prev,
        'Schedule for Indirect Expenses': newIndirect
      }));

      // Mark that expenses have been initialized for GT7 if applicable
      if (currentIsGT7) {
        expensesInitializedForGT7Ref.current = true;
      } else {
        expensesInitializedForGT7Ref.current = false;
      }
    }

    prevTenureRef.current = liveTenure;
  }, [liveTenure]);

  // Define required fields for each section
  const requiredFields = {
    'General Information': ['i7', 'i8', 'i9', 'i14', 'i15', 'i16', 'i19', 'i20', 'i21', 'i22'],
    'Expected Employment Generation': ['i24', 'i25', 'i26'],
    'Term Loan Details': ['h44', 'i45', 'i46', 'i47', 'i48', 'h49', 'i51', 'i52', 'i53', 'i56'],
    'Indirect Expenses Increment': ['h64', 'h65', 'h66', 'h67', 'h68'],
    'Schedule for Assets': [], // Add required fields if any
    'Schedule for Indirect Expenses': [] // Add required fields if any
  };

  // Check if current step can proceed
  const canProceed = useMemo(() => {
    const currentSection = sections[currentStep];
    const sectionKey = currentSection.key;
    const sectionTitle = currentSection.title;

    // Map section keys to data keys
    const sectionDataKeys = {
      'general': 'General Information',
      'employment': 'Expected Employment Generation',
      'term': 'Term Loan Details',
      'indirect': 'Indirect Expenses Increment',
      'cost': 'Cost of Project',
      'assets': 'Schedule for Assets',
      'expenses': 'Schedule for Indirect Expenses'
    };

    const dataKey = sectionDataKeys[sectionKey];
    const required = requiredFields[dataKey] || [];

    // Special validation for Schedule for Assets
    if (sectionKey === 'assets') {
      const assetCategories = Object.keys(CURRENT_ASSET_SECTIONS);

      // Check if all categories have been visited
      if (visitedAssetCategories.size < assetCategories.length) {
        return false;
      }

      // Check that categories with items have loan percentages
      for (const categoryName of categoriesWithItems) {
        const loanPercentage = loanPercentages[categoryName];
        if (loanPercentage === undefined || loanPercentage === null || loanPercentage === '' || loanPercentage === 0) {
          return false;
        }
      }

      return true;
    }

    if (sectionKey === 'term') {
      const termValid = required.every(field => {
        const value = formData[dataKey]?.[field];
        return value !== undefined && value !== '' && value !== null;
      });
      // Validate DSCR from Indirect Expenses Increment
      const dscr = formData['Indirect Expenses Increment']?.['i56'];
      const dscrValid = dscr !== undefined && dscr !== '' && dscr !== null;

      return termValid && dscrValid;
    }

    if (sectionKey === 'expenses') {
      // Validate Increment percentages
      const increments = ['h64', 'h65', 'h66', 'h67', 'h68'];
      const incrementsValid = increments.every(key => {
        const val = formData['Indirect Expenses Increment']?.[key];
        return val !== undefined && val !== '' && val !== null;
      });
      return incrementsValid;
    }

    if (required.length === 0) return true; // No required fields for this section

    const sectionData = formData[dataKey] || {};
    return required.every(fieldId => {
      const value = sectionData[fieldId];
      return value !== undefined && value !== null && value !== '';
    });
  }, [formData, currentStep, sections]);

  const handleFieldChange = useCallback((sectionTitle, fieldId, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [sectionTitle]: {
          ...prev[sectionTitle],
          [fieldId]: value
        }
      };

      // Auto-calculate employment generation if this is employment section
      if (sectionTitle === 'Expected Employment Generation') {
        // Manual entry only - no auto-calculation for costs
      }

      return newData;
    });

    // Update liveTenure when tenure field (i46) changes in Term Loan Details
    if (sectionTitle === 'Term Loan Details' && fieldId === 'i46') {
      const newTenure = value !== '' && value !== null && value !== undefined ? parseInt(value, 10) : null;
      const parsedTenure = isNaN(newTenure) ? null : newTenure;
      console.log('🔢 [TERM_LOAN] Tenure field changed:', {
        section: sectionTitle,
        field: fieldId,
        rawValue: value,
        parsedTenure,
        currentLiveTenure: liveTenure
      });
      setLiveTenure(parsedTenure);
    }
  }, [liveTenure]);

  const handleAssetChange = useCallback((assetKey, value) => {
    setFormData(prev => ({
      ...prev,
      'Schedule for Assets': {
        ...prev['Schedule for Assets'],
        [assetKey]: value
      }
    }));
  }, []);

  const handleExpenseChange = useCallback((category, expenseKey, value) => {
    setFormData(prev => ({
      ...prev,
      'Schedule for Indirect Expenses': {
        ...prev['Schedule for Indirect Expenses'],
        [category]: {
          ...prev['Schedule for Indirect Expenses'][category],
          [expenseKey]: value
        }
      }
    }));
  }, []);

  // Get total cost for a category
  const getCategoryTotal = (categoryName) => {
    const items = getAssetItems(categoryName);
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
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

  // Get asset items for a category
  const getAssetItems = useCallback((categoryName) => {
    const section = CURRENT_ASSET_SECTIONS[categoryName];
    if (!section) return [];
    const items = [];
    for (let i = section.start; i <= section.end; i++) {
      const desc = formData['Schedule for Assets'][`d${i}`] || '';
      const amount = formData['Schedule for Assets'][`e${i}`] || '';
      if (desc !== '' || amount !== '') {
        items.push({ row: i, description: desc, amount: amount });
      }
    }
    return items;
  }, [formData]);

  // Add asset item to a category
  const addAssetItem = useCallback((categoryName) => {
    const section = CURRENT_ASSET_SECTIONS[categoryName];
    for (let i = section.start; i <= section.end; i++) {
      const desc = formData['Schedule for Assets'][`d${i}`];
      const amount = formData['Schedule for Assets'][`e${i}`];
      if ((desc === '' || desc === undefined) && (amount === '' || amount === undefined || amount === 0)) {
        setFormData(prev => ({
          ...prev,
          'Schedule for Assets': {
            ...prev['Schedule for Assets'],
            [`d${i}`]: 'New Item',
            [`e${i}`]: 0
          }
        }));
        // Track that this category now has items
        setCategoriesWithItems(prev => new Set([...prev, categoryName]));
        return;
      }
    }
    alert('Maximum items reached for this category.');
  }, [formData]);

  // Update asset item
  const updateAssetItem = useCallback((row, field, value) => {
    // Find which category this row belongs to
    let categoryName = null;
    for (const [cat, config] of Object.entries(CURRENT_ASSET_SECTIONS)) {
      if (row >= config.start && row <= config.end) {
        categoryName = cat;
        break;
      }
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        'Schedule for Assets': {
          ...prev['Schedule for Assets'],
          [`${field}${row}`]: value
        }
      };

      // Track categories with items
      if (categoryName) {
        const section = CURRENT_ASSET_SECTIONS[categoryName];
        let hasItems = false;
        for (let i = section.start; i <= section.end; i++) {
          const desc = newData['Schedule for Assets'][`d${i}`] || '';
          const amount = newData['Schedule for Assets'][`e${i}`] || '';
          if (desc !== '' || (amount !== '' && amount !== 0 && amount !== '0')) {
            hasItems = true;
            break;
          }
        }

        setCategoriesWithItems(prev => {
          const newSet = new Set(prev);
          if (hasItems) {
            newSet.add(categoryName);
          } else {
            newSet.delete(categoryName);
          }
          return newSet;
        });
      }

      return newData;
    });
  }, []);

  // Remove asset item
  const removeAssetItem = useCallback((row) => {
    // Find which category this row belongs to
    let categoryName = null;
    for (const [cat, config] of Object.entries(CURRENT_ASSET_SECTIONS)) {
      if (row >= config.start && row <= config.end) {
        categoryName = cat;
        break;
      }
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        'Schedule for Assets': {
          ...prev['Schedule for Assets'],
          [`d${row}`]: '',
          [`e${row}`]: ''
        }
      };

      // Check if category still has items after removal
      if (categoryName) {
        const section = CURRENT_ASSET_SECTIONS[categoryName];
        let hasItems = false;
        for (let i = section.start; i <= section.end; i++) {
          const desc = newData['Schedule for Assets'][`d${i}`] || '';
          const amount = newData['Schedule for Assets'][`e${i}`] || '';
          if (desc !== '' || (amount !== '' && amount !== 0)) {
            hasItems = true;
            break;
          }
        }

        if (!hasItems) {
          setCategoriesWithItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(categoryName);
            return newSet;
          });
        }
      }

      return newData;
    });
  }, []);

  const fillTestData = useCallback(() => {
    setFormData({
      'General Information': {
        'i7': 'Sole Proprietorship',
        'i8': 'John Doe',
        'i9': '9876543210',
        'i10': 'ABC123456',
        'bank_name': 'SBI',
        'branch_name': 'Main Branch',
        'j136': 'Partner A',
        'j137': 'Partner B',
        'j138': '9876543210',
        'i11': 'DEF789012',
        'i12': 35,
        'i13': 'Male',
        'i14': 'Trading sector',
        'i15': 'IT Consulting Services',
        'i16': '123 Business Street, City - 500001',
        'i17': 'Tech Solutions Pvt Ltd',
        'i18': 'GHI345678',
        'i19': 'Graduate',
        'i20': 'Other MSME',
        'i21': 'OC',
        'i22': 'Urban(Other than Panchayat)'
      },
      'Expected Employment Generation': {
        'i24': 5,
        'i25': 10,
        'i26': 15,
        'j24': 5,  // Auto-calculated: Year 1 employment
        'j25': 15, // Auto-calculated: Year 1 + Year 2 employment
        'j26': 84  // Auto-calculated: Year 1 + Year 2 + Year 3 employment
      },
      'Term Loan Details': {
        'h44': 2.0,
        'i45': 'Monthly',
        'i46': 5,
        'i47': 'Fixed EMI',
        'i48': 6,
        'h49': 2.0,
        'i51': '2024-25',
        'i52': '2025-04',
        'i53': '2025-04',
        'i56': 1.25
      },
      'Indirect Expenses Increment': {
        'h64': 15.0,
        'h65': 50.0,
        'h66': 50.0,
        'h67': 33.5,
        'h68': 2.0
      },
      'Cost of Project': {},
      'Schedule for Assets': {
        'd122': 'Drilling Machine', 'e122': 1.2,
        'd123': 'Lathe Machine', 'e123': 0.95,
        'd124': 'CNC Machine', 'e124': 3.5,
        'd132': 'Service Pump', 'e132': 0.3,
        'd133': 'Tool Kit Set', 'e133': 0.15,
        'd142': 'Office Block', 'e142': 3.5,
        'd143': 'Warehouse', 'e143': 4.2,
        'd152': 'Industrial Plot', 'e152': 20.0,
        'd155': 'Main Transformer', 'e155': 1.2,
        'd156': 'Wiring and Cabling', 'e156': 0.4,
        'd165': 'Desktop Computers', 'e165': 0.6,
        'd166': 'Printer', 'e166': 0.12,
        'd175': 'Office Desks', 'e175': 0.8,
        'd176': 'Chairs', 'e176': 0.4,
        'd185': 'Delivery Van', 'e185': 12.5,
        'd195': 'Cattle', 'e195': 5.0,
        'd204': 'Other Asset 1', 'e204': 1.0,
        'd214': 'Other Asset Nil 1', 'e214': 2.0,
        'd224': 'Security Deposit', 'e224': 1.5
      },
      'Schedule for Indirect Expenses': {
        'Administrative & Office Expenses': {
          'd239': 'Office rent', 'e239': 5000,
          'd240': 'Electricity and water charges', 'e240': 2000,
          'd241': 'Telephone, mobile & internet expenses', 'e241': 1500,
          'd242': 'Postage and courier charges', 'e242': 500,
          'd243': 'Printing and stationery', 'e243': 1000,
          'd244': 'Office maintenance & repairs', 'e244': 800,
          'd245': 'Petrol, Diesel and Gas Charges', 'e245': 1200,
          'd246': 'Computer maintenance & AMC', 'e246': 600,
          'd247': 'Legal and professional fees', 'e247': 2000,
          'd248': 'Audit fees', 'e248': 1500,
          'd249': 'Consultancy charges', 'e249': 3000,
          'd250': 'License and registration fees', 'e250': 500,
          'd251': 'Bank charges', 'e251': 300,
          'd252': 'Software subscription fees', 'e252': 800,
          'd253': 'Security expenses', 'e253': 400,
          'd254': 'Office cleaning expenses', 'e254': 600,
          'd255': 'Staff welfare expenses', 'e255': 700,
          'd256': 'Conveyance expenses', 'e256': 900,
          'd257': 'Travelling expenses (non-production staff)', 'e257': 1500,
          'd258': 'Meeting & conference expenses', 'e258': 1000,
          'd259': 'Other Administrative & Office Expenses', 'e259': 500
        },
        'Employee Related Expenses': {
          'd261': 'Provident fund and ESI contribution', 'e261': 2500,
          'd262': 'Gratuity and pension', 'e262': 800,
          'd263': 'Staff training and development', 'e263': 500,
          'd264': 'Recruitment expenses', 'e264': 300,
          'd265': 'Employee insurance', 'e265': 400,
          'd266': 'Refreshments & canteen expenses (office staff)', 'e266': 600,
          'd267': 'Other Employee related expenses', 'e267': 200
        },
        'Selling and Distribution Expenses': {
          'd268': 'Advertising & publicity', 'e268': 2000,
          'd269': 'Sales promotion expenses', 'e269': 1500,
          'd270': 'Trade show / exhibition expenses', 'e270': 1000,
          'd271': 'Dealer commission', 'e271': 3000,
          'd272': 'Freight inward', 'e272': 800,
          'd273': 'Freight and forwarding (outward)', 'e273': 1200,
          'd274': 'Packing and delivery expenses', 'e274': 600,
          'd275': 'Customer discounts / rebates', 'e275': 500,
          'd276': 'Warranty & after-sales service expenses', 'e276': 400,
          'd277': 'Bad debts written off', 'e277': 200,
          'd278': 'Business entertainment expenses', 'e278': 800,
          'd279': 'Other Selling and Distribution Expenses', 'e279': 10000
        },
        'General Overheads': {
          'd280': 'Insurance (office, employee, general liability)', 'e280': 1200,
          'd281': 'Repairs & maintenance (non-production)', 'e281': 900,
          'd282': 'Subscription & membership fees', 'e282': 500,
          'd283': 'Vehicle running expenses (admin vehicles)', 'e283': 2000,
          'd284': 'Fuel & maintenance for delivery vehicles', 'e284': 1500,
          'd285': 'Rent, rates, and taxes (non-factory premises)', 'e285': 800,
          'd286': 'AMC (Annual Maintenance Contracts)', 'e286': 600,
          'd287': 'Other General Overhead expenses', 'e287': 12000
        },
        'Miscellaneous Expenses': {
          'd288': 'Donation & charity (if not CSR)', 'e288': 500,
          'd289': 'CSR expenses', 'e289': 300,
          'd290': 'Loss on sale of fixed assets', 'e290': 0,
          'd291': 'Provision for doubtful debts', 'e291': 200,
          'd292': 'Entertainment & hospitality', 'e292': 400,
          'd293': 'Gifts and samples', 'e293': 300,
          'd294': 'Internet domain renewal & web hosting', 'e294': 400,
          'd295': 'Miscellaneous expenses', 'e295': 600
        }
      }
    });
  }, []);

  const renderGeneralInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Status of Concern
          </label>
          <select
            value={(formData['General Information'] && formData['General Information']['i7']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i7', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="">Select Status</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership Firm">Partnership Firm</option>
            <option value="Private limited Company">Private limited Company</option>
            <option value="LLP">LLP</option>
            <option value="Society">Society</option>
            <option value="Trust">Trust</option>
            <option value="Federation">Federation</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Name of Proprietor/ partner/Director/Member/trustee
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['i8']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i8', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter name"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Mobile Number
          </label>
          <input
            type="tel"
            value={(formData['General Information'] && formData['General Information']['i9']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i9', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter mobile number"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Aadhar Number (Optional)
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['i10']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i10', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter Aadhar number"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            PAN of proprietor / Managing Partner / Managing Director (Optional)
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['i11']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i11', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter PAN"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Age
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['General Information'] && formData['General Information']['i12']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i12', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter age"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Gender
          </label>
          <select
            value={(formData['General Information'] && formData['General Information']['i13']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i13', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Sector
          </label>
          <select
            value={(formData['General Information'] && formData['General Information']['i14']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i14', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="">Select Sector</option>
            <option value="Manufacturing sector">Manufacturing sector</option>
            <option value="Service Sector (With stock)">Service Sector (With stock)</option>
            <option value="Service Sector (Without stock)">Trading sector</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Nature of Business
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['i15']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i15', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter nature of business"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Address of office/Factory
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['i16']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i16', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter address"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Name of firm/Company (Optional)
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['i17']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i17', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter firm/company name"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Bank Name / Department Name
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['bank_name']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'bank_name', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter bank or department name"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Branch Name
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['branch_name']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'branch_name', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter branch name"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-800">
          PAN of firm/Company (Optional)
        </label>
        <input
          type="text"
          value={(formData['General Information'] && formData['General Information']['i18']) || ''}
          onChange={(e) => handleFieldChange('General Information', 'i18', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          placeholder="Enter PAN"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-800">
          Education Qualification
        </label>
        <select
          value={(formData['General Information'] && formData['General Information']['i19']) || ''}
          onChange={(e) => handleFieldChange('General Information', 'i19', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
        >
          <option value="">Select Education</option>
          <option value="Below 8th">Below 8th</option>
          <option value="Above 8th">Above 8th</option>
          <option value="SSC 10th+2">SSC 10th</option>
          <option value="SSC 10th+2">intermediate +2</option>
          <option value="Graduate">Graduate</option>
          <option value="Post Graduate">Post Graduate</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-800">
          Project covered under which Scheme
        </label>
        <select
          value={(formData['General Information'] && formData['General Information']['i20']) || ''}
          onChange={(e) => handleFieldChange('General Information', 'i20', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
        >
          <option value="">Select Scheme</option>
          <option value="AP IDP 4.0">AP IDP 4.0</option>
          <option value="Industrial park Land Allotment">Industrial park Land Allotment</option>
          <option value="PMEGP">PMEGP</option>
          <option value="Mudra">Mudra</option>
          <option value="Mudra">PMFME</option>
          <option value="Mudra">PMMSY</option>
          <option value="Mudra">Startup India</option>
          <option value="NLM scheme">NLM scheme</option>
          <option value="Other MSME">Other MSME</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-800">
          Caste
        </label>
        <select
          value={(formData['General Information'] && formData['General Information']['i21']) || ''}
          onChange={(e) => handleFieldChange('General Information', 'i21', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
        >
          <option value="">Select Caste</option>
          <option value="OC">OC</option>
          <option value="SC">SC</option>
          <option value="ST">ST</option>
          <option value="BC">BC</option>
          <option value="Minority">Minority</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-800">
          Unit location
        </label>
        <select
          value={(formData['General Information'] && formData['General Information']['i22']) || ''}
          onChange={(e) => handleFieldChange('General Information', 'i22', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
        >
          <option value="">Select Location</option>
          <option value="Rural(Panchayat)">Rural(Panchayat)</option>
          <option value="Urban(Other than Panchayat)">Urban(Other than Panchayat)</option>
        </select>
      </div>
    </div>

  );

  const renderEmploymentGeneration = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Skilled employees
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Expected Employment Generation'] && formData['Expected Employment Generation']['i24']) || ''}
            onChange={(e) => handleFieldChange('Expected Employment Generation', 'i24', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter number"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Salary per Employee Per Month
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Expected Employment Generation'] && formData['Expected Employment Generation']['j24']) || ''}
            onChange={(e) => handleFieldChange('Expected Employment Generation', 'j24', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Semi Skilled Employees
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Expected Employment Generation'] && formData['Expected Employment Generation']['i25']) || ''}
            onChange={(e) => handleFieldChange('Expected Employment Generation', 'i25', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter number"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Salary per Employee Per Month
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Expected Employment Generation'] && formData['Expected Employment Generation']['j25']) || ''}
            onChange={(e) => handleFieldChange('Expected Employment Generation', 'j25', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Unskilled Employees
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Expected Employment Generation'] && formData['Expected Employment Generation']['i26']) || ''}
            onChange={(e) => handleFieldChange('Expected Employment Generation', 'i26', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter number"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Salary per Employee Per Month
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Expected Employment Generation'] && formData['Expected Employment Generation']['j26']) || ''}
            onChange={(e) => handleFieldChange('Expected Employment Generation', 'j26', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
      </div>
    </div>
  );

  const renderTermLoanDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Term Loan Rate of Interest (%)
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            step="0.01"
            min="1"
            max="3"
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['h44']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'h44', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter rate (1-3%)"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Installment period
          </label>
          <select
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i45']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'i45', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="">Select</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Half yearly">Half yearly</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Term Loan Tenure (years)
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i46']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'i46', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter tenure in years"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Fixed EMI or Fixed Principal Amount over Loan Term period
          </label>
          <select
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i47']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'i47', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="">Select</option>
            <option value="Fixed EMI">Fixed EMI</option>
            <option value="Fixed Principal">Fixed Principal</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Moratorium period (months)
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i48']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'i48', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter moratorium"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Processing fees rate (%)
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            step="0.01"
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['h49']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'h49', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter rate"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Loan Financial year
          </label>
          <select
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i51']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'i51', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="">Select Year</option>
            {generateFinancialYearOptions().map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Loan Start Month (Month immediately after Santion Month)
          </label>
          <input
            type="month"
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i52']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'i52', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Month first sale bill will be generated
          </label>
          <input
            type="month"
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i53']) || ''}
            onChange={(e) => handleFieldChange('Term Loan Details', 'i53', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Average DSCR Ratio required
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            step="0.01"
            min="1.75"
            max="5.00"
            value={(formData['Indirect Expenses Increment'] && formData['Indirect Expenses Increment']['i56']) || ''}
            onChange={(e) => handleFieldChange('Indirect Expenses Increment', 'i56', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter ratio"
          />
        </div>
      </div>
    </div>
  );

  const renderFinancialYears = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['i70', 'i71', 'i72', 'i73', 'i74', 'i75', 'i76', 'i77'].map((fieldId, index) => (
          <div className="space-y-1.5" key={fieldId}>
            <label className="block text-xs font-semibold text-gray-800">
              {index + 1}st Financial Year
            </label>
            <select
              value={formData['Financial Years'][fieldId] || ''}
              onChange={(e) => handleFieldChange('Financial Years', fieldId, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            >
              <option value="">Select Year</option>
              {generateFinancialYearOptions().map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIndirectExpenses = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Employee Related Expenses (percentage)
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Indirect Expenses Increment'] && formData['Indirect Expenses Increment']['h64']) || ''}
            onChange={(e) => handleFieldChange('Indirect Expenses Increment', 'h64', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Administrative & Office Expenses
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Indirect Expenses Increment'] && formData['Indirect Expenses Increment']['h65']) || ''}
            onChange={(e) => handleFieldChange('Indirect Expenses Increment', 'h65', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Selling and Distribution Expenses
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Indirect Expenses Increment'] && formData['Indirect Expenses Increment']['h66']) || ''}
            onChange={(e) => handleFieldChange('Indirect Expenses Increment', 'h66', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            General Overheads
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Indirect Expenses Increment'] && formData['Indirect Expenses Increment']['h67']) || ''}
            onChange={(e) => handleFieldChange('Indirect Expenses Increment', 'h67', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Miscellaneous Expenses
          </label>
          <input
            type="number" onWheel={(e) => e.target.blur()}
            value={(formData['Indirect Expenses Increment'] && formData['Indirect Expenses Increment']['h68']) || ''}
            onChange={(e) => handleFieldChange('Indirect Expenses Increment', 'h68', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter amount"
          />
        </div>
      </div>
    </div>
  );

  // Handle asset tab switching with validation
  const handleAssetTabChange = (newTabIndex) => {
    const assetCategories = Object.keys(CURRENT_ASSET_SECTIONS);
    const currentCategoryName = assetCategories[activeAssetTab];
    const currentItems = getAssetItems(currentCategoryName);
    const hasItems = currentItems.some(item => item.description.trim() !== '' || (item.amount && item.amount !== 0));

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
    setVisitedAssetCategories(prev => new Set([...prev, activeAssetTab, newTabIndex]));

    // Switch to new tab
    setActiveAssetTab(newTabIndex);
  };

  const renderScheduleForAssets = () => {
    const assetCategories = Object.keys(CURRENT_ASSET_SECTIONS);
    const activeCategoryName = assetCategories[activeAssetTab] || assetCategories[0];
    const activeItems = getAssetItems(activeCategoryName);
    const sectionConfig = CURRENT_ASSET_SECTIONS[activeCategoryName];
    const maxItems = sectionConfig.end - sectionConfig.start + 1;

    // Calculate total for the current category
    const categoryTotal = activeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

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
              className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${activeAssetTab === idx
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
            {activeItems.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm italic">
                No items added yet. Click "Add Item" to start.
              </div>
            )}
            {activeItems.map((item) => (
              <div key={item.row} className="grid grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateAssetItem(item.row, 'd', e.target.value)}
                  className="col-span-6 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                />
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  placeholder="Amount"
                  min="0"
                  value={item.amount}
                  onChange={(e) => updateAssetItem(item.row, 'e', e.target.value)}
                  className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeAssetItem(item.row)}
                  className="col-span-1 px-2 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addAssetItem(activeCategoryName)}
            disabled={activeItems.length >= maxItems}
            className={`mt-3 px-4 py-2 text-xs rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 ${activeItems.length >= maxItems
              ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
              : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <PlusIcon className="w-4 h-4" />
            Add Item ({activeItems.length}/{maxItems})
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
  };

  const renderIndirectExpenseInput = (item, activeExpenseCategory) => {
    const fieldD = item.d;
    const fieldE = item.e;
    const label = item.label;

    return (
      <div key={fieldD} className="grid grid-cols-12 gap-3 py-2 border-b border-gray-100 last:border-0">
        <div className="col-span-7 flex items-center">
          <label className="text-sm text-gray-700">{label}</label>
        </div>
        <div className="col-span-5">
          <input
            type="number" onWheel={(e) => e.target.blur()}
            step="0.01"
            min="0"
            value={formData['Schedule for Indirect Expenses']?.[activeExpenseCategory]?.[fieldE] || 0}
            onChange={(e) => handleExpenseChange(activeExpenseCategory, fieldE, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>
    );
  };

  const renderScheduleForIndirectExpenses = () => {
    // Get expense categories from current tenure mapping
    const expenseCategories = Object.keys(CURRENT_INDIRECT_EXPENSES_DATA);
    const activeExpenseCategory = expenseCategories[indirectActiveTab] || expenseCategories[0];
    const activeExpenseItems = CURRENT_INDIRECT_EXPENSES_DATA[activeExpenseCategory];

    // Mapping for increment percentage
    const incrementMap = {
      'Administrative & Office Expenses': 'h65',
      'Employee Related Expenses': 'h64',
      'Selling and Distribution Expenses': 'h66',
      'General Overheads': 'h67',
      'Miscellaneous Expenses': 'h68'
    };
    const incrementKey = incrementMap[activeExpenseCategory];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Schedule for Indirect Expenses</h3>
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
          <h4 className="font-semibold text-gray-800 mb-4">{activeExpenseCategory}Rs per Month</h4>
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
                    <div className="col-span-7">
                      <label className="block text-sm font-semibold text-gray-700">
                        Salaries and wages (office & admin staff)
                      </label>
                      <span className="text-xs text-gray-500 block">(Auto-calculated from Employment Generation)</span>
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={totalSalaries}
                        readOnly
                        disabled
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })()
            )}
            {activeExpenseItems.map((item) => renderIndirectExpenseInput(item, activeExpenseCategory))}
          </div>

          {/* Increment Percentage Field */}
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
                    onChange={(e) => handleFieldChange('Indirect Expenses Increment', incrementKey, e.target.value)}
                    placeholder="Enter %"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreparedBy = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Partner Name 1 (Prepared By)
          </label>
          <input
            type="text"
            value={(formData['Prepared By'] && formData['Prepared By']['j136']) || ''}
            onChange={(e) => handleFieldChange('Prepared By', 'j136', e.target.value)}
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
            onChange={(e) => handleFieldChange('Prepared By', 'j137', e.target.value)}
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
            onChange={(e) => handleFieldChange('Prepared By', 'j138', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter mobile number"
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    const currentSectionKey = sections[currentStep].key;

    switch (currentSectionKey) {
      case 'general': return renderGeneralInformation();
      case 'term': return renderTermLoanDetails();
      case 'assets': return renderScheduleForAssets();
      case 'employment': return renderEmploymentGeneration();
      case 'expenses': return renderScheduleForIndirectExpenses();
      case 'prepared_by': return renderPreparedBy();
      default: return null;
    }
  };

  const handleNext = () => {
    if (canProceed && currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Transform formData to backend expected format
    const extractCellData = (obj, result = {}) => {
      for (const [key, value] of Object.entries(obj)) {
        // Check if key is a cell reference (like i7, d118, e118, etc.)
        if (/^[a-z]+\d+$/i.test(key)) {
          result[key] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively extract from nested objects
          extractCellData(value, result);
        }
      }
      return result;
    };

    let excelData = extractCellData(formData);

    excelData['j136'] = formData['Prepared By']?.['j136'] || '';
    excelData['j137'] = formData['Prepared By']?.['j137'] || '';
    excelData['j138'] = formData['Prepared By']?.['j138'] || '';

    if (excelData['i52'] && excelData['i52'].includes('-')) {
      const [year, month] = excelData['i52'].split('-');
      if (year && month) {
        excelData['i52'] = `${month.padStart(2, '0')}-01-${year}`;
      }
    }
    if (excelData['i53'] && excelData['i53'].includes('-')) {
      const [year, month] = excelData['i53'].split('-');
      const date = new Date(year, month - 1, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      excelData['i53'] = `${monthName}-${year.slice(-2)}`;
    }

    // Build loan percentages mapping for Excel cells K28-K39
    const loanPercentageCells = {};
    Object.entries(CURRENT_ASSET_SECTIONS).forEach(([categoryName, config]) => {
      if (config.loanCell) {
        loanPercentageCells[config.loanCell] = loanPercentages[categoryName] || 0;
      }
    });

    // Send in backend expected format with loan percentages and amounts
    // Send in backend expected format with loan percentages and amounts
    onSubmit({
      excelData,
      bank_name: formData['General Information']['bank_name'],
      branch_name: formData['General Information']['branch_name'],
      'Asset Loan Percentages': loanPercentages,
      'Loan Percentage Cells': loanPercentageCells
    });
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
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900 mb-2">
            Term Loan Application Form
          </h1>
          <p className="text-gray-600 text-sm">Service Sector (Without Stock)</p>
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
              disabled={!canProceed}
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

export default FRTermLoanForm;
