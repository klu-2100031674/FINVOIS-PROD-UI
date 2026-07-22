import React from 'react';
import SectionSelectorBase from './SectionSelectorBase';
import {
  firmConstitutionSection,
  locationOverviewSection,
  accessConnectivitySection,
  promoterDetailsSection,
  makeProductDetailsSection,
  makeProductCharacteristicsSection,
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

// Service sector WITH stock: uses "Service" terminology and retains the
// inventory / stock details section. No manufacturing capacity/flowchart.
const SECTION_CONFIG = [
  firmConstitutionSection,
  locationOverviewSection,
  accessConnectivitySection,
  promoterDetailsSection,
  makeProductDetailsSection('Service'),
  makeProductCharacteristicsSection('Service'),
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

const ServiceWithStockSectionSelector = (props) => (
  <SectionSelectorBase {...props} sectionConfig={SECTION_CONFIG} />
);

export default ServiceWithStockSectionSelector;
