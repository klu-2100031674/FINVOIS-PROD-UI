import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

  for (let start = startYear; start <= startYear + 20; start++) {
    const endYear = start + 1;
    const endYearShort = endYear.toString().slice(-2);
    options.push(`${start}-${endYearShort}`);
  }
  return options;
};

// Asset categories
const ASSET_SECTIONS_DEFAULT = {
  'Plant and Machinery': { start: 136, end: 145, loanCell: 'k28' },
  'Service Equipment': { start: 146, end: 155, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 156, end: 165, loanCell: 'k30' },
  'Land': { start: 166, end: 168, loanCell: 'k31' },
  'Electrical Items & fittings': { start: 169, end: 177, loanCell: 'k32' },
  'Electronic Items': { start: 178, end: 187, loanCell: 'k33' },
  'Furniture and Fittings': { start: 188, end: 197, loanCell: 'k34' },
  'Vehicles': { start: 198, end: 207, loanCell: 'k35' },
  'Live stock': { start: 208, end: 216, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 217, end: 226, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 227, end: 236, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 237, end: 246, loanCell: 'k39' }
};

// Asset categories for tenure > 7 (shifted by +17 rows)
const ASSET_SECTIONS_TENURE_GT7 = {
  'Plant and Machinery': { start: 153, end: 162, loanCell: 'k28' },
  'Service Equipment': { start: 163, end: 172, loanCell: 'k29' },
  'Shed Construction and Civil works': { start: 173, end: 182, loanCell: 'k30' },
  'Land': { start: 183, end: 185, loanCell: 'k31' },
  'Electrical Items & fittings': { start: 186, end: 194, loanCell: 'k32' },
  'Electronic Items': { start: 195, end: 204, loanCell: 'k33' },
  'Furniture and Fittings': { start: 205, end: 214, loanCell: 'k34' },
  'Vehicles': { start: 215, end: 224, loanCell: 'k35' },
  'Live stock': { start: 225, end: 233, loanCell: 'k36' },
  'Other Assets (Nil Depreciation)': { start: 234, end: 243, loanCell: 'k37' },
  'Other Assets (Including Amortisable Assets)': { start: 244, end: 253, loanCell: 'k38' },
  'Non Current Assets (Deposits , Advances etc)': { start: 254, end: 263, loanCell: 'k39' }
};

// Helper function to get asset sections based on tenure
const getAssetSections = (tenure) => {
  if (tenure === undefined || tenure === null || tenure === '' || parseFloat(tenure) <= 7) {
    return ASSET_SECTIONS_DEFAULT;
  }
  return ASSET_SECTIONS_TENURE_GT7;
};

// Default for initialization
const ASSET_SECTIONS = ASSET_SECTIONS_DEFAULT;

const FRTermLoanWithStockForm = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null
}) => {
  const defaultFormData = {
    'General Information': {
      'i7': '', // Status of Concern
      'i8': '', // Name of proprietor
      'i9': '', // Mobile Number
      'i10': '', // Adhar number
      'i11': '', // PAN of proprietor
      'i12': '', // Age
      'i13': '', // Gender
      'i14': '', // Sector
      'i15': '', // Nature of Business
      'i16': '', // Address
      'i17': '', // Name of firm
      'i18': '', // Type of Entity
      'i19': '', // PAN of firm
      'i20': '', // Education Qualification
      'i21': '', // Project covered under which Scheme
      'i22': '', // Caste
      'i23': ''  // Unit location
    },
    'Prepared By': {
      'j136': '',
      'j137': '',
      'j138': ''
    },
    'Expected Employment Generation': {
      'i24': '', 'j24': '', // Skilled
      'i25': '', 'j25': '', // Semi Skilled
      'i26': '', 'j26': ''  // Unskilled
    },
    'Term Loan Details': {
      'h44': '', // Term Loan Rate of Interest
      'i45': '', // Installment period (Monthly/Quarterly/Half yearly)
      'i46': '', // Term Loan Tenure (Years)
      'i47': '', // Fixed EMI or Fixed Principal
      'i48': '', // Moratorium period
      'h49': '', // Processing fees rate
      'i51': '', // Loan Financial Year
      'i52': '', // Loan Start Month
      'i53': '', // From which month first sale bill
      'i54': '', // From which month first sale bill
      'i55': '', // No of months Turnover done in 1st FY
      'i56': ''  // No of months Turnover done in Next FY
    },
    'Indirect Expenses Increment': {
      'h64': '', // Employee Related Expenses
      'h65': '', // Administrative & Office Expenses
      'h66': '', // Selling and Distribution Expenses
      'h67': '', // General Overheads
      'h68': '', // Miscellaneous Expenses
      'i56': ''  // Average DSCR Ratio Required
    },
    'Schedule for Assets': (() => {
      const assets = {};
      Object.values(ASSET_SECTIONS).forEach(section => {
        for (let i = section.start; i <= section.end; i++) {
          assets[`d${i}`] = ''; // Description
          assets[`e${i}`] = ''; // Amount
        }
      });
      return assets;
    })(),
    'Schedule for Indirect Expenses': {
      'Administrative & Office Expenses': {
        'd251': 'Office rent', 'e251': 0,
        'd252': 'Electricity and water charges', 'e252': 0,
        'd253': 'Telephone, mobile & internet expenses', 'e253': 0,
        'd254': 'Postage and courier charges', 'e254': 0,
        'd255': 'Printing and stationery', 'e255': 0,
        'd256': 'Office maintenance & repairs', 'e256': 0,
        'd257': 'Petrol, Diesel and Gas Charges', 'e257': 0,
        'd258': 'Computer maintenance & AMC', 'e258': 0,
        'd259': 'Legal and professional fees', 'e259': 0,
        'd260': 'Audit fees', 'e260': 0,
        'd261': 'Consultancy charges', 'e261': 0,
        'd262': 'License and registration fees', 'e262': 0,
        'd263': 'Bank charges', 'e263': 0,
        'd264': 'Software subscription fees', 'e264': 0,
        'd265': 'Security expenses', 'e265': 0,
        'd266': 'Office cleaning expenses', 'e266': 0,
        'd267': 'Staff welfare expenses', 'e267': 0,
        'd268': 'Conveyance expenses', 'e268': 0,
        'd269': 'Travelling expenses (non-production staff)', 'e269': 0,
        'd270': 'Meeting & conference expenses', 'e270': 0,
        'd271': 'Other Administrative & Office Expenses', 'e271': 0
      },
      'Employee Related Expenses': {
        'd273': 'Provident fund and ESI contribution', 'e273': 0,
        'd274': 'Gratuity and pension', 'e274': 0,
        'd275': 'Staff training and development', 'e275': 0,
        'd276': 'Recruitment expenses', 'e276': 0,
        'd277': 'Employee insurance', 'e277': 0,
        'd278': 'Refreshments & canteen expenses (office staff)', 'e278': 0,
        'd279': 'Other Employee related expenses', 'e279': 0
      },
      'Selling and Distribution Expenses': {
        'd280': 'Advertising & publicity', 'e280': 0,
        'd281': 'Sales promotion expenses', 'e281': 0,
        'd282': 'Trade show / exhibition expenses', 'e282': 0,
        'd283': 'Dealer commission', 'e283': 0,
        'd284': 'Freight inward', 'e284': 0,
        'd285': 'Freight and forwarding (outward)', 'e285': 0,
        'd286': 'Packing and delivery expenses', 'e286': 0,
        'd287': 'Customer discounts / rebates', 'e287': 0,
        'd288': 'Warranty & after-sales service expenses', 'e288': 0,
        'd289': 'Bad debts written off', 'e289': 0,
        'd290': 'Business entertainment expenses', 'e290': 0,
        'd291': 'Other Selling and Distribution Expenses', 'e291': 8000
      },
      'General Overheads': {
        'd292': 'Insurance (office, employee, general liability)', 'e292': 0,
        'd293': 'Repairs & maintenance (non-production)', 'e293': 0,
        'd294': 'Subscription & membership fees', 'e294': 0,
        'd295': 'Vehicle running expenses (admin vehicles)', 'e295': 0,
        'd296': 'Fuel & maintenance for delivery vehicles', 'e296': 0,
        'd297': 'Rent, rates, and taxes (non-factory premises)', 'e297': 0,
        'd298': 'AMC (Annual Maintenance Contracts)', 'e298': 0,
        'd299': 'Other General Overhead expenses', 'e299': 10000
      },
      'Miscellaneous Expenses': {
        'd300': 'Donation & charity (if not CSR)', 'e300': 0,
        'd301': 'CSR expenses', 'e301': 0,
        'd302': 'Loss on sale of fixed assets', 'e302': 0,
        'd303': 'Provision for doubtful debts', 'e303': 0,
        'd304': 'Entertainment & hospitality', 'e304': 0,
        'd305': 'Gifts and samples', 'e305': 0,
        'd306': 'Internet domain renewal & web hosting', 'e306': 0,
        'd307': 'Miscellaneous expenses', 'e307': 0
      }
    }
  };

  const [formData, setFormData] = useState(() => {
    if (initialData && Object.keys(initialData).length > 0) {
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

  // Loan percentage state for each asset category (maps to K28-K39)
  const [loanPercentages, setLoanPercentages] = useState(() => {
    if (initialData && initialData['Asset Loan Percentages']) {
      return initialData['Asset Loan Percentages'];
    }
    // Default all categories to 0%
    const defaults = {};
    Object.keys(ASSET_SECTIONS).forEach(category => {
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
    Object.keys(ASSET_SECTIONS).forEach(category => {
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
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  // Load loan percentages from initialData if available
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      if (initialData['Asset Loan Percentages']) {
        setLoanPercentages(initialData['Asset Loan Percentages']);
      }
    }
  }, [initialData]);

  // Calculate loan amount from percentage (for display purposes)
  const calculateLoanAmount = (category, total) => {
    const percentage = loanPercentages[category] || 0;
    return (total * percentage) / 100;
  };

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

  const requiredFields = {
    'General Information': ['i7', 'i8', 'i9', 'i14', 'i15', 'i16', 'i18', 'i20', 'i21', 'i22', 'i23'],
    'Expected Employment Generation': ['i24', 'i25', 'i26'],
    'Term Loan Details': ['h44', 'i45', 'i46', 'i47', 'i48', 'h49', 'i51', 'i52', 'i53'],
    'Indirect Expenses Increment': ['h64', 'h65', 'h66', 'h67', 'h68', 'i56'],
    'Schedule for Assets': [],
    'Schedule for Indirect Expenses': []
  };

  const canProceed = useMemo(() => {
    const currentSection = sections[currentStep];
    const sectionKey = currentSection.key;

    const sectionDataKeys = {
      'general': 'General Information',
      'employment': 'Expected Employment Generation',
      'term': 'Term Loan Details',
      'indirect': 'Indirect Expenses Increment',
      'assets': 'Schedule for Assets',
      'expenses': 'Schedule for Indirect Expenses'
    };

    const dataKey = sectionDataKeys[sectionKey];
    const required = requiredFields[dataKey] || [];

    // Special validation for Schedule for Assets
    if (sectionKey === 'assets') {
      const currentSections = getAssetSections(formData['Term Loan Details']?.['i46']);
      const assetCategories = Object.keys(currentSections);

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

    if (required.length === 0) return true;

    const sectionData = formData[dataKey] || {};
    return required.every(fieldId => {
      const value = sectionData[fieldId];
      return value !== undefined && value !== null && value !== '';
    });
  }, [formData, currentStep, sections, visitedAssetCategories, categoriesWithItems, loanPercentages]);

  const handleFieldChange = useCallback((sectionTitle, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionTitle]: {
        ...prev[sectionTitle],
        [fieldId]: value
      }
    }));
  }, []);

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

  const getAssetItems = useCallback((sectionName) => {
    const section = getAssetSections(formData['Term Loan Details']?.['i46'])[sectionName];
    if (!section) return [];
    const items = [];
    for (let i = section.start; i <= section.end; i++) {
      const desc = formData['Schedule for Assets'][`d${i}`];
      const amount = formData['Schedule for Assets'][`e${i}`];
      // Show row if it has data, or if it's the first row and no data exists in the section (optional, but good for UX)
      // Actually, for "Add Item" logic, we just want to show rows that are "active".
      // Since we don't have an "active" flag, we infer it from data presence.
      // But if user clears data, the row disappears? That's bad.
      // We should probably show all rows that have data, plus one empty row if available?
      // Or just rely on "Add Item" to find the next empty row and "activate" it by setting a placeholder or just rendering it.
      // But wait, if the data is empty, how do we know it's "added"?
      // We can check if the key exists in formData? No, we initialized all keys.
      // Let's assume "added" means description or amount is not empty string.
      if (desc !== '' || amount !== '') {
        items.push({ row: i, description: desc, amount: amount });
      }
    }
    return items;
  }, [formData]);

  const addAssetItem = useCallback((sectionName) => {
    const section = getAssetSections(formData['Term Loan Details']?.['i46'])[sectionName];
    let emptyRow = -1;
    for (let i = section.start; i <= section.end; i++) {
      const desc = formData['Schedule for Assets'][`d${i}`];
      const amount = formData['Schedule for Assets'][`e${i}`];
      if ((desc === '' || desc === undefined) && (amount === '' || amount === undefined || amount === 0)) {
        emptyRow = i;
        break;
      }
    }

    if (emptyRow !== -1) {
      setFormData(prev => ({
        ...prev,
        'Schedule for Assets': {
          ...prev['Schedule for Assets'],
          [`d${emptyRow}`]: 'New Item',
          [`e${emptyRow}`]: 0
        }
      }));
      // Track that this category now has items
      setCategoriesWithItems(prev => new Set([...prev, sectionName]));
    } else {
      alert('Maximum items reached for this category.');
    }
  }, [formData]);

  const updateAssetItem = useCallback((row, field, value) => {
    // Find which category this row belongs to
    let categoryName = null;
    const currentSections = getAssetSections(formData['Term Loan Details']?.['i46']);
    for (const [cat, config] of Object.entries(currentSections)) {
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
        const section = currentSections[categoryName];
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

  const removeAssetItem = useCallback((row) => {
    // Find which category this row belongs to
    let categoryName = null;
    const currentSections = getAssetSections(formData['Term Loan Details']?.['i46']);
    for (const [cat, config] of Object.entries(currentSections)) {
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
        const section = currentSections[categoryName];
        let hasItems = false;
        for (let i = section.start; i <= section.end; i++) {
          const desc = newData['Schedule for Assets'][`d${i}`] || '';
          const amount = newData['Schedule for Assets'][`e${i}`] || '';
          if (desc !== '' || (amount !== '' && amount !== 0 && amount !== '0')) {
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
    // Generate test data for assets section
    const assetsData = {};
    Object.keys(ASSET_SECTIONS).forEach(category => {
      const section = ASSET_SECTIONS[category];
      for (let i = section.start; i <= section.end; i++) {
        if (i === section.start) {
          assetsData[`d${i}`] = `${category} Item 1`;
          assetsData[`e${i}`] = '2';
        } else {
          assetsData[`d${i}`] = '';
          assetsData[`e${i}`] = '';
        }
      }
    });

    // Generate test data for indirect expenses - maintain nested structure
    const expensesData = {};
    const expenseCategories = [
      { name: 'Administrative & Office Expenses', rows: [251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271] },
      { name: 'Employee Related Expenses', rows: [273, 274, 275, 276, 277, 278, 279] }, // Skip 272 - auto-generated in Excel
      { name: 'Selling and Distribution Expenses', rows: [280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291] },
      { name: 'General Overheads', rows: [292, 293, 294, 295, 296, 297, 298, 299] },
      { name: 'Miscellaneous Expenses', rows: [300, 301, 302, 303, 304, 305, 306, 307] }
    ];

    expenseCategories.forEach((cat) => {
      // Create a copy of the category object to avoid read-only property error
      expensesData[cat.name] = { ...defaultFormData['Schedule for Indirect Expenses'][cat.name] };
      cat.rows.forEach((row, idx) => {
        const value = idx === 0 ? (Math.floor(Math.random() * 5000) + 5000) : 0;
        expensesData[cat.name][`e${row}`] = value;
      });
    });

    // Do NOT touch d272 and e272 - these have auto-generated values in Excel
    // Keep them exactly as they are in defaultFormData

    // Loan percentages for each asset category
    const loanPercentagesData = {};
    Object.keys(ASSET_SECTIONS).forEach((category, idx) => {
      loanPercentagesData[category] = 50 + (idx % 3) * 10; // Varying percentages
    });

    setFormData(prev => ({
      ...prev,
      'General Information': {
        'i7': 'Sole Proprietorship',
        'i8': 'John Doe',
        'i9': '9876543210',
        'i10': '123456789012',
        'bank_name': 'HDFC Bank',
        'branch_name': 'Corporate Branch',
        'j136': 'Partner X',
        'j137': 'Partner Y',
        'j138': '9876543210',
        'i11': 'ABCDE1234F',
        'i12': '35',
        'i13': 'Male',
        'i14': 'Manufacturing sector',
        'i15': 'Manufacturing of Goods',
        'i16': '123 Industrial Area',
        'i17': 'JD Enterprises',
        'i18': 'New',
        'i19': 'ABCDE1234F',
        'i20': 'Graduate',
        'i21': 'PMEGP',
        'i22': 'OC',
        'i23': 'Urban(Other than Panchayat)'
      },
      'Expected Employment Generation': {
        'i24': '5', 'j24': '100000',
        'i25': '3', 'j25': '45000',
        'i26': '2', 'j26': '20000'
      },
      'Term Loan Details': {
        'h44': '10',
        'i45': 'Monthly',
        'i46': '5',
        'i47': 'Fixed EMI',
        'i48': '6',
        'h49': '1',
        'i51': '2025-26',
        'i52': '2025-04',
        'i53': '2025-04',
      },
      'Indirect Expenses Increment': {
        'h64': '5', 'h65': '2', 'h66': '2', 'h67': '1', 'h68': '1', 'i56': '2.5'
      },
      'Schedule for Assets': assetsData,
      'Schedule for Indirect Expenses': expensesData
    }));

    // Set loan percentages
    setLoanPercentages(loanPercentagesData);
  }, []);

  // Handle asset tab switching with validation
  const handleAssetTabChange = (newTabIndex) => {
    const currentSections = getAssetSections(formData['Term Loan Details']?.['i46']);
    const assetCategories = Object.keys(currentSections);
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

  const handleNext = () => {
    if (canProceed && currentStep < sections.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const extractCellData = (obj, result = {}) => {
      for (const [key, value] of Object.entries(obj)) {
        if (/^[a-z]+\d+$/i.test(key)) {
          result[key] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          extractCellData(value, result);
        }
      }
      return result;
    };

    let excelData = extractCellData(formData);

    // Convert month inputs to MM-01-YYYY format (e.g., 04-01-2025)
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
    const currentSections = getAssetSections(formData['Term Loan Details']?.['i46']);
    Object.entries(currentSections).forEach(([categoryName, config]) => {
      if (config.loanCell) {
        loanPercentageCells[config.loanCell] = loanPercentages[categoryName] || 0;
      }
    });



    excelData['j136'] = formData['Prepared By']?.['j136'] || '';
    excelData['j137'] = formData['Prepared By']?.['j137'] || '';
    excelData['j138'] = formData['Prepared By']?.['j138'] || '';

    onSubmit({
      excelData,
      bank_name: formData['General Information']['bank_name'],
      branch_name: formData['General Information']['branch_name'],
      'Asset Loan Percentages': loanPercentages,
      'Loan Percentage Cells': loanPercentageCells
    });
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
    switch (sections[currentStep].key) {
      case 'general':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status of Concern</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i7']}
                onChange={(e) => handleFieldChange('General Information', 'i7', e.target.value)}
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Name of Proprietor/MD</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i8']}
                onChange={(e) => handleFieldChange('General Information', 'i8', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i9']}
                onChange={(e) => handleFieldChange('General Information', 'i9', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Aadhar Number (Optional)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i10']}
                onChange={(e) => handleFieldChange('General Information', 'i10', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Bank Name / Department Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['bank_name'] || ''}
                onChange={(e) => handleFieldChange('General Information', 'bank_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Branch Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['branch_name'] || ''}
                onChange={(e) => handleFieldChange('General Information', 'branch_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Partner Name 1 (Prepared By)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['j136'] || ''}
                onChange={(e) => handleFieldChange('General Information', 'j136', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Partner Name 2 (Prepared By)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['j137'] || ''}
                onChange={(e) => handleFieldChange('General Information', 'j137', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Mobile Number (Prepared By)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['j138'] || ''}
                onChange={(e) => handleFieldChange('General Information', 'j138', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">PAN of Proprietor (Optional)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i11']}
                onChange={(e) => handleFieldChange('General Information', 'i11', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number" onWheel={(e) => e.target.blur()}
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i12']}
                onChange={(e) => handleFieldChange('General Information', 'i12', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i13']}
                onChange={(e) => handleFieldChange('General Information', 'i13', e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Sector</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i14']}
                onChange={(e) => handleFieldChange('General Information', 'i14', e.target.value)}
              >
                <option value="">Select Sector</option>
                <option value="Manufacturing sector">Manufacturing sector</option>
                <option value="Service Sector (With stock)">Service Sector (With stock)</option>
                <option value="Service sector (Without stock)">Trading sector</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nature of Business</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i15']}
                onChange={(e) => handleFieldChange('General Information', 'i15', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i16']}
                onChange={(e) => handleFieldChange('General Information', 'i16', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Name of Firm/Company (Optional)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i17']}
                onChange={(e) => handleFieldChange('General Information', 'i17', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Type of Entity</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i18']}
                onChange={(e) => handleFieldChange('General Information', 'i18', e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="New">New</option>
                <option value="Existing">Existing</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">PAN of Firm/Company (Optional)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i19']}
                onChange={(e) => handleFieldChange('General Information', 'i19', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Education Qualification</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i20']}
                onChange={(e) => handleFieldChange('General Information', 'i20', e.target.value)}
              >
                <option value="">Select Qualification</option>
                <option value="Below 8th">Below 8th</option>
                <option value="Above 8th">Above 8th</option>
                <option value="SSC 10th+2">SSC 10th</option>
                <option value="SSC 10th+2">intermediate +2</option>
                <option value="Graduate">Graduate</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Scheme</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i21']}
                onChange={(e) => handleFieldChange('General Information', 'i21', e.target.value)}
              >
                <option value="">Select Scheme</option>
                <option value="AP IDP 4.0">AP IDP 4.0</option>
                <option value="Industrial park Land Allotment">Industrial park Land Allotment</option>
                <option value="PMEGP">PMEGP</option>
                <option value="Mudra">Mudra</option>
                <option value="Mudra">PMFME</option>
                <option value="Mudra">PMMSY</option>
                <option value="Mudra">Startup India</option>
                <option value="Other MSME">Other MSME</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Caste</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i22']}
                onChange={(e) => handleFieldChange('General Information', 'i22', e.target.value)}
              >
                <option value="">Select Caste</option>
                <option value="OC">OC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="BC">BC</option>
                <option value="Minority">Minority</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Unit Location</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['General Information']['i23']}
                onChange={(e) => handleFieldChange('General Information', 'i23', e.target.value)}
              >
                <option value="">Select Location</option>
                <option value="Rural(Panchayat)">Rural(Panchayat)</option>
                <option value="Urban(Other than Panchayat)">Urban(Other than Panchayat)</option>
              </select>
            </div>
          </div>
        );

      case 'employment':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Skilled Employees</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData['Expected Employment Generation']['i24']}
                  onChange={(e) => handleFieldChange('Expected Employment Generation', 'i24', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Salary per Employee Per Month</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData['Expected Employment Generation']['j24']}
                  onChange={(e) => handleFieldChange('Expected Employment Generation', 'j24', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Semi Skilled Employees</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData['Expected Employment Generation']['i25']}
                  onChange={(e) => handleFieldChange('Expected Employment Generation', 'i25', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Salary per Employee Per Month</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData['Expected Employment Generation']['j25']}
                  onChange={(e) => handleFieldChange('Expected Employment Generation', 'j25', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Unskilled Employees</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData['Expected Employment Generation']['i26']}
                  onChange={(e) => handleFieldChange('Expected Employment Generation', 'i26', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Salary per Employee Per Month</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData['Expected Employment Generation']['j26']}
                  onChange={(e) => handleFieldChange('Expected Employment Generation', 'j26', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'term':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
              <input
                type="number" onWheel={(e) => e.target.blur()}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['h44']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'h44', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Installment Period</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['i45']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'i45', e.target.value)}
              >
                <option value="">Select Period</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half yearly">Half yearly</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tenure (Years)</label>
              <input
                type="number" onWheel={(e) => e.target.blur()}
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['i46']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'i46', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Repayment Type</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['i47']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'i47', e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="Fixed EMI">Fixed EMI</option>
                <option value="Fixed Principal">Fixed Principal</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Moratorium Period (Months)</label>
              <input
                type="number" onWheel={(e) => e.target.blur()}
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['i48']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'i48', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Processing Fees Rate (%)</label>
              <input
                type="number" onWheel={(e) => e.target.blur()}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['h49']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'h49', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Loan Financial Year</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['i51']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'i51', e.target.value)}
              >
                <option value="">Select Year</option>
                {generateFinancialYearOptions().map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Loan Start Month (Month immediately after Sanction Month)</label>
              <input
                type="month"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['i52']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'i52', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">First sale bill month</label>
              <input
                type="month"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Term Loan Details']['i53']}
                onChange={(e) => handleFieldChange('Term Loan Details', 'i53', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Average DSCR Ratio Required</label>
              <input
                type="number" onWheel={(e) => e.target.blur()}
                step="0.01"
                min="1.75"
                max="5.0"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData['Indirect Expenses Increment']['i56']}
                onChange={(e) => handleFieldChange('Indirect Expenses Increment', 'i56', e.target.value)}
              />
            </div>
          </div>
        );

      case 'assets':
        const currentSections = getAssetSections(formData['Term Loan Details']?.['i46']);
        const assetCategories = Object.keys(currentSections);
        const activeCategoryName = assetCategories[activeAssetTab] || assetCategories[0];
        const activeItems = getAssetItems(activeCategoryName);
        const sectionConfig = currentSections[activeCategoryName];
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

      case 'expenses':
        const expenseCategories = Object.keys(formData['Schedule for Indirect Expenses']);
        const activeCategory = expenseCategories[indirectActiveTab] || expenseCategories[0];
        const activeExpenses = formData['Schedule for Indirect Expenses'][activeCategory];

        // Mapping for increment percentage
        const incrementMap = {
          'Administrative & Office Expenses': 'h65',
          'Employee Related Expenses': 'h64',
          'Selling and Distribution Expenses': 'h66',
          'General Overheads': 'h67',
          'Miscellaneous Expenses': 'h68'
        };
        const incrementKey = incrementMap[activeCategory];

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
              <h4 className="font-semibold text-gray-800 mb-4">{activeCategory}(Rs per Month)</h4>

              <div className="space-y-2">
                {activeCategory === 'Employee Related Expenses' && (
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
                {Object.entries(activeExpenses).map(([key, value]) => {
                  if (key.startsWith('d')) return null; // Skip label keys
                  if (key === 'totalComponents') return null;

                  // Find corresponding label key (e.g., e251 -> d251)
                  const labelKey = 'd' + key.substring(1);
                  const label = activeExpenses[labelKey];

                  return (
                    <div key={key} className="grid grid-cols-12 gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="col-span-7 flex items-center">
                        <label className="text-sm text-gray-700">{label}</label>
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number" onWheel={(e) => e.target.blur()}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          value={value}
                          onChange={(e) => handleExpenseChange(activeCategory, key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Increment Percentage Field */}
              {incrementKey && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <label className="block text-sm font-semibold text-indigo-700 mb-1">
                      {activeCategory} Increment Percentage
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

      case 'prepared_by': return renderPreparedBy();
      default: return null;
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
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900 mb-2">
            Term Loan Application Form
          </h1>
          <p className="text-gray-600 text-sm">Manufacturing & Service Sector (With Stock)</p>
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

export default FRTermLoanWithStockForm;
