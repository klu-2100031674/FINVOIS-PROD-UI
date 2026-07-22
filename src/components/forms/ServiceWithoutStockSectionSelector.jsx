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

// Service sector WITHOUT stock: uses "Service" terminology; no manufacturing
// capacity or flowchart sections.
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

const ServiceWithoutStockSectionSelector = (props) => {
  const { templateId, ...rest } = props;

  const isEvJcbDrone =
    templateId === 'TERM_LOAN_EV_VEHICLE' ||
    templateId === 'TERM_LOAN_JCB_VEHICLE' ||
    templateId === 'TERM_LOAN_DRONE_VEHICLE';

  const isOtherThanEv = templateId === 'TERM_LOAN_OTHER_THAN_EV_VEHICLE';

  let config = SECTION_CONFIG;
  if (isEvJcbDrone) {
    config = [
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
      manpowerSection,
      conclusionSection,
    ];
  } else if (isOtherThanEv) {
    config = [
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
      manpowerSection,
      conclusionSection,
    ];
  }

  return <SectionSelectorBase {...rest} templateId={templateId} sectionConfig={config} />;
};

export default ServiceWithoutStockSectionSelector;
