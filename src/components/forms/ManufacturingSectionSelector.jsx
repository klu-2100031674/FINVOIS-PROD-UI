import React from 'react';
import SectionSelectorBase from './SectionSelectorBase';
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

// Manufacturing sector: includes Manufacturing Capacity and Manufacturing
// Flowchart sections, and uses "Product" terminology in section 5/6.
const SECTION_CONFIG = [
  firmConstitutionSection,
  locationOverviewSection,
  accessConnectivitySection,
  promoterDetailsSection,
  makeProductDetailsSection('Product'),
  makeProductCharacteristicsSection('Product'),
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
];

const ManufacturingSectionSelector = (props) => (
  <SectionSelectorBase {...props} sectionConfig={SECTION_CONFIG} />
);

export default ManufacturingSectionSelector;
