/**
 * Form Data Mapper
 * Maps HTML form data to Excel cell references
 */

/**
 * Map form data to Excel format for FRCC1 template
 * @param {Object} formData - Raw form data from HTML form
 * @returns {Object} - Excel data with cell mappings
 */
export const mapFRCC1FormData = (formData) => {
  const excelData = {
    // Firm Information
    i4: formData.firmName || '',
    i5: formData.address || '',
    i6: formData.promoterName || '',
    i7: formData.pan || '',
    i8: formData.constitution || '',
    i9: formData.dateOfIncorporation || '',
    i10: formData.natureOfBusiness || '',
    
    // Loan Details
    i11: parseFloat(formData.loanAmount) || 0,
    i12: formData.loanPurpose || '',
    i13: parseFloat(formData.interestRate) || 0,
    i14: parseFloat(formData.tenure) || 0,
    
    // Financial Information
    i15: parseFloat(formData.sales) || 0,
    i16: parseFloat(formData.profit) || 0,
    i17: parseFloat(formData.netWorth) || 0,
    i18: parseFloat(formData.currentAssets) || 0,
    i19: parseFloat(formData.currentLiabilities) || 0,
    
    // Additional fields - extend based on your form
    // Add more mappings as per your Excel template structure
  };

  return {
    excelData,
    AdditionalData: {
      submittedAt: new Date().toISOString(),
      formVersion: '1.0.0',
    },
  };
};

/**
 * Generic form data mapper
 * Maps form fields to Excel cells based on naming convention
 * Field names should match Excel cell references (e.g., i4, i5, etc.)
 */
export const mapGenericFormData = (formData) => {
  const excelData = {};

  Object.keys(formData).forEach((key) => {
    const value = formData[key];
    
    // Handle different value types
    if (typeof value === 'string') {
      excelData[key] = value;
    } else if (typeof value === 'number') {
      excelData[key] = value;
    } else if (typeof value === 'boolean') {
      excelData[key] = value ? 'Yes' : 'No';
    } else {
      excelData[key] = String(value);
    }
  });

  return {
    excelData,
    AdditionalData: {
      submittedAt: new Date().toISOString(),
    },
  };
};

/**
 * Map template-specific form data
 * @param {string} templateId - Template identifier
 * @param {Object} formData - Raw form data
 * @returns {Object} - Mapped Excel data
 */
export const mapFormDataByTemplate = (templateId, formData) => {
  switch (templateId) {
    case 'frcc1':
      return mapFRCC1FormData(formData);
    
    // Add more template-specific mappers here
    default:
      return mapGenericFormData(formData);
  }
};

export default {
  mapFRCC1FormData,
  mapGenericFormData,
  mapFormDataByTemplate,
};
