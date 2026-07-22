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

// Trading sector: uses "Product" terminology, keeps stock/inventory, but has no
// manufacturing capacity or process flowchart.
const SECTION_CONFIG = [
  firmConstitutionSection,
  locationOverviewSection,
  accessConnectivitySection,
  promoterDetailsSection,
  makeProductDetailsSection('Product'),
  makeProductCharacteristicsSection('Product'),
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

const TradingSectionSelector = (props) => (
  <SectionSelectorBase {...props} sectionConfig={SECTION_CONFIG} />
);

export default TradingSectionSelector;
