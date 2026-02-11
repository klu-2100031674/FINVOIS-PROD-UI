import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Generate financial year options
const generateFinancialYearOptions = () => {
  const options = [];
  for (let start = 2024; start <= 2033; start++) {
    options.push(`${start} - ${start + 1}`);
  }
  return options;
};

// Form configuration
const sections = [
  {
    key: 'general',
    title: 'General Information',
    icon: DocumentTextIcon,
    fields: [
      { id: 'i4', label: 'Name of Firm', type: 'text', required: true, note: 'Enter your company/firm name' },
      { id: 'i5', label: 'Status of Concern', type: 'select', options: ['Soleproprietorship', 'Partnership', 'LLP', 'Company'], required: true, note: 'Select the legal status' },
      { id: 'i6', label: 'Proprietor / MP / MD Name', type: 'text', required: true, note: 'Enter the owner name' },
      { id: 'i7', label: 'Firm Address', type: 'textarea', required: true, note: 'Enter complete business address' },
      { id: 'i8', label: 'Sector', type: 'select', options: ['Manufacturing sector', 'Service sector (with stock)', 'Trading sector'], required: true, note: 'Select your primary business sector' },
      { id: 'i9', label: 'Nature of Business', type: 'text', required: true, note: 'Describe your business activity' }
    ]
  },
  {
    key: 'finance',
    title: 'Means of Finance',
    icon: CurrencyDollarIcon,
    fields: [
      { id: 'i11', label: 'Do you have working capital limit at present?', type: 'select', options: ['Yes', 'No'], required: true, note: 'Select if you have existing loan' },
      { id: 'i12', label: 'Working Capital Loan Requirement (₹)', type: 'number', min: 0, required: true, note: 'Enter loan amount in rupees' },
      { id: 'h13', label: 'Working Capital Loan Interest (Annual %)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Enter annual interest rate' },
      { id: 'h14', label: 'Processing Fees (Including GST) %', type: 'number', min: 0, required: true, note: 'Enter processing fee percentage' },
      { id: 'h15', label: 'Working Capital (% of Turnover)', type: 'number', min: 0, max: 100, step: 0.01, required: true, note: 'Enter working capital percentage' }
    ]
  },
  {
    key: 'years',
    title: 'Financial Years',
    icon: CalendarIcon,
    fields: [
      { id: 'i17', label: '1st Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select first projection year' },
      { id: 'i18', label: '2nd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select second projection year' },
      { id: 'i19', label: '3rd Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select third projection year' },
      { id: 'i20', label: '4th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select fourth projection year' },
      { id: 'i21', label: '5th Financial Year', type: 'select', options: generateFinancialYearOptions(), required: true, note: 'Select fifth projection year' }
    ]
  },
  {
    key: 'salaries',
    title: 'Salaries & Wages',
    icon: UsersIcon,
    fields: [
      { id: 'i23', label: 'Skilled', type: 'number', min: 0, required: true, note: 'Enter total skilled employees' },
      { id: 'j23', label: 'Skilled Salary per Month (₹)', type: 'number', min: 0, required: true, note: 'Enter salary per skilled employee' },
      { id: 'i24', label: 'Unskilled', type: 'number', min: 0, required: true, note: 'Enter total unskilled employees' },
      { id: 'j24', label: 'Unskilled Salary per Month (₹)', type: 'number', min: 0, required: true, note: 'Enter salary per unskilled employee' },
      { id: 'i25', label: 'Semi Skilled', type: 'number', min: 0, required: true, note: 'Enter total semi-skilled employees' },
      { id: 'j25', label: 'Semi Skilled Salary per Month (₹)', type: 'number', min: 0, required: true, note: 'Enter salary per semi-skilled employee' }
    ]
  },
  {
    key: 'assumptions',
    title: 'Assumptions',
    icon: ChartBarIcon,
    fields: [
      { id: 'h28', label: 'Salaries Increment (Annual %)', type: 'number', min: 0, step: 0.1, required: true, note: 'Enter annual increase percentage (e.g., 5 for 5%)' },
      { id: 'i29', label: 'Rent per Month (₹)', type: 'number', min: 0, required: true, note: 'Enter monthly rent amount' },
      { id: 'h30', label: 'Rental Increment (Annual %)', type: 'number', min: 0, step: 0.1, required: true, note: 'Enter annual increase percentage (e.g., 5 for 5%)' },
      { id: 'i31', label: 'Power Charges per Month (₹)', type: 'number', min: 0, required: true, note: 'Enter monthly electricity cost' },
      { id: 'h32', label: 'Power Charges Increment (Annual %)', type: 'number', min: 0, step: 0.1, required: true, note: 'Enter annual increase percentage (e.g., 5 for 5%)' },
      { id: 'h33', label: 'Sales Growth (Annual %)', type: 'number', min: 0, step: 0.1, required: true, note: 'Enter annual growth percentage (e.g., 5 for 5%)' },
      { id: 'i34', label: 'No of Months Interest Paid in First Year', type: 'number', min: 1, max: 12, required: true, note: 'Enter number of months' },
      { id: 'i35', label: 'No of Months Turnover Done in First Year', type: 'number', min: 1, max: 12, required: true, note: 'Enter operational months' }
    ]
  },
  {
    key: 'fixed',
    title: 'Fixed Assets Schedule',
    icon: BuildingOfficeIcon,
    categories: [
      { idPrefix: 'R37C2', title: 'Plant and Machinery', itemCount: 10, startIndex: 99, excelField: 'i40' },
      { idPrefix: 'R56C2', title: 'Service Equipment', itemCount: 10, startIndex: 109, excelField: 'i39' },
      { idPrefix: 'R42C2', title: 'Shed, construction, civil works', itemCount: 10, startIndex: 119, excelField: 'i43' },
      { idPrefix: 'R41C2', title: 'Land', itemCount: 3, startIndex: 129, excelField: 'i42' },
      { idPrefix: 'R43C2', title: 'Electrical Items', itemCount: 9, startIndex: 132, excelField: 'i44' },
      { idPrefix: 'R44C2', title: 'Electronics Items', itemCount: 10, startIndex: 141, excelField: 'i45' },
      { idPrefix: 'R37C2', title: 'Furniture and Fittings', itemCount: 10, startIndex: 151, excelField: 'i38' },
      { idPrefix: 'R45C2', title: 'Vehicles', itemCount: 10, startIndex: 161, excelField: 'i46' },
      { idPrefix: 'R46C2', title: 'Live stock', itemCount: 9, startIndex: 171, excelField: 'i47' },
      { idPrefix: 'R47C2', title: 'Other Assets', itemCount: 10, startIndex: 180, excelField: 'i48' },
      { idPrefix: 'R48C2', title: 'Other Assets (Including Amortisable Assets)', itemCount: 10, startIndex: 190, excelField: 'i49' }
    ]
  }
];

// Fixed Assets mapping configuration
const fixedAssetsMapping = {
  "Plant and Machinery": { headerRow: 99, dataStartRow: 99, maxItems: 10 },
  "Service Equipment": { headerRow: 109, dataStartRow: 109, maxItems: 10 },
  "Shed, construction, civil works": { headerRow: 119, dataStartRow: 119, maxItems: 10 },
  "Land": { headerRow: 129, dataStartRow: 129, maxItems: 3 },
  "Electrical Items": { headerRow: 132, dataStartRow: 132, maxItems: 9 },
  "Electronics Items": { headerRow: 141, dataStartRow: 141, maxItems: 10 },
  "Furniture and Fittings": { headerRow: 151, dataStartRow: 151, maxItems: 10 },
  "Vehicles": { headerRow: 161, dataStartRow: 161, maxItems: 10 },
  "Live stock": { headerRow: 171, dataStartRow: 171, maxItems: 9 },
  "Other Assets": { headerRow: 180, dataStartRow: 180, maxItems: 10 },
  "Other Assets (Including Amortisable Assets)": { headerRow: 190, dataStartRow: 190, maxItems: 10 }
};

const FRCC1Form = ({ 
  onSubmit, 
  templateId = 'frcc1-financial-form',
  initialData = null,
  isEditMode = false,
  reportId = null,
  isProcessing = false,
  onFormDataChange = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData || {
    "General Information": {
      "i4": "",
      "i5": "",
      "i6": "",
      "i7": "",
      "i8": "",
      "i9": ""
    },
    "Means of Finance": {
      "i11": "",
      "i12": "",
      "h13": "",
      "h14": "",
      "h15": ""
    },
    "Financial Years": {
      "i17": "",
      "i18": "",
      "i19": "",
      "i20": "",
      "i21": ""
    },
    "Salaries & Wages": {
      'i23': '', 'j23': '', 'i24': '', 'j24': '', 'i25': '', 'j25': ''
    },
    "Assumptions": {
      "h28": "",
      "i29": "",
      "h30": "",
      "i31": "",
      "h32": "",
      "h33": "",
      "i34": "",
      "i35": ""
    },
    "Fixed Assets Schedule": {
      "Plant and Machinery": { items: [], total: 0 },
      "Service Equipment": { items: [], total: 0 },
      "Shed, construction, civil works": { items: [], total: 0 },
      "Land": { items: [], total: 0 },
      "Electrical Items": { items: [], total: 0 },
      "Electronics Items": { items: [], total: 0 },
      "Furniture and Fittings": { items: [], total: 0 },
      "Vehicles": { items: [], total: 0 },
      "Live stock": { items: [], total: 0 },
      "Other Assets": { items: [], total: 0 },
      "Other Assets (Including Amortisable Assets)": { items: [], total: 0 }
    }
  });

  const [finalJson, setFinalJson] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Initialize form with initialData if provided
  useEffect(() => {
    if (initialData && isEditMode) {
      console.log('📝 [FRCC1Form] Loading initial data for edit mode:', initialData);
      setFormData(prev => ({
        "General Information": initialData["General Information"] || {},
        "Means of Finance": initialData["Means of Finance"] || {},
        "Financial Years": initialData["Financial Years"] || {},
        "Salaries & Wages": initialData["Salaries & Wages"] || {
          'i23': '', 'j23': '', 'i24': '', 'j24': '', 'i25': '', 'j25': ''
        },
        "Assumptions": initialData["Assumptions"] || {},
        "Financial Assumptions": initialData["Financial Assumptions"] || {
          'R38C2': 8, 'R39C2': 10, 'R40C2': 12, 'R41C2': 14, 'R42C2': 16,
          'R43C2': 28, 'R44C2': 30, 'R45C2': 32, 'R46C2': 34, 'R47C2': 36,
          'R48C2': 15, 'R49C2': 18, 'R50C2': 20, 'R51C2': 22, 'R52C2': 25
        },
        "General Items": initialData["General Items"] || {
          'R55C2': 12, 'R56C2': 1.08, 'R57C2': 8, 'R58C2': 1.5, 'R59C2': 1.12,
          'R60C2': 60, 'R61C2': 2, 'R62C2': 10, 'R63C2': 5, 'R64C2': 85,
          'R65C2': 1.5, 'R66C2': 1.08
        },
        "Fixed Assets Schedule": initialData["Fixed Assets Schedule"] || {
          "Plant and Machinery": { items: [], total: 0 },
          "Service Equipment": { items: [], total: 0 },
          "Shed, construction, civil works": { items: [], total: 0 },
          "Land": { items: [], total: 0 },
          "Electrical Items": { items: [], total: 0 },
          "Electronics Items": { items: [], total: 0 },
          "Furniture and Fittings": { items: [], total: 0 },
          "Vehicles": { items: [], total: 0 },
          "Live stock": { items: [], total: 0 },
          "Other Assets": { items: [], total: 0 },
          "Other Assets (Including Amortisable Assets)": { items: [], total: 0 }
        },
        ...initialData
      }));
    }
  }, [initialData, isEditMode]);

  // Calculate total salaries
  const calculateSalaryTotal = useCallback((data) => {
    const skilled = (data['R21C2_W'] || 0) * (data['R21C2_S'] || 0);
    const semiSkilled = (data['R23C2_W'] || 0) * (data['R23C2_S'] || 0);
    const unskilled = (data['R22C2_W'] || 0) * (data['R22C2_S'] || 0);
    return skilled + semiSkilled + unskilled;
  }, []);

  // Validate current section
  const validateCurrentSection = useCallback(() => {
    const currentSection = sections[currentStep];
    
    if (currentSection.key === 'fixed') {
      // Fixed assets section is optional, always allow to proceed
      return true;
    }
    
    const sectionData = formData[currentSection.title];
    
    // Check all required fields
    for (const field of currentSection.fields) {
      if (field.required) {
        const value = sectionData[field.id];
        if (value === '' || value === null || value === undefined) {
          return false;
        }
        // For number fields, check if value is 0 or empty
        if (field.type === 'number' && (value === 0 || value === '')) {
          return false;
        }
      }
    }
    
    return true;
  }, [currentStep, formData]);

  // Update field value
  const updateField = useCallback((sectionTitle, fieldId, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [sectionTitle]: {
          ...prev[sectionTitle],
          [fieldId]: value
        }
      };

      if (sectionTitle === "Salaries & Wages") {
        newData["Salaries & Wages"]['R25C2'] = calculateSalaryTotal(newData["Salaries & Wages"]);
      }

      return newData;
    });
  }, [calculateSalaryTotal]);

  // Fill test data function
  const fillTestData = useCallback(() => {
    setFormData({
      "General Information": {
        "i4": "MEDICAID LABS LLP",
        "i5": "Soleproprietorship",
        "i6": "N Apuroop",
        "i7": "Autonagar,Vijayawada,Andhrapradesh",
        "i8": "Trading sector",
        "i9": "Trading in Pharmaceutical products"
      },
      "Means of Finance": {
        "i11": "No",
        "i12": 10000000,
        "h13": 12,
        "h14": 2,
        "h15": 20
      },
      "Financial Years": {
        "i17": "2024 - 2025",
        "i18": "2025 - 2026",
        "i19": "2026 - 2027",
        "i20": "2027 - 2028",
        "i21": "2028 - 2029"
      },
      "Salaries & Wages": {
        'i23': 20, 'j23': 15000, 'i24': 20, 'j24': 8000, 'i25': 20, 'j25': 10000
      },
      "Assumptions": {
        "h28": 5,
        "i29": 10000,
        "h30": 5,
        "i31": 7500,
        "h32": 5,
        "h33": 5,
        "i34": 7,
        "i35": 7
      },
      "Fixed Assets Schedule": {
        "Plant and Machinery": {
          items: [
            { description: "Machinery", amount: 500000 },
            { description: "Drilling Machine", amount: 120000 }
          ],
          total: 620000
        },
        "Service Equipment": { items: [], total: 0 },
        "Shed, construction, civil works": { items: [], total: 0 },
        "Land": { items: [], total: 0 },
        "Electrical Items": { items: [], total: 0 },
        "Electronics Items": { items: [], total: 0 },
        "Furniture and Fittings": { items: [], total: 0 },
        "Vehicles": { items: [], total: 0 },
        "Live stock": { items: [], total: 0 },
        "Other Assets": { items: [], total: 0 },
        "Other Assets (Including Amortisable Assets)": { items: [], total: 0 }
      }
    });
  }, []);

  // Update fixed asset item
  const updateFixedAsset = useCallback((categoryTitle, itemIndex, field, value, startIndex) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (!newData["Fixed Assets Schedule"][categoryTitle]) {
        newData["Fixed Assets Schedule"][categoryTitle] = { items: [], total: 0 };
      }
      
      while (newData["Fixed Assets Schedule"][categoryTitle].items.length <= itemIndex) {
        newData["Fixed Assets Schedule"][categoryTitle].items.push({ description: '', amount: 0 });
      }
      
      const item = newData["Fixed Assets Schedule"][categoryTitle].items[itemIndex];
      item[field] = value;
      item.descriptionField = `d${startIndex + itemIndex}`;
      item.amountField = `e${startIndex + itemIndex}`;
      
      newData[`d${startIndex + itemIndex}`] = item.description || '';
      newData[`e${startIndex + itemIndex}`] = item.amount || 0;
      
      let categoryTotal = 0;
      newData["Fixed Assets Schedule"][categoryTitle].items.forEach(item => {
        categoryTotal += item.amount || 0;
      });
      newData["Fixed Assets Schedule"][categoryTitle].total = categoryTotal;
      
      const category = sections.find(s => s.key === 'fixed')?.categories.find(c => c.title === categoryTitle);
      if (category) {
        newData[category.excelField] = categoryTotal;
      }
      
      return newData;
    });
  }, []);

  // Delete fixed asset item
  const deleteFixedAsset = useCallback((categoryTitle, itemIndex) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (newData["Fixed Assets Schedule"][categoryTitle] && newData["Fixed Assets Schedule"][categoryTitle].items) {
        newData["Fixed Assets Schedule"][categoryTitle].items.splice(itemIndex, 1);
        
        let categoryTotal = 0;
        newData["Fixed Assets Schedule"][categoryTitle].items.forEach(item => {
          categoryTotal += item.amount || 0;
        });
        newData["Fixed Assets Schedule"][categoryTitle].total = categoryTotal;
        
        const category = sections.find(s => s.key === 'fixed')?.categories.find(c => c.title === categoryTitle);
        if (category) {
          newData[category.excelField] = categoryTotal;
        }
      }
      return newData;
    });
  }, []);

  // Convert form data to Excel cell format
  const convertToExcelData = useCallback(() => {
    const excelData = {
      i4: { label: "Name of Firm", value: formData["General Information"]["i4"] || "MEDICAID LABS LLP" },
      i5: { label: "Status of Concern", value: formData["General Information"]["i5"] || "Soleproprietorship" },
      i6: { label: "Proprietor / MP / MD Name", value: formData["General Information"]["i6"] || "N Apuroop" },
      i7: { label: "Firm address", value: formData["General Information"]["i7"] || "Autonagar,Vijayawada,Andhrapradesh" },
      i8: { label: "Sector", value: formData["General Information"]["i8"] || "Trading Sector" },
      i9: { label: "Nature of Business", value: formData["General Information"]["i9"] || "Trading in Pharmaceutical products" },

      i11: { label: "Do you have working capital limit at present ?", value: formData["Means of Finance"]["i11"] || "No" },
      i12: { label: "Working capital Loan requirement", value: formData["Means of Finance"]["i12"] || 10000000 },
      h13: { label: "Working capital loan interest", value: formData["Means of Finance"]["h13"] || 12 },
      h14: { label: "Processing Fees (Including GST) %", value: formData["Means of Finance"]["h14"] || 0 },
      h15: { label: "Working capital (% of Turnover)", value: formData["Means of Finance"]["h15"] || 20 },

      i17: { label: "1st Financial year", value: formData["Financial Years"]["i17"] || "2024 - 2025" },
      i18: { label: "2nd financial year", value: formData["Financial Years"]["i18"] || "2025 - 2026" },
      i19: { label: "3rd financial year", value: formData["Financial Years"]["i19"] || "2026 - 2027" },
      i20: { label: "4th financial year", value: formData["Financial Years"]["i20"] || "2027 - 2028" },
      i21: { label: "5th financial year", value: formData["Financial Years"]["i21"] || "2028 - 2029" },

      i23: { label: "Skilled", value: formData["Salaries & Wages"]["i23"] || 20 },
      j23: { label: "Skilled Salary per Month", value: formData["Salaries & Wages"]["j23"] || 15000 },
      i24: { label: "Unskilled", value: formData["Salaries & Wages"]["i24"] || 20 },
      j24: { label: "Unskilled Salary per Month", value: formData["Salaries & Wages"]["j24"] || 8000 },
      i25: { label: "Semi Skilled", value: formData["Salaries & Wages"]["i25"] || 20 },
      j25: { label: "Semi Skilled Salary per Month", value: formData["Salaries & Wages"]["j25"] || 10000 },

      h28: { label: "Salaries Increment", value: formData["Assumptions"]["h28"] || 5 },
      i29: { label: "Rent per month", value: formData["Assumptions"]["i29"] || 10000 },
      h30: { label: "Rental increment", value: formData["Assumptions"]["h30"] || 5 },
      i31: { label: "Power charges per month", value: formData["Assumptions"]["i31"] || 7500 },
      h32: { label: "Power charges increament(previous year)", value: formData["Assumptions"]["h32"] || 5 },
      h33: { label: "Sales growth(of previous year)", value: formData["Assumptions"]["h33"] || 5 },
      i34: { label: "No of Months Interest will be paid in first year", value: formData["Assumptions"]["i34"] || 7 },
      i35: { label: "No of Months Turnover will be done in first year", value: formData["Assumptions"]["i35"] || 7 }
    };

    Object.keys(fixedAssetsMapping).forEach(categoryTitle => {
      const mapping = fixedAssetsMapping[categoryTitle];
      const categoryData = formData["Fixed Assets Schedule"][categoryTitle];
      
      if (categoryData && categoryData.items) {
        categoryData.items.forEach((item, index) => {
          if (index < mapping.maxItems) {
            const row = mapping.dataStartRow + index;
            excelData[`d${row}`] = { label: `${categoryTitle} - Item ${index + 1} Description`, value: item.description || '' };
            excelData[`e${row}`] = { label: `${categoryTitle} - Item ${index + 1} Amount`, value: item.amount || 0 };
          }
        });
      }
    });

    return excelData;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    const excelData = convertToExcelData();

    const submissionData = {
      formData: {
        excelData: excelData,
        additionalData: {
          formType: 'FRCC1 Complete Financial Form',
          timestamp: new Date().toISOString(),
          "Fixed Assets Schedule": formData["Fixed Assets Schedule"]
        }
      }
    };

    if (onFormDataChange) {
      console.log('💾 [FRCC1Form] Saving raw formData for future editing:', formData);
      onFormDataChange(formData);
    }

    if (onSubmit) {
      onSubmit(submissionData);
    } else {
      setFinalJson(submissionData);
      setShowResult(true);
    }
  }, [formData, convertToExcelData, onSubmit, onFormDataChange]);

  // Copy JSON to clipboard
  const copyToClipboard = useCallback(() => {
    if (finalJson) {
      navigator.clipboard.writeText(JSON.stringify(finalJson, null, 2))
        .then(() => alert('JSON copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  }, [finalJson]);

  // Navigation
  const goToStep = (index) => {
    if (index >= 0 && index < sections.length) {
      setCurrentStep(index);
    }
  };

  const goToNextStep = () => {
    if (!validateCurrentSection()) {
      alert('Please fill all required fields before proceeding to the next step.');
      return;
    }
    if (currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const currentSection = sections[currentStep];
  const progress = ((currentStep + 1) / sections.length) * 100;
  const isLastStep = currentStep === sections.length - 1;
  const canProceed = validateCurrentSection();

  if (showResult) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif' }} className="min-h-screen bg-ghostwhite">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
          .bg-ghostwhite { background-color: #F8F8FF; }
        `}</style>
        <div className="bg-white rounded-xl shadow-soft p-6 ">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
            <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900">
              Form Submitted Successfully
            </h1>
          </div>
          <p className="text-gray-600  text-sm">Your data has been collected in JSON format below:</p>
          <div className="bg-gray-900 rounded-lg  overflow-auto max-h-80 text-xs font-mono">
            <pre className="text-green-400">{JSON.stringify(finalJson, null, 2)}</pre>
          </div>
          <div className="flex justify-between mt-6 gap-3">
            <button 
              className="px-5 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 font-medium text-sm" 
              onClick={() => setShowResult(false)}
            >
              <ChevronLeftIcon className="w-4 h-4 inline mr-1" />
              Back to Form
            </button>
            <button 
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm" 
              onClick={copyToClipboard}
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4 inline mr-1" />
              Copy JSON
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="min-h-screen bg-ghostwhite">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .bg-ghostwhite { background-color: #F8F8FF; }
        
        .shadow-soft {
          box-shadow: 0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04);
        }
        
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        input, select, textarea {
          font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Manrope', sans-serif;
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
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-2xl font-bold text-gray-900 mb-1">
            Financial Data Collection
          </h1>
          <p className="text-gray-600 text-sm">Complete each section to generate your financial report</p>
        </div>

        {/* Test Data Button */}
        <div className="mb-4 flex justify-center">
          {/* <button 
            className="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 text-xs font-medium" 
            onClick={fillTestData}
          >
            Fill Test Data
          </button> */}
        </div>

        {/* Progress Bar */}
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

        {/* Section Navigation Tabs */}
        <div className="mb-6 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex gap-2 min-w-max">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.key}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                    index === currentStep 
                      ? ' text-black border border-gray-600' 
                      : index < currentStep
                      ? 'bg-gray-100 text-gray-700 border border-gray-300'
                      : 'bg-white text-gray-500 border border-gray-200 cursor-not-allowed'
                  }`}
                  onClick={() => index <= currentStep && goToStep(index)}
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

        {/* Current Section Content */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            {React.createElement(currentSection.icon, { className: "w-6 h-6 text-gray-900" })}
            <h2 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xl font-bold text-gray-900">
              {currentSection.title}
            </h2>
          </div>
          
          <div className="bg-ghostwhite rounded-lg p-4">
            {currentSection.key === 'fixed' ? (
              <FixedAssetsSection
                categories={currentSection.categories}
                data={formData["Fixed Assets Schedule"]}
                onUpdate={updateFixedAsset}
                onDelete={deleteFixedAsset}
              />
            ) : (
              <RegularFieldsSection
                section={currentSection}
                data={formData[currentSection.title]}
                onUpdate={updateField}
              />
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200">
          <button 
            className="px-5 py-2 border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent font-medium text-sm flex items-center gap-1" 
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>
          
          {isLastStep ? (
            <button 
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5" 
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

// Regular fields section component
const RegularFieldsSection = ({ section, data = {}, onUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {section.fields.map(field => (
        <div key={field.id} className="space-y-1.5">
          <label style={{ fontFamily: 'Manrope, sans-serif' }} className="block text-xs font-semibold text-gray-800">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === 'select' ? (
            <select
              value={data[field.id] || ''}
              onChange={(e) => onUpdate(section.title, field.id, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            >
              <option value="">Select...</option>
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={data[field.id] || ''}
              onChange={(e) => onUpdate(section.title, field.id, e.target.value)}
              placeholder={field.label}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white resize-none"
            />
          ) : field.type === 'computed' ? (
            <div className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-300 text-gray-800 font-semibold text-sm">
              ₹{data[field.id]?.toLocaleString('en-IN') || 0}
            </div>
          ) : (
            <input
              type={field.type}
              value={data[field.id] || ''}
              onChange={(e) => onUpdate(section.title, field.id, field.type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
              placeholder={field.label}
              min={field.min}
              max={field.max}
              step={field.step}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
            />
          )}
          {field.note && (
            <p className="text-xs text-gray-500 mt-1">
              {field.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// Fixed assets section component
const FixedAssetsSection = ({ categories, data = {}, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const maxItems = {
    'Plant and Machinery': 10,
    'Service Equipment': 10,
    'Shed, construction, civil works': 10,
    'Land': 3,
    'Electrical Items': 9,
    'Electronics Items': 10,
    'Furniture and Fittings': 10,
    'Vehicles': 10,
    'Live stock': 9,
    'Other Assets': 10,
    'Other Assets (Including Amortisable Assets)': 10
  };

  const currentCategory = categories[activeTab];
  const categoryData = data[currentCategory.title] || { items: [], total: 0 };

  const addItem = () => {
    const currentItems = categoryData.items?.length || 0;
    const maxAllowed = maxItems[currentCategory.title] || Infinity;

    if (currentItems >= maxAllowed) {
      alert(`Maximum ${maxAllowed} items allowed for ${currentCategory.title}`);
      return;
    }

    onUpdate(currentCategory.title, currentItems, 'description', '', currentCategory.startIndex);
    onUpdate(currentCategory.title, currentItems, 'amount', 0, currentCategory.startIndex);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
        {categories.map((cat, index) => (
          <button
            key={cat.title}
            className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${
              index === activeTab 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab(index)}
          >
            {cat.title}
          </button>
        ))}
      </div>
      
      {/* Category Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center  mb-4 pb-3 border-b border-gray-200">
          <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-base font-bold text-gray-800">
            {currentCategory.title}
          </h3>
          <div className="px-4 py-1.5 bg-white-900 text-black rounded-lg border border-gray-300">
            <span style={{ fontFamily: 'Manrope, sans-serif' }} className="text-sm font-bold">
              Total: ₹{categoryData.total?.toLocaleString('en-IN') || 0}
            </span>
          </div>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 mb-3">
          <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-6 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
            Item Description
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif' }} className="col-span-5 font-semibold text-gray-800 bg-gray-100 p-2 rounded-lg text-xs">
            Amount (₹)
          </div>
          <div className="col-span-1"></div>
        </div>
        
        {/* Table Rows */}
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {categoryData.items && categoryData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3">
              <input
                type="text"
                placeholder={`Item ${index + 1} description`}
                value={item.description || ''}
                onChange={(e) => onUpdate(currentCategory.title, index, 'description', e.target.value, currentCategory.startIndex)}
                className="col-span-6 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
              />
              <input
                type="number" onWheel={(e) => e.target.blur()}
                placeholder="Amount"
                min="0"
                step="0.01"
                value={item.amount || ''}
                onChange={(e) => onUpdate(currentCategory.title, index, 'amount', Number(e.target.value) || 0, currentCategory.startIndex)}
                className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 bg-white"
              />
              <button
                type="button"
                onClick={() => onDelete(currentCategory.title, index)}
                className="col-span-1 px-2 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <button
          type="button"
          onClick={addItem}
          className={`mt-3 px-4 py-2 text-xs rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 ${
            (categoryData.items?.length || 0) >= (maxItems[currentCategory.title] || Infinity)
              ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
              : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
          }`}
          disabled={(categoryData.items?.length || 0) >= (maxItems[currentCategory.title] || Infinity)}
        >
          <PlusIcon className="w-4 h-4" />
          Add Item ({categoryData.items?.length || 0}/{maxItems[currentCategory.title] || '∞'})
        </button>
      </div>
    </div>
  );
};

export default FRCC1Form;



