/**
 * Theory-page Project Profile sections.
 * Loan-report selectors keep the shared sections unchanged.
 */
import {
  firmConstitutionSection,
  locationOverviewSection,
  accessConnectivitySection,
  promoterDetailsSection,
  makeProductDetailsSection,
  makeProductCharacteristicsSection,
  manufacturingCapacitySection,
  manufacturingProcessFlowchartSection,
  swotAnalysisSection,
  targetMarketSection,
  competitorOverviewSection,
  marketTrendSection,
  statutoryApprovalsSection,
  marketingTechniquesSection,
  powerRequirementsSection,
  inventoryStockDetailsSection,
  plantMachinerySection,
  rawMaterialsSection,
  transportationSection,
  manpowerSection,
  landRequirementsSection,
  implementationTimelineSection,
  conclusionSection,
} from './sectionSelectorShared';

function cloneSection(section) {
  return {
    ...section,
    fields: (section.fields || []).map((field) => ({
      ...field,
      ...(field.subFields
        ? { subFields: field.subFields.map((sub) => ({ ...sub })) }
        : {}),
    })),
  };
}

function withTheoryQuestions(section) {
  if (section.id === 'plant_machinery') {
    const cloned = cloneSection(section);
    cloned.fields = cloned.fields.map((field) => {
      if (field.name !== 'machinery_items') return field;
      return {
        ...field,
        subFields: [
          ...field.subFields,
          { name: 'purpose', label: 'Purpose', type: 'text' },
        ],
      };
    });
    return cloned;
  }
  if (section.id === 'manpower') {
    const cloned = cloneSection(section);
    cloned.fields = cloned.fields.map((field) => (
      field.name === 'direct_staff_count' ? { ...field, readOnly: false } : field
    ));
    return cloned;
  }
  return section;
}

const sharedTail = [
  statutoryApprovalsSection,
  marketingTechniquesSection,
  powerRequirementsSection,
  inventoryStockDetailsSection,
  plantMachinerySection,
  rawMaterialsSection,
  transportationSection,
  manpowerSection,
  landRequirementsSection,
  implementationTimelineSection,
  conclusionSection,
];

const sharedHead = [
  firmConstitutionSection,
  locationOverviewSection,
  accessConnectivitySection,
  promoterDetailsSection,
];

function theorySections(productNoun, extra = []) {
  return [
    ...sharedHead,
    makeProductDetailsSection(productNoun),
    makeProductCharacteristicsSection(productNoun),
    ...extra,
    swotAnalysisSection,
    targetMarketSection,
    competitorOverviewSection,
    marketTrendSection,
    ...sharedTail,
  ].map(withTheoryQuestions);
}

export const THEORY_MANUFACTURING_SECTIONS = theorySections('Product', [
  manufacturingCapacitySection,
  manufacturingProcessFlowchartSection,
]);

export const THEORY_TRADING_SECTIONS = theorySections('Product');

export const THEORY_SERVICE_WITH_STOCK_SECTIONS = theorySections('Service');

export const THEORY_SERVICE_WITHOUT_STOCK_SECTIONS = theorySections('Service');

export const THEORY_PROFILE_CONFIGS = {
  manufacturing: THEORY_MANUFACTURING_SECTIONS,
  trading: THEORY_TRADING_SECTIONS,
  service_with_stock: THEORY_SERVICE_WITH_STOCK_SECTIONS,
  service_without_stock: THEORY_SERVICE_WITHOUT_STOCK_SECTIONS,
};
