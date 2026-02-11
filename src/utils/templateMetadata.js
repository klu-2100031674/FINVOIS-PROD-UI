/**
 * Template Metadata
 * Configuration for all available Excel templates
 */

const templates = [
  {
    name: 'Format CC1 Test',
    id: 'frcc1',
    description: 'A test template for CC1',
    version: '1.0.0',
    author: 'CA',
    
    // Sheets configuration
    initialHide: [
      'wc',
      'Assumptions.1',
      'plbs',
      'Coverpage',
      'RATIO',
      'MPBF ',
      'Nayak',
      'Depsch',
      'FixedAssetSch',
    ],
    initialRemoveFormulas: ['FinalWorkings'],
    
    // After generation configuration
    afterGenerateRemoveFormulas: [
      'wc',
      'Assumptions.1',
      'plbs',
      'Coverpage',
      'RATIO',
      'MPBF ',
      'Nayak',
      'Depsch',
      'FinalWorkings',
      'FixedAssetSch',
    ],
    afterGenerateHide: ['Assumptions.1', 'wc'],
    afterGenerateLock: ['Coverpage'],
    
    lastModified: '2024-10-01T12:00:00Z',
    createdAt: '2023-10-01T12:00:00Z',
    
    properties: {
      'No Of Years': 1,
      'Type of Report': 'CC',
    },
  },
  {
    name: 'Format CC2',
    id: 'frcc2',
    description: 'Credit Card Application - Audited & Provisional Statements',
    version: '1.0.0',
    author: 'CA',
    
    // Sheets configuration
    initialHide: [
      'wc',
      'Assumptions.1',
      'plbs',
      'Coverpage',
      'RATIO',
      'MPBF ',
      'Nayak',
      'Depsch',
      'FixedAssetSch',
    ],
    initialRemoveFormulas: ['FinalWorkings'],
    
    // After generation configuration
    afterGenerateRemoveFormulas: [
      'wc',
      'Assumptions.1',
      'plbs',
      'Coverpage',
      'RATIO',
      'MPBF ',
      'Nayak',
      'Depsch',
      'FinalWorkings',
      'FixedAssetSch',
    ],
    afterGenerateHide: ['Assumptions.1', 'wc'],
    afterGenerateLock: ['Coverpage'],
    
    lastModified: '2024-10-01T12:00:00Z',
    createdAt: '2024-10-01T12:00:00Z',
    
    properties: {
      'No Of Years': 1,
      'Type of Report': 'CC',
    },
  },
];

/**
 * Get all templates
 */
export const getTemplates = () => {
  return templates;
};

/**
 * Get template by ID
 */
export const getTemplateById = (templateId) => {
  return templates.find((template) => template.id === templateId);
};

/**
 * Get template metadata
 */
export const getTemplateMetadata = (templateId) => {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    name: template.name,
    id: template.id,
    description: template.description,
    version: template.version,
    author: template.author,
    properties: template.properties,
  };
};

/**
 * Get template sheet configuration
 */
export const getTemplateSheetConfig = (templateId) => {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    initialHide: template.initialHide || [],
    initialRemoveFormulas: template.initialRemoveFormulas || [],
    afterGenerateRemoveFormulas: template.afterGenerateRemoveFormulas || [],
    afterGenerateHide: template.afterGenerateHide || [],
    afterGenerateLock: template.afterGenerateLock || [],
  };
};

export default {
  getTemplates,
  getTemplateById,
  getTemplateMetadata,
  getTemplateSheetConfig,
};
