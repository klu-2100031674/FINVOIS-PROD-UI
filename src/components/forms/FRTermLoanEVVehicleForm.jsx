import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  DocumentTextIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

import SaveDraftButton from '../common/SaveDraftButton';
import { FRCC_REQUIRED_STAMP_DEFAULT } from '../../utils/frccFormUi';

const generateFinancialYearOptions = () => {
  const options = [];
  for (let start = 2024; start <= 2033; start++) {
    options.push(`${start}-${(start + 1).toString().slice(-2)}`);
  }
  return options;
};

// Asset categories — EV form only exposes Commercial Vehicles (Assumptions rows 185-194)
const ASSET_SECTIONS_DEFAULT = {
  'Commercial Vehicles': { start: 185, end: 194, loanCell: 'k35' },
};

// EV workbook currently ships only for tenure ≤ 7
const ASSET_SECTIONS_TENURE_GT7 = ASSET_SECTIONS_DEFAULT;

// Helper function to get asset sections based on tenure
const getAssetSections = (_tenure) => ASSET_SECTIONS_DEFAULT;

// Indirect expenses — EV-filtered fields only (service-without-stock / EV sheet cells)
const INDIRECT_EXPENSES_DATA_DEFAULT = {
  "Administrative & Office Expenses": [
    { label: "Office rent", d: "d239", e: "e239" },
    { label: "Repairs and Maintenance", d: "d244", e: "e244" },
  ],
  "Employee Related Expenses": [],
  "Selling and Distribution Expenses": [
    { label: "Sales promotion expenses", d: "d269", e: "e269" },
    { label: "Dealer commission", d: "d271", e: "e271" },
    { label: "Other Selling and Distribution Expenses", d: "d279", e: "e279" },
  ],
  "General Overheads": [
    { label: "Vehicle Insurance", d: "d280", e: "e280" },
  ],
  "Miscellaneous Expenses": [
    { label: "Loss on sale of fixed assets", d: "d290", e: "e290" },
    { label: "Miscellaneous expenses", d: "d295", e: "e295" },
  ],
};

const INDIRECT_EXPENSES_DATA_TENURE_GT7 = INDIRECT_EXPENSES_DATA_DEFAULT;

// Helper function to get indirect expenses data based on tenure
const getIndirectExpensesData = (_tenure) => INDIRECT_EXPENSES_DATA_DEFAULT;

/** Nested shape expected by the form: { [category]: { dNNN, eNNN, ... } } */
const buildNestedIndirectScheduleForTenure = (tenure) => {
  const newExpensesData = getIndirectExpensesData(tenure);
  const nested = {};
  Object.entries(newExpensesData).forEach(([categoryName, rows]) => {
    nested[categoryName] = {};
    rows.forEach((item) => {
      nested[categoryName][item.d] = item.label;
      nested[categoryName][item.e] = 0;
    });
  });
  return nested;
};

const EXPENSE_INCREMENT_MAP = {
  'Employee Related Expenses': 'h64',
  'Administrative & Office Expenses': 'h65',
  'Selling and Distribution Expenses': 'h66',
  'General Overheads': 'h67',
  'Miscellaneous Expenses': 'h68'
};

const EXPENSE_INCREMENT_REVERSE_MAP = Object.entries(EXPENSE_INCREMENT_MAP).reduce((acc, [category, field]) => {
  if (field) {
    acc[field] = category;
  }
  return acc;
}, {});

const EV_SECTOR_LABEL = 'service sector without stock';

const FRTermLoanEVVehicleForm = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null,
  templateId = null,
  presetSector = null,
  lockSector = false,
  onSaveDraft = null,
  savingDraft = false,
}) => {
  const defaultFormData = {
    'General Information': {},
    'Expected Employment Generation': {},
    'Term Loan Details': {},
    'Prepared By': {
      'j136': 'PARVEZ AND NARAYANA',
      'j137': 'Chartered Accountants',
      'j138': 'Vijayawada',
      'j139': '9014221011',
      'required_stamp': FRCC_REQUIRED_STAMP_DEFAULT
    },
    'Indirect Expenses Increment': {
      'i56': '',
      'h64': '',
      'h65': '',
      'h66': '',
      'h67': '',
      'h68': ''
    },
    'Cost of Project': {},
    'Schedule for Assets': {},
    'Schedule for Indirect Expenses': {
      'Administrative & Office Expenses': {
        'd239': 'Office rent', 'e239': 0,
        'd244': 'Repairs and Maintenance', 'e244': 0,
      },
      'Employee Related Expenses': {},
      'Selling and Distribution Expenses': {
        'd269': 'Sales promotion expenses', 'e269': 0,
        'd271': 'Dealer commission', 'e271': 0,
        'd279': 'Other Selling and Distribution Expenses', 'e279': 0,
      },
      'General Overheads': {
        'd280': 'Vehicle Insurance', 'e280': 0,
      },
      'Miscellaneous Expenses': {
        'd290': 'Loss on sale of fixed assets', 'e290': 0,
        'd295': 'Miscellaneous expenses', 'e295': 0,
      }
    },
    'Vehicle Related': {
      'e299': '',
      'e300': '',
      'e301': '',
    }
  };

  const [formData, setFormData] = useState(() => {
    const ensureEvSector = (gi) => {
      if (!gi || typeof gi !== 'object') return gi;
      return { ...gi, i14: presetSector || EV_SECTOR_LABEL };
    };

    if (initialData && Object.keys(initialData).length > 0) {
      // Merge initialData with default structure
      const merged = { ...defaultFormData };
      for (const key in initialData) {
        if (Object.hasOwn(initialData, key)) {
          if (typeof initialData[key] === 'object' && initialData[key] !== null && typeof merged[key] === 'object' && merged[key] !== null) {
            merged[key] = { ...merged[key], ...initialData[key] };
          } else {
            merged[key] = initialData[key];
          }
        }
      }
      merged['General Information'] = ensureEvSector(merged['General Information'] || {});
      return merged;
    }
    const base = {
      ...defaultFormData,
      'General Information': { ...(defaultFormData['General Information'] || {}) },
    };
    base['General Information'].i14 = presetSector || EV_SECTOR_LABEL;
    return base;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [activeAssetTab, setActiveAssetTab] = useState(0);
  const [indirectActiveTab, setIndirectActiveTab] = useState(0);
  const [visitedExpenseCategories, setVisitedExpenseCategories] = useState(new Set([0]));
  const [expenseValidationErrors, setExpenseValidationErrors] = useState({});

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
  const lastNextDisabledSignatureRef = useRef('');

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
  // Track rows that should stay visible even if user clears text/amount
  const [assetVisibleRowsByCategory, setAssetVisibleRowsByCategory] = useState({});

  // Error states for validation
  const [assetValidationErrors, setAssetValidationErrors] = useState({});

  const sections = [
    { key: 'general', title: 'General Information', icon: DocumentTextIcon },
    { key: 'term', title: 'Means of Finance details', icon: CreditCardIcon },
    { key: 'assets', title: 'cost of the project', icon: BuildingOfficeIcon },
    { key: 'employment', title: 'Expected Employment Generation', icon: ChartBarIcon },
    { key: 'expenses', title: 'Schedule for Indirect Expenses (Per Month)', icon: CurrencyRupeeIcon },
    { key: 'vehicle_related', title: 'Vehicle Related', icon: CalendarIcon },
    { key: 'prepared_by', title: 'Prepared By', icon: BuildingOfficeIcon }
  ];

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData(prevFormData => {
        const merged = { ...prevFormData };
        for (const sectionKey in initialData) {
          if (Object.hasOwn(initialData, sectionKey)) {
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
    if (initialData?.['Asset Loan Percentages']) {
      setLoanPercentages(initialData['Asset Loan Percentages']);
    }
    if (initialData?.['Asset Loan Amounts']) {
      setLoanAmounts(initialData['Asset Loan Amounts']);
    }
  }, [initialData]);

  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  useEffect(() => {
    setAssetVisibleRowsByCategory(prev => {
      const next = { ...prev };

      Object.entries(CURRENT_ASSET_SECTIONS).forEach(([categoryName, section]) => {
        const rowSet = new Set(next[categoryName] || []);

        for (let i = section.start; i <= section.end; i++) {
          const desc = formData['Schedule for Assets']?.[`d${i}`] || '';
          const amount = formData['Schedule for Assets']?.[`e${i}`] || '';
          const hasAmount = amount !== '' && amount !== null && amount !== undefined && Number(amount) !== 0;

          if (desc !== '' || hasAmount) {
            rowSet.add(i);
          }
        }

        next[categoryName] = Array.from(rowSet).sort((a, b) => a - b);
      });

      return next;
    });
  }, [CURRENT_ASSET_SECTIONS, formData]);

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
    // 1. First time entering tenure > 7 (default form is already ≤7 layout)
    // 2. Crossing the 7-year threshold (≤7 to >7 or vice versa)
    // 3. First time entering tenure > 7 from a prior GT7 state (ref reset)
    const shouldReinitialize =
      (prevTenure === null && currentIsGT7) ||
      (prevTenure !== null && prevIsGT7 !== currentIsGT7) ||
      (currentIsGT7 && !expensesInitializedForGT7Ref.current);

    if (shouldReinitialize) {
      console.log('🔄 [TERM_LOAN] Reinitializing indirect expenses', {
        prevTenure,
        liveTenure,
        prevIsGT7,
        currentIsGT7,
        reason: prevTenure === null && currentIsGT7 ? 'first-entry-gt7' : prevIsGT7 !== currentIsGT7 ? 'threshold-crossed' : 'first-GT7'
      });

      const nestedIndirect = buildNestedIndirectScheduleForTenure(liveTenure);

      console.log('🔄 [TERM_LOAN] New expenses initialized', {
        expenseCategories: Object.keys(nestedIndirect).length,
        sampleCategory: Object.keys(nestedIndirect)[0]
      });

      setFormData(prev => ({
        ...prev,
        'Schedule for Indirect Expenses': nestedIndirect
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
    'General Information': ['i7', 'i8', 'i9', 'i14', 'i15', 'i16', 'i19', 'i20', 'i21', 'i22', 'i12', 'i13'],
    'Expected Employment Generation': ['i24', 'i25', 'i26'],
    'Term Loan Details': ['h44', 'i45', 'i46', 'i47', 'i48', 'h49', 'i51', 'i52', 'i53'],
    'Indirect Expenses Increment': ['h64', 'h65', 'h66', 'h67', 'h68'],
    'Schedule for Assets': [],
    'Schedule for Indirect Expenses': [],
    'Vehicle Related': ['e299', 'e300', 'e301'],
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
      'expenses': 'Schedule for Indirect Expenses',
      'vehicle_related': 'Vehicle Related',
    };

    const dataKey = sectionDataKeys[sectionKey];
    const required = requiredFields[dataKey] || [];

    // Special validation for Schedule for Assets
    if (sectionKey === 'assets') {
      return true;
    }

    if (sectionKey === 'term') {
      const termValid = required.every(field => {
        const value = formData[dataKey]?.[field];
        return value !== undefined && value !== '' && value !== null;
      });

      // DSCR is captured in "Indirect Expenses Increment" section (i56)
      const dscrValue = formData['Indirect Expenses Increment']?.['i56'];
      const dscrValid = dscrValue !== undefined && dscrValue !== '' && dscrValue !== null;

      return termValid && dscrValid;
    }

    if (required.length === 0) return true; // No required fields for this section

    const sectionData = formData[dataKey] || {};
    return required.every(fieldId => {
      const value = sectionData[fieldId];
      return value !== undefined && value !== null && value !== '';
    });
  }, [formData, currentStep, sections]);

  useEffect(() => {
    if (currentStep >= sections.length - 1) {
      lastNextDisabledSignatureRef.current = '';
      return;
    }

    const currentSection = sections[currentStep];
    const sectionKey = currentSection?.key;

    if (canProceed) {
      const signature = `${sectionKey}|enabled`;
      if (lastNextDisabledSignatureRef.current !== signature) {
        console.log('✅ [FRTermLoanForm] Next button enabled', {
          step: currentStep,
          sectionKey,
          sectionTitle: currentSection?.title
        });
        lastNextDisabledSignatureRef.current = signature;
      }
      return;
    }

    const sectionDataKeys = {
      general: 'General Information',
      employment: 'Expected Employment Generation',
      term: 'Term Loan Details',
      indirect: 'Indirect Expenses Increment',
      cost: 'Cost of Project',
      assets: 'Schedule for Assets',
      expenses: 'Schedule for Indirect Expenses',
      vehicle_related: 'Vehicle Related',
    };

    const dataKey = sectionDataKeys[sectionKey];
    const sectionData = formData[dataKey] || {};
    const required = requiredFields[dataKey] || [];
    const missing = required.filter((field) => {
      const value = sectionData[field];
      return value === undefined || value === null || value === '';
    });

    if (sectionKey === 'term') {
      const dscrValue = formData['Indirect Expenses Increment']?.['i56'];
      if (dscrValue === undefined || dscrValue === null || dscrValue === '') {
        missing.push('Indirect Expenses Increment.i56 (Average DSCR Ratio required)');
      }
    }

    const signature = `${sectionKey}|${missing.join(',')}`;
    if (lastNextDisabledSignatureRef.current !== signature) {
      console.warn('⛔ [FRTermLoanForm] Next button disabled', {
        step: currentStep,
        sectionKey,
        sectionTitle: currentSection?.title,
        dataKey,
        missingFields: missing
      });
      lastNextDisabledSignatureRef.current = signature;
    }
  }, [canProceed, currentStep, formData, sections]);

  const handleFieldChange = useCallback((sectionTitle, fieldId, value) => {
    if (
      lockSector &&
      sectionTitle === 'General Information' &&
      fieldId === 'i14'
    ) {
      return;
    }
    const normalizedValue =
      sectionTitle === 'General Information' && (fieldId === 'i11' || fieldId === 'i18')
        ? String(value || '').toUpperCase()
        : value;

    setFormData(prev => {
      const newData = {
        ...prev,
        [sectionTitle]: {
          ...prev[sectionTitle],
          [fieldId]: normalizedValue
        }
      };

      // Auto-calculate employment generation if this is employment section
      if (sectionTitle === 'Expected Employment Generation') {
        // Manual entry only - no auto-calculation for costs
      }

      return newData;
    });

    if (sectionTitle === 'Indirect Expenses Increment') {
      const categoryName = EXPENSE_INCREMENT_REVERSE_MAP[fieldId];
      if (categoryName) {
        const trimmed = String(normalizedValue ?? '').trim();
        if (trimmed !== '') {
          setExpenseValidationErrors(prev => {
            if (!prev[categoryName]) return prev;
            const next = { ...prev };
            delete next[categoryName];
            return next;
          });
        }
      }
    }

    // Update liveTenure when tenure field (i46) changes in Term Loan Details
    if (sectionTitle === 'Term Loan Details' && fieldId === 'i46') {
      const newTenure = normalizedValue !== '' && normalizedValue !== null && normalizedValue !== undefined ? parseInt(normalizedValue, 10) : null;
      const parsedTenure = isNaN(newTenure) ? null : newTenure;
      console.log('🔢 [TERM_LOAN] Tenure field changed:', {
        section: sectionTitle,
        field: fieldId,
        rawValue: normalizedValue,
        parsedTenure,
        currentLiveTenure: liveTenure
      });
      setLiveTenure(parsedTenure);
    }
  }, [liveTenure, lockSector]);

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
    const visibleRows = new Set(assetVisibleRowsByCategory[categoryName] || []);
    const items = [];
    for (let i = section.start; i <= section.end; i++) {
      const desc = formData['Schedule for Assets'][`d${i}`] || '';
      const amount = formData['Schedule for Assets'][`e${i}`] || '';
      const hasAmount = amount !== '' && amount !== null && amount !== undefined && Number(amount) !== 0;
      if (visibleRows.has(i) || desc !== '' || hasAmount) {
        items.push({ row: i, description: desc, amount: amount });
      }
    }
    return items;
  }, [formData, CURRENT_ASSET_SECTIONS, assetVisibleRowsByCategory]);

  // Add asset item to a category
  const addAssetItem = useCallback((categoryName) => {
    const section = CURRENT_ASSET_SECTIONS[categoryName];
    const visibleRows = new Set(assetVisibleRowsByCategory[categoryName] || []);

    for (let i = section.start; i <= section.end; i++) {
      const desc = formData['Schedule for Assets'][`d${i}`];
      const amount = formData['Schedule for Assets'][`e${i}`];
      const isEmpty = (desc === '' || desc === undefined) && (amount === '' || amount === undefined || Number(amount) === 0);
      if (!visibleRows.has(i) && isEmpty) {
        setAssetVisibleRowsByCategory(prev => ({
          ...prev,
          [categoryName]: [...(prev[categoryName] || []), i].sort((a, b) => a - b)
        }));

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
  }, [formData, CURRENT_ASSET_SECTIONS, assetVisibleRowsByCategory]);

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

    if (categoryName) {
      setAssetVisibleRowsByCategory(prev => {
        const existing = new Set(prev[categoryName] || []);
        if (existing.has(row)) return prev;
        existing.add(row);
        return {
          ...prev,
          [categoryName]: Array.from(existing).sort((a, b) => a - b)
        };
      });
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

    if (categoryName) {
      setAssetVisibleRowsByCategory(prev => ({
        ...prev,
        [categoryName]: (prev[categoryName] || []).filter((r) => r !== row)
      }));
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
  }, [CURRENT_ASSET_SECTIONS]);

  const fillTestData = useCallback(() => {
    const testTenure = 5;
    const assetSections = getAssetSections(testTenure);

    const scheduleForAssets = {
        'd185': 'Vinfast Lemo Green (EV 75 KW)', 'e185': 21.58,
        'd186': 'EV Charging Accessory Kit', 'e186': 0.85,
    };

    const loanPct = {};
    const loanAmt = {};
    Object.entries(assetSections).forEach(([category, { start, end }]) => {
      let total = 0;
      for (let i = start; i <= end; i++) {
        total += parseFloat(scheduleForAssets[`e${i}`]) || 0;
      }
      if (total > 0) {
        loanPct[category] = 60;
        loanAmt[category] = ((total * 60) / 100).toFixed(2);
      } else {
        loanPct[category] = 0;
        loanAmt[category] = '';
      }
    });

    setLiveTenure(testTenure);
    setLoanPercentages(loanPct);
    setLoanAmounts(loanAmt);
    setAssetValidationErrors({});

    setFormData({
      'General Information': {
        'i7': 'Sole Proprietorship',
        'i8': 'PARVEZ ALI NARAYANA',
        'i9': '9876543210',
        'i10': 'ABC123456',
        'bank_name': 'SBI',
        'branch_name': 'Main Branch',
        'i11': 'DEF789012',
        'i12': 35,
        'i13': 'Male',
        'i14': presetSector || EV_SECTOR_LABEL,
        'i15': 'Goods Transport Service',
        'i16': '17-3-47,thadepalli center, Vijayawada',
        'residential_address': '12-5-30, Brodipet, Guntur',
        'i17': 'PARVEZ ALI NARAYANA Solutions',
        'i18': 'GHI345678',
        'i19': 'Graduate',
        'i20': 'Other MSME',
        'i21': 'OC',
        'i22': 'Urban(Other than Panchayat)'
      },
      'Prepared By': {
        'j136': 'PARVEZ AND NARAYANA',
        'j137': 'Chartered Accountants',
        'j138': 'Vijayawada',
        'j139': '9014221011',
        'required_stamp': FRCC_REQUIRED_STAMP_DEFAULT
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
        'i46': testTenure,
        'i47': 'Fixed EMI',
        'i48': 6,
        'h49': 2.0,
        'i51': '2026-27',
        'i52': '2026-04',
        'i53': '2026-06',
        'i56': 1.25
      },
      'Indirect Expenses Increment': {
        'i56': 1.25,
        'h64': 15.0,
        'h65': 50.0,
        'h66': 50.0,
        'h67': 33.5,
        'h68': 2.0
      },
      'Cost of Project': {},
      'Schedule for Assets': scheduleForAssets,
      'Schedule for Indirect Expenses': {
        'Administrative & Office Expenses': {
          'd239': 'Office rent', 'e239': 5000,
          'd244': 'Repairs and Maintenance', 'e244': 800,
        },
        'Employee Related Expenses': {},
        'Selling and Distribution Expenses': {
          'd269': 'Sales promotion expenses', 'e269': 1500,
          'd271': 'Dealer commission', 'e271': 3000,
          'd279': 'Other Selling and Distribution Expenses', 'e279': 1000,
        },
        'General Overheads': {
          'd280': 'Vehicle Insurance', 'e280': 5000,
        },
        'Miscellaneous Expenses': {
          'd290': 'Loss on sale of fixed assets', 'e290': 0,
          'd295': 'Miscellaneous expenses', 'e295': 5000,
        }
      },
      'Vehicle Related': {
        'e299': 300,
        'e300': 12,
        'e301': 1.5,
      }
    });
  }, [presetSector, lockSector]);

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
            Name of Authorised Person *
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
            PAN of proprietor / Managing Partner / Managing Director
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
            value={(formData['General Information'] && formData['General Information']['i14']) || EV_SECTOR_LABEL}
            onChange={(e) => handleFieldChange('General Information', 'i14', e.target.value)}
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-gray-100 text-gray-700 cursor-not-allowed"
          >
            <option value={EV_SECTOR_LABEL}>{EV_SECTOR_LABEL}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Nature of Business
          </label>
          <select
            value={(formData['General Information'] && formData['General Information']['i15']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'i15', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="">Select Nature of Business</option>
            <option value="Travels Service">Travels Service</option>
            <option value="Goods Transport Service">Goods Transport Service</option>
            <option value="Transport service">Transport service</option>
          </select>
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
            Residential Address
          </label>
          <input
            type="text"
            value={(formData['General Information'] && formData['General Information']['residential_address']) || ''}
            onChange={(e) => handleFieldChange('General Information', 'residential_address', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter residential address"
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
          <option value="PMFME">PMFME</option>
          <option value="PMMSY">PMMSY</option>
          <option value="Startup India">Startup India</option>
          <option value="NLM scheme">NLM scheme</option>
           <option value="CMEGP">CMEGP</option>
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
            type="number"
            min={1}
            max={7}
            onWheel={(e) => e.target.blur()}
            value={(formData['Term Loan Details'] && formData['Term Loan Details']['i46']) || ''}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                handleFieldChange('Term Loan Details', 'i46', '');
                return;
              }
              const n = parseInt(raw, 10);
              if (!Number.isNaN(n) && n > 7) {
                handleFieldChange('Term Loan Details', 'i46', '7');
                return;
              }
              handleFieldChange('Term Loan Details', 'i46', raw);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter tenure in years (max 7)"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            <span className="inline-flex items-center gap-1">
              Fixed EMI or Fixed Principal Amount over Loan Term period
              <span className="relative group inline-flex items-center">
                <InformationCircleIcon className="h-4 w-4 text-gray-500 cursor-help" aria-label="Ask your banker" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                  ask your banker
                </span>
              </span>
            </span>
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
            <span className="inline-flex items-center gap-1">
              Moratorium period (months)
              <span className="relative group inline-flex items-center">
                <InformationCircleIcon className="h-4 w-4 text-gray-500 cursor-help" aria-label="only interest amount will be paid, no fixed amount" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                  only interest amount will be paid, no fixed amount
                </span>
              </span>
            </span>
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
            Loan Start Month (Month immediately after Sanction Month)
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
            First Sale Bill Month :
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
            <span className="inline-flex items-center gap-1">
              Average DSCR Ratio required
              <span className="relative group inline-flex items-center">
                <InformationCircleIcon className="h-4 w-4 text-gray-500 cursor-help" aria-label="Ask your banker" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                  Ask your funding Banker
                </span>
              </span>
            </span>
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

  const handleExpenseTabChange = (newTabIndex) => {
    setVisitedExpenseCategories(prev => new Set([...prev, newTabIndex]));
    setIndirectActiveTab(newTabIndex);

    const expenseCategories = Object.keys(CURRENT_INDIRECT_EXPENSES_DATA);
    const categoryName = expenseCategories[newTabIndex];
    if (categoryName && expenseValidationErrors[categoryName]) {
      setExpenseValidationErrors(prev => {
        const next = { ...prev };
        delete next[categoryName];
        return next;
      });
    }
  };

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
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-purple-800 mb-2">Cost of Project</h3>
          <p className="text-sm text-[#7e22ce]">
            Enter Commercial Vehicles details for the project cost.
          </p>
          <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700">
              <strong>Progress:</strong> {visitedAssetCategories.size} of {assetCategories.length} categories visited.
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
              Asset name or description
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
                  placeholder="Asset name or description"
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
          <input
            type="text"
            value={formData['Schedule for Indirect Expenses']?.[activeExpenseCategory]?.[fieldD] ?? label}
            onChange={(e) => handleExpenseChange(activeExpenseCategory, fieldD, e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            placeholder={label}
          />
        </div>
        <div className="col-span-5">
          <input
            type="number" onWheel={(e) => e.target.blur()}
            step="0.01"
            min="0"
            value={
              formData['Schedule for Indirect Expenses']?.[activeExpenseCategory]?.[fieldE] === 0 ||
              formData['Schedule for Indirect Expenses']?.[activeExpenseCategory]?.[fieldE] === undefined ||
              formData['Schedule for Indirect Expenses']?.[activeExpenseCategory]?.[fieldE] === null
                ? ''
                : formData['Schedule for Indirect Expenses']?.[activeExpenseCategory]?.[fieldE]
            }
            onChange={(e) => handleExpenseChange(activeExpenseCategory, fieldE, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="Enter amount (₹)"
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
    const expenseErrors = Object.entries(expenseValidationErrors);

    // Mapping for increment percentage
    const incrementKey = EXPENSE_INCREMENT_MAP[activeExpenseCategory];
    const incrementValue = formData['Indirect Expenses Increment']?.[incrementKey] ?? '';

    return (
      <div className="space-y-6">
        {expenseErrors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-700 mb-1">Please fix the following before continuing:</p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
              {expenseErrors.map(([category, error]) => (
                <li key={category}>{category}: {error}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-purple-800 mb-2">Schedule for Indirect Expenses</h3>
          <p className="text-sm text-[#7e22ce]">
            Please enter the details and increment percentage for each expense category.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
          {expenseCategories.map((categoryName, idx) => (
            <button
              key={categoryName}
              onClick={() => handleExpenseTabChange(idx)}
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
                        Salaries and wages (Driver and Cleaner)
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
                  {activeExpenseCategory === 'General Overheads' ? 'General Overheads Annual Percentage' : `${activeExpenseCategory} Annual Increment Percentage`}
                </label>
                <div className="relative">
                  <input
                    key={incrementKey}
                    type="number" onWheel={(e) => e.target.blur()}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${expenseValidationErrors[activeExpenseCategory]
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-indigo-300 focus:ring-indigo-500'
                      }`}
                    value={incrementValue}
                    onChange={(e) => handleFieldChange('Indirect Expenses Increment', incrementKey, e.target.value)}
                    placeholder="Enter %"
                  />
                </div>
                {expenseValidationErrors[activeExpenseCategory] && (
                  <p className="text-xs text-red-600 mt-1">{expenseValidationErrors[activeExpenseCategory]}</p>
                )}
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
            Address (Prepared By)
          </label>
          <input
            type="text"
            value={(formData['Prepared By'] && formData['Prepared By']['j138']) || ''}
            onChange={(e) => handleFieldChange('Prepared By', 'j138', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter address"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Mobile Number (Prepared By)
          </label>
          <input
            type="text"
            value={(formData['Prepared By'] && formData['Prepared By']['j139']) || ''}
            onChange={(e) => handleFieldChange('Prepared By', 'j139', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="Enter mobile number"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Required Stamp
          </label>
          <select
            value={(formData['Prepared By'] && formData['Prepared By']['required_stamp']) || 'No'}
            onChange={(e) => handleFieldChange('Prepared By', 'required_stamp', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <span className="text-xs text-gray-500 block">Select whether CA stamp is required on the report</span>
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
    </div>
  );

  const renderVehicleRelated = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-purple-800 mb-2">Vehicle Related</h3>
        <p className="text-sm text-[#7e22ce]">
          Enter assumptions used for EV vehicle revenue and electricity cost calculations.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            No of Working days per Annum *
          </label>
          <input
            type="number"
            onWheel={(e) => e.target.blur()}
            value={(formData['Vehicle Related'] && formData['Vehicle Related']['e299']) ?? ''}
            onChange={(e) => handleFieldChange('Vehicle Related', 'e299', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="e.g. 300"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Gross Revenue charged from Customer per KM *
          </label>
          <input
            type="number"
            onWheel={(e) => e.target.blur()}
            value={(formData['Vehicle Related'] && formData['Vehicle Related']['e300']) ?? ''}
            onChange={(e) => handleFieldChange('Vehicle Related', 'e300', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="e.g. 12"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Electricity cost per KM *
          </label>
          <input
            type="number"
            onWheel={(e) => e.target.blur()}
            value={(formData['Vehicle Related'] && formData['Vehicle Related']['e301']) ?? ''}
            onChange={(e) => handleFieldChange('Vehicle Related', 'e301', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            placeholder="e.g. 1.5"
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
      case 'vehicle_related': return renderVehicleRelated();
      case 'prepared_by': return renderPreparedBy();
      default: return null;
    }
  };

  const handleNext = () => {
    const currentSection = sections[currentStep];

    if (currentSection.key === 'assets') {
      const assetCategories = Object.keys(CURRENT_ASSET_SECTIONS);

      const categoriesMissingLoanPercentage = assetCategories.filter((categoryName) => {
        const categoryItems = getAssetItems(categoryName);
        const hasAmountEntered = categoryItems.some((item) => {
          const amount = item?.amount;
          return amount !== undefined && amount !== null && String(amount).trim() !== '' && Number(amount) > 0;
        });

        if (!hasAmountEntered) return false;

        const loanPercentage = loanPercentages[categoryName];
        return loanPercentage === undefined || loanPercentage === null || String(loanPercentage).trim() === '' || Number(loanPercentage) <= 0;
      });

      if (categoriesMissingLoanPercentage.length > 0) {
        const categoryErrors = {};
        categoriesMissingLoanPercentage.forEach((categoryName) => {
          categoryErrors[categoryName] = 'Please enter Loan Percentage (%) before proceeding.';
        });
        setAssetValidationErrors(prev => ({ ...prev, ...categoryErrors }));

        const firstMissingCategory = categoriesMissingLoanPercentage[0];
        const firstMissingIndex = assetCategories.indexOf(firstMissingCategory);
        if (firstMissingIndex >= 0) {
          setActiveAssetTab(firstMissingIndex);
        }

        alert(`Please enter Loan Percentage (%) for these sub sections: ${categoriesMissingLoanPercentage.join(', ')}`);
        return;
      }

      if (visitedAssetCategories.size < assetCategories.length) {
        const shouldProceed = window.confirm('Are you sure you visited all sections and entered required or desired values?');
        if (!shouldProceed) return;
      }
    }

    if (currentSection.key === 'expenses') {
      const expenseCategories = Object.keys(CURRENT_INDIRECT_EXPENSES_DATA);
      const newErrors = {};
      const missingIncrementCategories = [];

      expenseCategories.forEach((categoryName) => {
        const items = CURRENT_INDIRECT_EXPENSES_DATA[categoryName] || [];
        const hasAmountEntered = items.some(item => {
          const rawValue = formData['Schedule for Indirect Expenses']?.[categoryName]?.[item.e];
          if (rawValue === undefined || rawValue === null) {
            return false;
          }
          const trimmed = String(rawValue).trim();
          if (trimmed === '') {
            return false;
          }
          const numericValue = parseFloat(trimmed);
          return !isNaN(numericValue) && numericValue > 0;
        });

        if (!hasAmountEntered) {
          return;
        }

        const incrementKey = EXPENSE_INCREMENT_MAP[categoryName];
        const incrementValue = incrementKey ? formData['Indirect Expenses Increment']?.[incrementKey] : null;
        if (incrementKey && (incrementValue === undefined || incrementValue === null || String(incrementValue).trim() === '')) {
          newErrors[categoryName] = 'Please enter Final Increment Percentage (%) for this section.';
          missingIncrementCategories.push(categoryName);
        }
      });

      if (missingIncrementCategories.length > 0) {
        setExpenseValidationErrors(newErrors);
        const focusCategory = missingIncrementCategories[0];
        const focusIndex = expenseCategories.indexOf(focusCategory);
        if (focusIndex >= 0) {
          setIndirectActiveTab(focusIndex);
        }
        return;
      }

      const unvisitedCategories = expenseCategories.filter((_, idx) => !visitedExpenseCategories.has(idx));
      if (unvisitedCategories.length > 0) {
        const unvisitedErrors = {};
        unvisitedCategories.forEach((categoryName) => {
          unvisitedErrors[categoryName] = 'Please visit this section before proceeding.';
        });
        setExpenseValidationErrors(unvisitedErrors);

        const unvisitedIndex = expenseCategories.findIndex((_, idx) => !visitedExpenseCategories.has(idx));
        if (unvisitedIndex !== -1) {
          setIndirectActiveTab(unvisitedIndex);
        }
        return;
      }

      if (Object.keys(expenseValidationErrors).length > 0) {
        setExpenseValidationErrors({});
      }
    }

    const skipCanProceedGate = currentSection.key === 'general' || currentSection.key === 'term';
    if ((skipCanProceedGate || canProceed) && currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const buildSubmitPayload = () => {
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

    const updatedFormData = {
      ...formData,
      'Term Loan Details': {
        ...formData['Term Loan Details']
      }
    };

    if (updatedFormData['Term Loan Details']?.['i52'] && updatedFormData['Term Loan Details']['i52'].includes('-')) {
      const [year, month] = updatedFormData['Term Loan Details']['i52'].split('-');
      if (year && month) {
        updatedFormData['Term Loan Details']['i52'] = `01-${month.padStart(2, '0')}-${year}`;
      }
    }
    if (updatedFormData['Term Loan Details']?.['i53'] && updatedFormData['Term Loan Details']['i53'].includes('-')) {
      const [year, month] = updatedFormData['Term Loan Details']['i53'].split('-');
      const date = new Date(year, month - 1, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      updatedFormData['Term Loan Details']['i53'] = `${monthName}-${year.slice(-2)}`;
    }

    const excelData = extractCellData(updatedFormData);

    const loanPercentageCells = {};
    Object.entries(CURRENT_ASSET_SECTIONS).forEach(([categoryName, config]) => {
      if (config.loanCell) {
        loanPercentageCells[config.loanCell] = loanPercentages[categoryName] || 0;
      }
    });

    return {
      ...updatedFormData,
      rawFormData: JSON.parse(JSON.stringify(formData)),
      excelData,
      bank_name: formData['General Information']['bank_name'],
      branch_name: formData['General Information']['branch_name'],
      'Asset Loan Percentages': loanPercentages,
      'Asset Loan Amounts': loanAmounts,
      'Loan Percentage Cells': loanPercentageCells
    };
  };

  const getDraftSnapshot = () => buildSubmitPayload();

  const handleSubmit = () => {
    onSubmit(buildSubmitPayload());
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
            Term Loan Form
          </h1>
          <p className="text-gray-600 text-sm">Commercial Vehicle — EV</p>
        </div>

        <div className="mb-4 flex justify-end">
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

          <div className="flex gap-3">
            {onSaveDraft ? (
              <button
                type="button"
                onClick={() => onSaveDraft(getDraftSnapshot())}
                disabled={savingDraft}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingDraft ? 'Saving…' : 'Save & draft'}
              </button>
            ) : (
              <SaveDraftButton
                templateId={templateId}
                currentStep={`/stage1?templateId=${templateId}`}
                currentFormData={formData}
              />
            )}
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

export default FRTermLoanEVVehicleForm;
